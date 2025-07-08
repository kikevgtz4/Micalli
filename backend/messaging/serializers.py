# backend/messaging/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Max, F
from django.utils import timezone
from .models import Conversation, Message, MessageTemplate, ConversationFlag
from .serializers import (
    ConversationSerializer, 
    ConversationDetailSerializer,
    MessageSerializer, 
    MessageTemplateSerializer,
    ConversationFlagSerializer
)
from properties.models import Property
from accounts.models import User
from .services.content_filter import MessageContentFilter
import logging

logger = logging.getLogger(__name__)


class ConversationViewSet(viewsets.ModelViewSet):
    """Enhanced conversation viewset with property context"""
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    content_filter = MessageContentFilter()
    
    def get_queryset(self):
        """Get conversations for authenticated user with filters"""
        user = self.request.user
        queryset = Conversation.objects.filter(participants=user)
        
        # Add annotations for better performance
        queryset = queryset.annotate(
            message_count=Count('messages'),
            last_message_time=Max('messages__created_at'),
            unread_count=Count(
                'messages',
                filter=Q(messages__read=False) & ~Q(messages__sender=user)
            )
        )
        
        # Apply filters from query params
        self._apply_filters(queryset)
        
        # Prefetch related data for performance
        queryset = queryset.select_related('property').prefetch_related(
            'participants',
            'messages__sender'
        )
        
        return queryset.order_by('-updated_at')
    
    def _apply_filters(self, queryset):
        """Apply query parameter filters to queryset"""
        # Filter by conversation type
        conv_type = self.request.query_params.get('type')
        if conv_type and conv_type in dict(Conversation.CONVERSATION_TYPES):
            queryset = queryset.filter(conversation_type=conv_type)
        
        # Filter by property
        property_id = self.request.query_params.get('property')
        if property_id and property_id.isdigit():
            queryset = queryset.filter(property_id=property_id)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param and status_param in dict(Conversation.STATUS_CHOICES):
            queryset = queryset.filter(status=status_param)
        
        # Filter by unread messages
        unread_only = self.request.query_params.get('unread_only')
        if unread_only and unread_only.lower() == 'true':
            queryset = queryset.filter(unread_count__gt=0)
        
        return queryset
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve action"""
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSerializer
    
    @action(detail=False, methods=['post'], url_path='start')
    def start_conversation(self, request):
        """Start a new conversation with property context"""
        # Validate request data
        user_id = request.data.get('user_id')
        property_id = request.data.get('property_id')
        message_text = request.data.get('message', '').strip()
        template_type = request.data.get('template_type')
        metadata = request.data.get('metadata', {})
        
        # Validation
        if not user_id:
            return Response(
                {'error': 'User ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not message_text:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get users
        try:
            other_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent self-conversation
        if other_user == request.user:
            return Response(
                {'error': 'Cannot start conversation with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle property context
        property_obj = None
        conversation_type = 'general'
        
        if property_id:
            try:
                property_obj = Property.objects.get(id=property_id, is_active=True)
                conversation_type = 'property_inquiry'
                
                # Verify the other user is the property owner
                if property_obj.owner != other_user:
                    return Response(
                        {'error': 'The specified user is not the owner of this property'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Property.DoesNotExist:
                return Response(
                    {'error': 'Property not found or inactive'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Get or create conversation
        conversation = self._get_or_create_conversation(
            request.user, 
            other_user, 
            property_obj, 
            conversation_type,
            template_type
        )
        
        # Apply content filtering
        filter_result = self.content_filter.analyze_message(message_text)
        
        if filter_result['action'] == 'block':
            return Response(
                {
                    'error': 'Message contains prohibited content',
                    'violations': filter_result['violations']
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create message
        message = self._create_message(
            conversation,
            request.user,
            message_text,
            conversation_type,
            metadata,
            filter_result
        )
        
        # Update template usage if applicable
        if template_type:
            MessageTemplate.objects.filter(
                template_type=template_type
            ).update(
                usage_count=F('usage_count') + 1,
                last_used=timezone.now()
            )
        
        # Prepare response
        serializer = ConversationDetailSerializer(
            conversation, 
            context={'request': request}
        )
        response_data = serializer.data
        
        # Add content warning if applicable
        if filter_result['action'] == 'warn':
            response_data['content_warning'] = {
                'message': 'Your message may contain content that violates our policies',
                'violations': filter_result['violations']
            }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    def _get_or_create_conversation(self, user1, user2, property_obj, conv_type, template_type):
        """Get existing conversation or create new one"""
        # Build query for existing conversation
        query = Q(participants=user1) & Q(participants=user2)
        if property_obj:
            query &= Q(property=property_obj)
        
        conversation = Conversation.objects.filter(query).first()
        
        if conversation:
            # Reactivate if archived
            if conversation.status == 'archived':
                conversation.status = 'active'
                conversation.save(update_fields=['status'])
        else:
            # Create new conversation
            conversation = Conversation.objects.create(
                conversation_type=conv_type,
                initial_message_template=template_type or '',
                status='pending_response' if conv_type == 'property_inquiry' else 'active',
                property=property_obj
            )
            conversation.participants.add(user1, user2)
        
        return conversation
    
    def _create_message(self, conversation, sender, content, msg_type, metadata, filter_result):
        """Create a message with appropriate metadata"""
        message_data = {
            'conversation': conversation,
            'sender': sender,
            'content': content,
            'message_type': 'inquiry' if msg_type == 'property_inquiry' else 'text',
            'metadata': metadata
        }
        
        # Add filtered content if warnings exist
        if filter_result['action'] == 'warn':
            message_data.update({
                'filtered_content': filter_result['filtered_content'],
                'has_filtered_content': True,
                'filter_warnings': filter_result['violations']
            })
        
        return Message.objects.create(**message_data)
    
    @action(detail=True, methods=['post'], url_path='flag')
    def flag_conversation(self, request, pk=None):
        """Flag a conversation for review"""
        conversation = self.get_object()
        
        # Validate flag reason
        reason = request.data.get('reason')
        if not reason or reason not in dict(ConversationFlag.FLAG_REASONS):
            return Response(
                {'error': 'Valid flag reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already flagged by this user
        existing_flag = ConversationFlag.objects.filter(
            conversation=conversation,
            flagged_by=request.user,
            status__in=['pending', 'reviewing']
        ).exists()
        
        if existing_flag:
            return Response(
                {'error': 'You have already flagged this conversation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create flag
        flag = ConversationFlag.objects.create(
            conversation=conversation,
            flagged_by=request.user,
            reason=reason,
            description=request.data.get('description', ''),
            message_id=request.data.get('message_id')
        )
        
        # Update conversation status
        conversation.has_flagged_content = True
        conversation.flagged_at = timezone.now()
        conversation.flag_reason = reason
        conversation.save(update_fields=['has_flagged_content', 'flagged_at', 'flag_reason'])
        
        serializer = ConversationFlagSerializer(flag)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """Mark all messages in conversation as read"""
        conversation = self.get_object()
        updated_count = conversation.messages.filter(
            read=False
        ).exclude(
            sender=request.user
        ).update(read=True)
        
        return Response({
            'status': 'success',
            'messages_marked': updated_count
        })
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get conversation statistics"""
        conversation = self.get_object()
        
        # Calculate response times
        messages = conversation.messages.order_by('created_at')
        first_message = messages.first()
        
        response_time = None
        if first_message and messages.count() > 1:
            first_response = messages.exclude(sender=first_message.sender).first()
            if first_response:
                response_time = (first_response.created_at - first_message.created_at).total_seconds()
        
        # Get participant stats
        participant_stats = []
        for participant in conversation.participants.all():
            message_count = messages.filter(sender=participant).count()
            last_message = messages.filter(sender=participant).last()
            participant_stats.append({
                'user_id': participant.id,
                'username': participant.username,
                'message_count': message_count,
                'last_message_at': last_message.created_at if last_message else None
            })
        
        return Response({
            'total_messages': messages.count(),
            'unread_count': conversation.get_unread_count(request.user),
            'participant_count': conversation.participants.count(),
            'participant_stats': participant_stats,
            'created_at': conversation.created_at,
            'last_activity': conversation.updated_at,
            'response_time_seconds': response_time,
            'has_property': bool(conversation.property),
            'conversation_type': conversation.conversation_type,
            'status': conversation.status
        })


