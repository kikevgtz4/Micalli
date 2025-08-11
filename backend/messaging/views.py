# backend/messaging/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Max, F, Prefetch
from django.utils import timezone
from django.core.cache import cache
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
from .pagination import MessageCursorPagination
from .permissions import IsConversationParticipant


logger = logging.getLogger(__name__)


class ConversationViewSet(viewsets.ModelViewSet):
    """
    Enhanced conversation viewset with property context.
    
    Provides endpoints for managing conversations between users,
    with special handling for property inquiries and content filtering.
    """
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    content_filter = MessageContentFilter()
    
    def get_queryset(self):
        """Get conversations for authenticated user with optimized queries."""
        user = self.request.user
        
        # Base queryset with select_related for optimization
        queryset = Conversation.objects.filter(
            participants=user
        ).select_related(
            'property',
            'property__owner'
        ).prefetch_related(
            'participants'
        )
        
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
        queryset = self._apply_filters(queryset)
        
        # Order by last activity
        return queryset.order_by('-updated_at')
    
    def _apply_filters(self, queryset):
        """Apply query parameter filters to queryset."""
        # Filter by conversation type
        conv_type = self.request.query_params.get('type')
        if conv_type and conv_type in dict(Conversation.CONVERSATION_TYPES):
            queryset = queryset.filter(conversation_type=conv_type)
        
        # Filter by property
        property_id = self.request.query_params.get('property')
        if property_id:
            try:
                queryset = queryset.filter(property_id=int(property_id))
            except (ValueError, TypeError):
                pass  # Invalid property_id, ignore filter
        
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
        """Use detailed serializer for retrieve action."""
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSerializer
    
    @action(detail=False, methods=['post'], url_path='start')
    def start_conversation(self, request):
        """
        Start a new conversation or continue existing one.
        
        Required fields:
        - user_id: ID of the user to start conversation with
        - message: Initial message content
        
        Optional fields:
        - property_id: ID of property (for property inquiries)
        - template_type: Type of message template used
        - metadata: Additional structured data
        """
        # Validate input
        user_id = request.data.get('user_id')
        property_id = request.data.get('property_id')
        message_text = request.data.get('message', '').strip()
        template_type = request.data.get('template_type')
        metadata = request.data.get('metadata', {})
        
        # Input validation
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
        
        # Validate message length
        if len(message_text) > 5000:  # Configurable limit
            return Response(
                {'error': 'Message too long. Maximum 5000 characters allowed.'},
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
                property_obj = Property.objects.select_related('owner').get(
                    id=property_id,
                    is_active=True
                )
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
        
        # Filter message content
        filter_result = self.content_filter.analyze_message(message_text)
        
        if filter_result['action'] == 'block':
            # Log blocked attempt
            logger.warning(
                f"Blocked message from user {request.user.id} "
                f"in conversation attempt with user {other_user.id}"
            )
            
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
        
        # Track template usage if applicable
        if template_type:
            self._track_template_usage(template_type)
        
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
        """Get existing conversation or create new one."""
        from django.db import transaction
        
        with transaction.atomic():
            # Build query for existing conversation
            query = Q(participants=user1) & Q(participants=user2)
            if property_obj:
                query &= Q(property=property_obj)
            
            # Try to find existing conversation with select_for_update
            conversation = Conversation.objects.select_for_update().filter(query).first()
            
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
    
    def _create_message(self, conversation, sender, content, conv_type, metadata, filter_result):
        """Create a message with appropriate filtering."""
        message_data = {
            'conversation': conversation,
            'sender': sender,
            'content': content,
            'message_type': 'inquiry' if conv_type == 'property_inquiry' else 'text',
            'metadata': metadata
        }
        
        # Add filtered content if needed
        if filter_result['action'] == 'warn':
            message_data.update({
                'filtered_content': filter_result['filtered_content'],
                'has_filtered_content': True,
                'filter_warnings': filter_result['violations']
            })
        
        return Message.objects.create(**message_data)
    
    def _track_template_usage(self, template_type):
        """Track usage of message template."""
        try:
            template = MessageTemplate.objects.get(
                template_type=template_type,
                is_active=True
            )
            template.increment_usage()
        except MessageTemplate.DoesNotExist:
            logger.warning(f"Template type '{template_type}' not found")
    
    @action(detail=True, methods=['post'], url_path='flag')
    def flag_conversation(self, request, pk=None):
        """Flag a conversation for review."""
        conversation = self.get_object()
        
        # Validate reason
        reason = request.data.get('reason')
        if not reason or reason not in dict(ConversationFlag.FLAG_REASONS):
            return Response(
                {'error': 'Valid reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for duplicate flags
        existing_flag = ConversationFlag.objects.filter(
            conversation=conversation,
            flagged_by=request.user,
            status='pending'
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
        
        # Update conversation
        conversation.has_flagged_content = True
        conversation.flagged_at = timezone.now()
        conversation.flag_reason = reason
        conversation.save(update_fields=['has_flagged_content', 'flagged_at', 'flag_reason'])
        
        # Log the flag
        logger.info(f"Conversation {conversation.id} flagged by user {request.user.id} for {reason}")
        
        return Response(
            {'message': 'Conversation flagged for review'},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """Mark all messages in conversation as read."""
        conversation = self.get_object()
        updated_count = conversation.mark_messages_as_read(request.user)
        
        return Response({
            'status': 'success',
            'messages_marked': updated_count
        })
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get detailed conversation statistics."""
        conversation = self.get_object()
        
        # Use cached stats if available
        cache_key = f'conv_stats_{conversation.id}_{request.user.id}'
        cached_stats = cache.get(cache_key)
        if cached_stats:
            return Response(cached_stats)
        
        # Calculate stats
        messages = conversation.messages.select_related('sender')
        stats = {
            'total_messages': messages.count(),
            'unread_count': conversation.get_unread_count(request.user),
            'participant_count': conversation.participants.count(),
            'created_at': conversation.created_at,
            'last_activity': conversation.updated_at,
            'has_property': bool(conversation.property),
            'conversation_type': conversation.conversation_type,
            'status': conversation.status,
            'message_frequency': self._calculate_message_frequency(messages),
            'participant_activity': self._calculate_participant_activity(messages)
        }
        
        # Add response time if applicable
        if conversation.owner_response_time:
            stats['owner_response_time'] = conversation.owner_response_time.total_seconds()
        
        # Cache for 5 minutes
        cache.set(cache_key, stats, 300)
        
        return Response(stats)
    
    def _calculate_message_frequency(self, messages):
        """Calculate message frequency stats."""
        if messages.count() < 2:
            return None
        
        first_msg = messages.first()
        last_msg = messages.last()
        duration = (last_msg.created_at - first_msg.created_at).total_seconds()
        
        if duration > 0:
            return {
                'messages_per_hour': messages.count() / (duration / 3600),
                'average_gap_minutes': (duration / 60) / (messages.count() - 1)
            }
        return None
    
    def _calculate_participant_activity(self, messages):
        """Calculate activity breakdown by participant."""
        activity = {}
        for msg in messages:
            sender_id = str(msg.sender_id)
            if sender_id not in activity:
                activity[sender_id] = {
                    'message_count': 0,
                    'last_message': None
                }
            activity[sender_id]['message_count'] += 1
            activity[sender_id]['last_message'] = msg.created_at
        
        return activity

class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for messages within a conversation.
    Handles all message-related operations as a nested resource.
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsConversationParticipant]
    content_filter = MessageContentFilter()
    pagination_class = MessageCursorPagination
    
    def get_queryset(self):
        """Get messages for the conversation."""
        conversation_id = self.kwargs.get('conversation_pk')
        
        # Verify user has access to this conversation
        conversation = get_object_or_404(
            Conversation,
            id=conversation_id,
            participants=self.request.user
        )
        
        # Base queryset with optimizations
        queryset = Message.objects.filter(
            conversation_id=conversation_id
        ).select_related(
            'sender',
            'sender__university'
        ).prefetch_related(
            'sender__profile_picture'
        ).order_by('created_at')
        
        # Mark undelivered messages as delivered
        undelivered = queryset.filter(
            delivered=False
        ).exclude(sender=self.request.user)
        
        # Bulk update for performance
        if undelivered.exists():
            undelivered.update(
                delivered=True,
                delivered_at=timezone.now()
            )
        
        # Apply filters
        message_type = self.request.query_params.get('type')
        if message_type and message_type in dict(Message.MESSAGE_TYPES):
            queryset = queryset.filter(message_type=message_type)
        
        # Filter by read status
        unread_only = self.request.query_params.get('unread_only')
        if unread_only and unread_only.lower() == 'true':
            queryset = queryset.filter(read=False).exclude(sender=self.request.user)
        
        # Filter by date range
        since = self.request.query_params.get('since')
        if since:
            try:
                since_date = timezone.parse_datetime(since)
                queryset = queryset.filter(created_at__gte=since_date)
            except (ValueError, TypeError):
                pass
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Send a message to the conversation with content filtering."""
        conversation_id = self.kwargs.get('conversation_pk')
        
        # Get conversation and verify access
        try:
            conversation = Conversation.objects.select_related(
                'property',
                'property__owner'
            ).get(
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
        
        # Validate content
        content = request.data.get('content', '').strip()
        
        if not content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(content) > 5000:
            return Response(
                {'error': 'Message too long. Maximum 5000 characters allowed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get conversation history for context-aware filtering
        recent_messages = list(
            conversation.messages.order_by('-created_at')
            .values_list('content', flat=True)[:10]
        )
        
        # Filter content with context
        filter_result = self.content_filter.analyze_message(content, recent_messages)
        
        # Handle blocked content
        if filter_result['action'] == 'block':
            # Log violation
            logger.warning(
                f"Blocked message from user {request.user.id} "
                f"in conversation {conversation_id}: {filter_result['violations']}"
            )
            
            # Auto-flag conversation for severe violations
            if any(v['severity'] == 'critical' for v in filter_result['violations']):
                flag = ConversationFlag.objects.create(
                    conversation=conversation,
                    flagged_by=request.user,
                    reason=self._get_flag_reason(filter_result['violations']),
                    description=f"Auto-flagged: {filter_result['violations']}"
                )
                
                # Update conversation status
                conversation.has_flagged_content = True
                conversation.flagged_at = timezone.now()
                conversation.save(update_fields=['has_flagged_content', 'flagged_at'])
            
            return Response(
                {
                    'error': 'Message blocked due to policy violations',
                    'violations': filter_result['violations'],
                    'action': 'blocked'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare message data
        message_data = {
            'conversation': conversation,
            'sender': request.user,
            'content': content,
            'message_type': request.data.get('message_type', 'text'),
            'metadata': request.data.get('metadata', {})
        }
        
        # Add filtered content if warned
        if filter_result['action'] == 'warn':
            message_data.update({
                'filtered_content': filter_result['filtered_content'],
                'has_filtered_content': True,
                'filter_warnings': filter_result['violations']
            })
        
        # Handle attachments if provided
        attachment = request.FILES.get('attachment')
        if attachment:
            # Validate file size and type
            if attachment.size > 10 * 1024 * 1024:  # 10MB limit
                return Response(
                    {'error': 'File too large. Maximum 10MB allowed.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
            if attachment.content_type not in allowed_types:
                return Response(
                    {'error': 'Invalid file type. Only JPEG, PNG, GIF, and PDF allowed.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            message_data['attachment'] = attachment
            message_data['attachment_type'] = attachment.content_type
        
        # Create message
        message = Message.objects.create(**message_data)
        
        # Update conversation status if needed
        self._update_conversation_status(conversation, request.user)
        
        # Serialize response
        serializer = self.get_serializer(message)
        response_data = serializer.data
        
        # Add warnings if applicable
        if filter_result['action'] == 'warn':
            return Response({
                'data': response_data,
                'contentWarning': {
                    'message': 'Your message may contain content that violates our policies',
                    'violations': filter_result['violations'],
                    'filtered_content': filter_result['filtered_content']
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    def _get_flag_reason(self, violations):
        """Determine flag reason from violations."""
        violation_to_reason = {
            'phone_number': 'contact_info',
            'email': 'contact_info',
            'payment_circumvention': 'payment_circumvention',
            'inappropriate': 'inappropriate',
            'harassment': 'harassment'
        }
        
        for violation in violations:
            reason = violation_to_reason.get(violation['type'])
            if reason:
                return reason
        
        return 'other'
    
    def _update_conversation_status(self, conversation, sender):
        """Update conversation status based on activity."""
        # Handle owner response to pending inquiries
        if (conversation.status == 'pending_response' and 
            conversation.property and 
            sender == conversation.property.owner):
            
            # Calculate response time from first message
            first_message = conversation.messages.order_by('created_at').first()
            if first_message:
                conversation.owner_response_time = timezone.now() - first_message.created_at
            
            conversation.status = 'active'
            conversation.save(update_fields=['owner_response_time', 'status'])
            
            # Log good response time
            if conversation.owner_response_time and conversation.owner_response_time.total_seconds() < 3600:
                logger.info(f"Quick response from owner {sender.id} in {conversation.owner_response_time}")
    
    @action(detail=True, methods=['patch'], url_path='mark-read')
    def mark_read(self, request, pk=None, conversation_pk=None):
        """Mark a specific message as read."""
        message = self.get_object()
        
        # Only mark if recipient
        if message.sender != request.user:
            message.mark_as_read()
            
            # Also mark all previous messages as read
            Message.objects.filter(
                conversation_id=conversation_pk,
                created_at__lte=message.created_at,
                read=False
            ).exclude(sender=request.user).update(
                read=True,
                read_at=timezone.now()
            )
            
            return Response({'status': 'success', 'marked_count': 1})
        
        return Response(
            {'error': 'Cannot mark own message as read'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request, conversation_pk=None):
        """Mark all messages in conversation as read."""
        updated = Message.objects.filter(
            conversation_id=conversation_pk,
            read=False
        ).exclude(sender=request.user).update(
            read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'status': 'success',
            'marked_count': updated
        })
    
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request, conversation_pk=None):
        """Get count of unread messages."""
        count = Message.objects.filter(
            conversation_id=conversation_pk,
            read=False
        ).exclude(sender=request.user).count()
        
        return Response({'unread_count': count})


class MessageTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Message templates for quick responses.
    
    Read-only access to pre-defined message templates
    with usage tracking.
    """
    serializer_class = MessageTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get active templates with filtering."""
        # Use cached templates if available
        cache_key = 'active_message_templates'
        cached_templates = cache.get(cache_key)
        
        if cached_templates is not None:
            queryset = MessageTemplate.objects.filter(
                id__in=[t.id for t in cached_templates]
            )
        else:
            queryset = MessageTemplate.objects.filter(is_active=True)
            # Cache for 1 hour
            cache.set(cache_key, list(queryset), 3600)
        
        # Apply filters
        template_type = self.request.query_params.get('type')
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        
        property_type = self.request.query_params.get('property_type')
        if property_type:
            queryset = queryset.filter(
                Q(show_for_property_types__len=0) |
                Q(show_for_property_types__contains=[property_type])
            )
        
        # Language preference
        language = self.request.query_params.get('lang', 'en')
        if language == 'es':
            # Prioritize templates with Spanish translations
            queryset = queryset.exclude(content_es='')
        
        return queryset.order_by('order', 'title')
    
    @action(detail=True, methods=['post'], url_path='track-usage')
    def track_usage(self, request, pk=None):
        """Track template usage."""
        template = self.get_object()
        template.increment_usage()
        
        # Clear template cache
        cache.delete('active_message_templates')
        
        return Response({'status': 'Usage tracked'})
