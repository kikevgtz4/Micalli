from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Max, Count, F, OuterRef, Subquery
from django.shortcuts import get_object_or_404
from .models import Conversation, Message, ViewingRequest
from .serializers import ConversationSerializer, ConversationDetailSerializer, MessageSerializer, ViewingRequestSerializer
from properties.models import Property
from django.contrib.auth import get_user_model

User = get_user_model()

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-last_message_time')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Mark messages as read
        instance.messages.filter(read=False).exclude(sender=request.user).update(read=True)
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """Start a new conversation"""
        user_id = request.data.get('user_id')
        property_id = request.data.get('property_id')
        
        # Validate required data
        if not user_id:
            return Response(
                {'error': 'User ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create conversation
        other_user = get_object_or_404(User, id=user_id)
        
        # Check if conversation already exists
        query = Q(participants=request.user) & Q(participants=other_user)
        if property_id:
            property_obj = get_object_or_404(Property, id=property_id)
            query &= Q(property=property_obj)
            
            # Don't allow conversation with self
            if property_obj.owner == request.user and other_user == request.user:
                return Response(
                    {'error': 'Cannot start conversation with yourself'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Don't allow conversation with self
            if other_user == request.user:
                return Response(
                    {'error': 'Cannot start conversation with yourself'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        conversations = Conversation.objects.filter(query)
        
        if conversations.exists():
            conversation = conversations.first()
        else:
            # Create new conversation
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, other_user)
            
            if property_id:
                property_obj = get_object_or_404(Property, id=property_id)
                conversation.property = property_obj
                conversation.save()
        
        # Create initial message if provided
        message_text = request.data.get('message')
        if message_text:
            Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=message_text
            )
        
        serializer = ConversationDetailSerializer(conversation, context={'request': request})
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_pk')
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__participants=self.request.user
        )
    
    def create(self, request, *args, **kwargs):
        conversation_id = self.kwargs.get('conversation_pk')
        conversation = get_object_or_404(
            Conversation, 
            id=conversation_id,
            participants=request.user
        )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(sender=request.user, conversation=conversation)
        
        # Update conversation timestamp
        conversation.save()  # This will update the updated_at field
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ViewingRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ViewingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Show viewing requests that user has created or received (as property owner)
        return ViewingRequest.objects.filter(
            Q(requester=user) | Q(property__owner=user)
        ).select_related('property', 'requester')
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        viewing_request = self.get_object()
        
        # Only property owner can update status
        if viewing_request.property.owner != request.user:
            return Response(
                {'error': 'Only the property owner can update the status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        if new_status not in dict(ViewingRequest.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        viewing_request.status = new_status
        viewing_request.save()
        
        # Create notification message in the conversation
        if viewing_request.conversation:
            status_message = f"Viewing request for {viewing_request.proposed_date.strftime('%d %b %Y, %H:%M')} has been {new_status}."
            Message.objects.create(
                conversation=viewing_request.conversation,
                sender=request.user,
                content=status_message
            )
        
        return Response(ViewingRequestSerializer(viewing_request).data)