class MessageViewSet(viewsets.ModelViewSet):
    """Enhanced message viewset with content filtering"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    content_filter = MessageContentFilter()
    
    def get_queryset(self):
        """Get messages for a specific conversation"""
        conversation_id = self.kwargs.get('conversation_pk')
        
        # Verify user has access to conversation
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__participants=self.request.user
        ).select_related('sender').order_by('created_at')
    
    def create(self, request, *args, **kwargs):
        """Create message with content filtering"""
        conversation_id = self.kwargs.get('conversation_pk')
        
        # Get conversation and verify access
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=request.user
            )
        except Conversation.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if conversation allows messages
        if conversation.status in ['archived', 'flagged']:
            return Response(
                {'error': f'Cannot send messages to {conversation.status} conversations'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get and validate message content
        content = request.data.get('content', '').strip()
        if not content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Apply content filtering with context
        recent_messages = list(
            conversation.messages.order_by('-created_at')[:10].values_list('content', flat=True)
        )
        filter_result = self.content_filter.analyze_message(content, recent_messages)
        
        # Handle blocked content
        if filter_result['action'] == 'block':
            self._handle_blocked_message(conversation, filter_result)
            return Response(
                {
                    'error': 'Message blocked due to policy violations',
                    'violations': filter_result['violations'],
                    'action': 'blocked'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create message
        message = self._create_filtered_message(
            conversation,
            request.user,
            content,
            filter_result,
            request.data
        )
        
        # Update conversation status if needed
        self._update_conversation_status(conversation, request.user)
        
        # Prepare response
        serializer = self.get_serializer(message)
        response_data = serializer.data
        
        # Add warnings if applicable
        if filter_result['action'] == 'warn':
            response_data['content_warning'] = {
                'message': 'Your message may contain content that violates our policies',
                'violations': filter_result['violations'],
                'filtered_content': filter_result['filtered_content']
            }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    def _handle_blocked_message(self, conversation, filter_result):
        """Handle a message that was blocked by content filter"""
        logger.warning(
            f"Blocked message in conversation {conversation.id}: {filter_result['violations']}"
        )
        
        # Auto-flag the conversation
        ConversationFlag.objects.create(
            conversation=conversation,
            flagged_by=self.request.user,
            reason=self._determine_flag_reason(filter_result['violations']),
            description=f"Auto-flagged: {filter_result['violations']}"
        )
    
    def _determine_flag_reason(self, violations):
        """Determine appropriate flag reason based on violations"""
        violation_types = [v['type'] for v in violations]
        
        if 'payment_circumvention' in violation_types:
            return 'payment_circumvention'
        elif any(t in violation_types for t in ['phone_number', 'email', 'messaging_app']):
            return 'contact_info'
        else:
            return 'other'
    
    def _create_filtered_message(self, conversation, sender, content, filter_result, data):
        """Create a message with appropriate filtering applied"""
        message_data = {
            'conversation': conversation,
            'sender': sender,
            'content': content,
            'message_type': data.get('message_type', 'text'),
            'metadata': data.get('metadata', {})
        }
        
        # Add filtered content if warnings exist
        if filter_result['action'] == 'warn':
            message_data.update({
                'filtered_content': filter_result['filtered_content'],
                'has_filtered_content': True,
                'filter_warnings': filter_result['violations']
            })
        
        return Message.objects.create(**message_data)
    
    def _update_conversation_status(self, conversation, sender):
        """Update conversation status based on new message"""
        if conversation.status == 'pending_response' and conversation.property:
            if sender == conversation.property.owner:
                # Owner responded, calculate response time
                first_message = conversation.messages.order_by('created_at').first()
                if first_message:
                    conversation.owner_response_time = timezone.now() - first_message.created_at
                conversation.status = 'active'
                conversation.save(update_fields=['owner_response_time', 'status'])


class MessageTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """Message templates for quick responses"""
    serializer_class = MessageTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = MessageTemplate.objects.none()  # Default empty queryset
    
    def get_queryset(self):
        """Get active templates with filtering"""
        queryset = MessageTemplate.objects.filter(is_active=True)
        
        # Filter by template type
        template_type = self.request.query_params.get('type')
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        
        # Filter by property type
        property_type = self.request.query_params.get('property_type')
        if property_type:
            queryset = queryset.filter(
                Q(show_for_property_types__contains=[]) |
                Q(show_for_property_types__contains=[property_type])
            )
        
        # Language preference
        language = self.request.query_params.get('lang', 'en')
        if language == 'es':
            # Prioritize templates with Spanish translations
            queryset = queryset.exclude(content_es='')
        
        return queryset.order_by('order', 'title')
    
    @action(detail=True, methods=['post'])
    def track_usage(self, request, pk=None):
        """Track template usage"""
        template = self.get_object()
        template.increment_usage()
        
        return Response({
            'status': 'success',
            'usage_count': template.usage_count
        })