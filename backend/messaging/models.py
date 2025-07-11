# backend/messaging/models.py
from datetime import timezone
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.db.models import Q, functions

class Conversation(models.Model):
    """Enhanced conversation model with property context and status tracking"""
    
    # Core relationships
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='conversations'
    )
    property = models.ForeignKey(
        'properties.Property', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='conversations'
    )
    
    # Conversation metadata
    CONVERSATION_TYPES = [
        ('general', _('General')),
        ('property_inquiry', _('Property Inquiry')),
        ('application', _('Application')),
        ('roommate_inquiry', _('Roommate Inquiry')),
    ]
    conversation_type = models.CharField(
        max_length=20, 
        choices=CONVERSATION_TYPES, 
        default='general'
    )
    
    # Status tracking
    STATUS_CHOICES = [
        ('active', _('Active')),
        ('pending_response', _('Pending Response')),
        ('pending_application', _('Pending Application')),
        ('application_submitted', _('Application Submitted')),
        ('booking_confirmed', _('Booking Confirmed')),
        ('archived', _('Archived')),
        ('flagged', _('Flagged for Review')),
    ]
    status = models.CharField(
        max_length=25,
        choices=STATUS_CHOICES,
        default='active'
    )
    
    # Inquiry tracking
    initial_message_template = models.CharField(
        max_length=50, 
        blank=True,
        help_text="Template used for initial contact"
    )
    
    # Response time tracking
    owner_response_time = models.DurationField(
        null=True, 
        blank=True,
        help_text="Time taken for property owner to respond"
    )
    
    # Content moderation
    has_flagged_content = models.BooleanField(default=False)
    flagged_at = models.DateTimeField(null=True, blank=True)
    flag_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Conversation')
        verbose_name_plural = _('Conversations')
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['-updated_at']),
            models.Index(fields=['property', 'status']),
        ]
        constraints = [
        models.UniqueConstraint(
            fields=['property'],
            condition=Q(property__isnull=False, status='active'),
            name='unique_active_property_conversation'
        )
    ]
    
    def __str__(self):
        if self.property:
            return f"Conversation about {self.property.title} (#{self.id})"
        return f"Conversation #{self.id}"
    
    def other_participant(self, user):
        """Get the other participant in a conversation"""
        return self.participants.exclude(id=user.id).first()
    
    def mark_messages_as_read(self, user):
        """Mark all messages in conversation as read for a user"""
        self.messages.exclude(sender=user).update(read=True)
    
    def get_unread_count(self, user):
        """Get number of unread messages for a user"""
        return self.messages.exclude(sender=user).filter(read=False).count()


class Message(models.Model):
    """Enhanced message model with metadata and filtering"""
    
    # Core fields
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='sent_messages'
    )
    content = models.TextField()

    delivered = models.BooleanField(default=False, db_index=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Message metadata
    MESSAGE_TYPES = [
        ('text', _('Text Message')),
        ('inquiry', _('Property Inquiry')),
        ('document_share', _('Document Share')),
        ('application_update', _('Application Update')),
        ('system', _('System Message')),
    ]
    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPES,
        default='text'
    )
    
    # Structured data storage
    metadata = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Store structured data like move-in date, duration, etc."
    )
    
    # Attachment support
    attachment = models.FileField(
        upload_to='message_attachments/%Y/%m/', 
        null=True, 
        blank=True
    )
    attachment_type = models.CharField(max_length=50, blank=True)
    
    # Content filtering
    filtered_content = models.TextField(
        blank=True,
        help_text="Content after applying filters (if different from original)"
    )
    has_filtered_content = models.BooleanField(default=False)
    filter_warnings = models.JSONField(default=list, blank=True)
    
    # System messages
    is_system_message = models.BooleanField(default=False)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        verbose_name = _('Message')
        verbose_name_plural = _('Messages')
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['sender', '-created_at']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.username} in {self.conversation}"
    
    def save(self, *args, **kwargs):
        # Update conversation timestamp when new message is added
        if not self.pk:  # New message
            self.conversation.updated_at = models.functions.Now()
            self.conversation.save(update_fields=['updated_at'])
        super().save(*args, **kwargs)

    def mark_as_delivered(self):
        """Mark message as delivered"""
        if not self.delivered:
            self.delivered = True
            self.delivered_at = timezone.now()
            self.save(update_fields=['delivered', 'delivered_at'])
    
    def mark_as_read(self):
        """Mark message as read (also marks as delivered)"""
        if not self.read:
            self.read = True
            self.read_at = timezone.now()
            if not self.delivered:
                self.delivered = True
                self.delivered_at = timezone.now()
            self.save(update_fields=['read', 'read_at', 'delivered', 'delivered_at'])


