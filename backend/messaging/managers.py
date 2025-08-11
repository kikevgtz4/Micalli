# backend/messaging/managers.py
from django.db import models
from django.db.models import Count, Q, Max, Prefetch


class ConversationQuerySet(models.QuerySet):
    """Optimized queryset for conversations"""
    
    def with_details(self):
        """Prefetch all related data for list views"""
        from .models import Message  # Import here to avoid circular imports
        
        return self.select_related(
            'property',
            'property__owner',
            'latest_message',
            'latest_message__sender'
        ).prefetch_related(
            'participants',
            'participants__university',
            Prefetch(
                'messages',
                queryset=Message.objects.order_by('-created_at')[:1],
                to_attr='recent_messages'
            )
        )
    
    def for_user(self, user):
        """Get conversations for a specific user"""
        return self.filter(participants=user)
    
    def active(self):
        """Get only active conversations"""
        return self.filter(status='active')
    
    def unread_for_user(self, user):
        """Get conversations with unread messages"""
        return self.filter(
            messages__read=False
        ).exclude(
            messages__sender=user
        ).distinct()
    
    def with_unread_count(self, user):
        """Annotate with unread count for user"""
        return self.annotate(
            unread_count=Count(
                'messages',
                filter=Q(messages__read=False) & ~Q(messages__sender=user)
            )
        )


class ConversationManager(models.Manager):
    """Custom manager for Conversation model"""
    
    def get_queryset(self):
        return ConversationQuerySet(self.model, using=self._db)
    
    def with_details(self):
        return self.get_queryset().with_details()
    
    def for_user(self, user):
        return self.get_queryset().for_user(user)


class MessageQuerySet(models.QuerySet):
    """Optimized queryset for messages"""
    
    def with_sender_details(self):
        """Prefetch sender information"""
        return self.select_related(
            'sender',
            'sender__university'
        )
    
    def unread(self):
        """Get only unread messages"""
        return self.filter(read=False)
    
    def not_deleted(self):
        """Exclude soft-deleted messages"""
        return self.filter(is_deleted=False)


class MessageManager(models.Manager):
    """Custom manager for Message model"""
    
    def get_queryset(self):
        return MessageQuerySet(self.model, using=self._db)
    
    def with_sender_details(self):
        return self.get_queryset().with_sender_details()
