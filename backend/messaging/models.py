from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

class Conversation(models.Model):
    """Conversation between two users"""
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Optional property reference if conversation is about a property
    property = models.ForeignKey('properties.Property', on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    
    class Meta:
        verbose_name = _('Conversation')
        verbose_name_plural = _('Conversations')
    
    def __str__(self):
        return f"Conversation #{self.id}"
    
    def other_participant(self, user):
        """Get the other participant in a conversation"""
        return self.participants.exclude(id=user.id).first()


class Message(models.Model):
    """Individual message within a conversation"""
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Attachment support
    attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)
    attachment_type = models.CharField(max_length=50, blank=True)
    
    class Meta:
        verbose_name = _('Message')
        verbose_name_plural = _('Messages')
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message from {self.sender.username} in {self.conversation}"


class ViewingRequest(models.Model):
    """Property viewing requests"""
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('approved', _('Approved')),
        ('declined', _('Declined')),
        ('completed', _('Completed')),
        ('canceled', _('Canceled'))
    ]
    
    property = models.ForeignKey('properties.Property', on_delete=models.CASCADE, related_name='viewing_requests')
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='viewing_requests')
    conversation = models.ForeignKey(Conversation, on_delete=models.SET_NULL, null=True, related_name='viewing_requests')
    proposed_date = models.DateTimeField()
    alternative_dates = models.JSONField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Viewing Request')
        verbose_name_plural = _('Viewing Requests')
    
    def __str__(self):
        return f"Viewing for {self.property.title} by {self.requester.username}"