# backend/messaging/admin.py
from django.contrib import admin
from .models import Conversation, Message, MessageTemplate, ConversationFlag


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ('sender', 'created_at', 'has_filtered_content')
    fields = ('sender', 'content', 'message_type', 'read', 'created_at')


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation_type', 'property', 'status', 'get_participants', 'created_at')
    list_filter = ('conversation_type', 'status', 'created_at')
    search_fields = ('participants__username', 'participants__email', 'property__title')
    inlines = [MessageInline]
    readonly_fields = ('created_at', 'updated_at', 'owner_response_time')
    
    def get_queryset(self, request):
        """Optimize queryset to avoid N+1 queries"""
        qs = super().get_queryset(request)
        return qs.prefetch_related('participants').select_related('property')
    
    def get_participants(self, obj):
        return ", ".join([user.username for user in obj.participants.all()])
    get_participants.short_description = 'Participants'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'conversation', 'message_type', 'content_preview', 'read', 'has_filtered_content', 'created_at')
    list_filter = ('message_type', 'read', 'has_filtered_content', 'created_at')
    search_fields = ('content', 'sender__username', 'conversation__id')
    readonly_fields = ('created_at', 'filtered_content', 'filter_warnings')
    
    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(MessageTemplate)
class MessageTemplateAdmin(admin.ModelAdmin):
    list_display = ('template_type', 'title', 'usage_count', 'is_active', 'order')
    list_filter = ('template_type', 'is_active')  # template_type already provides good filtering
    search_fields = ('title', 'content', 'template_type')  # Added template_type to search
    readonly_fields = ('usage_count', 'created_at', 'updated_at', 'last_used')  # Added last_used
    ordering = ('order', 'title')


@admin.register(ConversationFlag)
class ConversationFlagAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'flagged_by', 'reason', 'status', 'created_at')
    list_filter = ('reason', 'status', 'created_at')
    search_fields = ('conversation__id', 'flagged_by__username', 'description')
    readonly_fields = ('created_at',)
    
    actions = ['mark_reviewed', 'mark_resolved', 'mark_dismissed']
    
    def mark_reviewed(self, request, queryset):
        queryset.update(status='reviewed', reviewed_by=request.user)
    mark_reviewed.short_description = 'Mark as reviewed'
    
    def mark_resolved(self, request, queryset):
        queryset.update(status='resolved', reviewed_by=request.user)
    mark_resolved.short_description = 'Mark as resolved'
    
    def mark_dismissed(self, request, queryset):
        queryset.update(status='dismissed', reviewed_by=request.user)
    mark_dismissed.short_description = 'Mark as dismissed'