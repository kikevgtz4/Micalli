# backend/messaging/permissions.py

from rest_framework import permissions
from .models import Conversation

class IsConversationParticipant(permissions.BasePermission):
    """Check if user is a participant in the conversation."""
    
    def has_permission(self, request, view):
        print(f"Permission check: method={request.method}, kwargs={view.kwargs}")
        
        conversation_id = view.kwargs.get('conversation_pk')
        if not conversation_id:
            print("No conversation_id found")
            return True
        
        # Allow GET/HEAD/OPTIONS for participants
        if request.method in permissions.SAFE_METHODS:
            return Conversation.objects.filter(
                id=conversation_id,
                participants=request.user
            ).exists()
        
        # For POST/PUT/DELETE, check additional permissions
        conversation = Conversation.objects.filter(
            id=conversation_id,
            participants=request.user
        ).first()
        
        if not conversation:
            return False
        
        # Don't allow modifications to archived/flagged conversations
        if conversation.status in ['archived', 'flagged'] and request.method != 'GET':
            return False
        
        return True

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.sender == request.user