class MessageTemplate(models.Model):
    """Pre-defined message templates for common inquiries"""
    
    TEMPLATE_TYPES = [
        ('initial_inquiry', _('Initial Property Inquiry')),
        ('ask_amenities', _('Ask About Amenities')),
        ('ask_availability', _('Check Availability')),
        ('ask_requirements', _('Ask About Requirements')),
        ('ask_neighborhood', _('Ask About Neighborhood')),
        ('ask_utilities', _('Ask About Utilities')),
        ('roommate_introduction', _('Roommate Introduction')),
    ]
    
    template_type = models.CharField(
        max_length=30, 
        choices=TEMPLATE_TYPES, 
        unique=True
    )
    title = models.CharField(max_length=100)
    title_es = models.CharField(
        max_length=100, 
        blank=True, 
        help_text="Spanish translation"
    )
    
    content = models.TextField(
        help_text="Use placeholders like {property_title}, {user_name}, {move_in_date}, etc."
    )
    content_es = models.TextField(
        blank=True, 
        help_text="Spanish translation"
    )
    
    # Template configuration
    variables = models.JSONField(
        default=list, 
        help_text="List of variable names used in template"
    )
    show_for_property_types = models.JSONField(
        default=list,
        blank=True,
        help_text="Property types this template is relevant for"
    )
    
    # Status and tracking
    is_active = models.BooleanField(default=True, db_index=True)
    order = models.IntegerField(default=0, help_text="Display order")
    usage_count = models.IntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'title']
        verbose_name = _('Message Template')
        verbose_name_plural = _('Message Templates')
        indexes = [
            models.Index(fields=['is_active', 'order']),
        ]
    
    def __str__(self):
        return self.title
    
    def increment_usage(self):
        """Increment usage count and update last used timestamp"""
        self.usage_count = models.F('usage_count') + 1
        self.last_used = models.functions.Now()
        self.save(update_fields=['usage_count', 'last_used'])


class ConversationFlag(models.Model):
    """Track flagged conversations for review"""
    
    FLAG_REASONS = [
        ('spam', _('Spam or Advertising')),
        ('contact_info', _('Sharing Contact Information')),
        ('payment_circumvention', _('Attempting to Bypass Platform')),
        ('inappropriate', _('Inappropriate Content')),
        ('harassment', _('Harassment or Abuse')),
        ('scam', _('Potential Scam')),
        ('other', _('Other')),
    ]
    
    STATUS_CHOICES = [
        ('pending', _('Pending Review')),
        ('reviewing', _('Under Review')),
        ('resolved', _('Resolved')),
        ('dismissed', _('Dismissed')),
    ]
    
    # Core relationships
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='flags'
    )
    message = models.ForeignKey(
        Message, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        help_text="Specific message that triggered the flag"
    )
    flagged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='conversation_flags_created'
    )
    
    # Flag details
    reason = models.CharField(max_length=30, choices=FLAG_REASONS)
    description = models.TextField(blank=True)
    
    # Review process
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        db_index=True
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversation_flags_reviewed'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    action_taken = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Conversation Flag')
        verbose_name_plural = _('Conversation Flags')
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['conversation', 'status']),
        ]
        
    def __str__(self):
        return f"Flag: {self.get_reason_display()} - {self.conversation}"