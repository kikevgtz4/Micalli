# backend/messaging/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    Conversation, 
    Message, 
    MessageTemplate, 
    ConversationFlag
)
from properties.models import Property
from accounts.serializers import UserSerializer
from universities.serializers import UniversitySerializer


User = get_user_model()


class UserBriefSerializer(serializers.ModelSerializer):
    """Brief serializer for user info in messages"""
    name = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    last_seen = serializers.DateTimeField(source='last_login', read_only=True)
    response_time = serializers.SerializerMethodField()
    university = UniversitySerializer(read_only=True) 
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'profile_picture', 
            'user_type', 'is_online', 'last_seen', 'response_time',
            'email_verified', 'student_id_verified',
            'university'
        ]
    
    def get_name(self, obj):
        """Get user's display name"""
        return obj.get_full_name() or obj.username
    
    def get_is_online(self, obj):
        """Consider user online if active in last 5 minutes"""
        if obj.last_login:
            time_diff = timezone.now() - obj.last_login
            return time_diff.total_seconds() < 300  # 5 minutes
        return False
    
    def get_response_time(self, obj):
        """Calculate average response time for property owners"""
        if obj.user_type != 'property_owner':
            return None
        
        # TODO: Implement actual calculation from conversation data
        return "Usually responds within 2 hours"


# Add PropertyBriefSerializer here to avoid circular imports
class PropertyBriefSerializer(serializers.ModelSerializer):
    """Minimal property info for conversations"""
    owner = UserBriefSerializer(read_only=True)
    main_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'address', 'rent_amount', 
            'property_type', 'bedrooms', 'bathrooms',
            'owner', 'main_image', 'is_active'
        ]
    
    def get_main_image(self, obj):
        main_image = obj.images.filter(is_main=True).first()
        if main_image and self.context.get('request'):
            return self.context['request'].build_absolute_uri(main_image.image.url)
        return None


class MessageSerializer(serializers.ModelSerializer):
    """Enhanced message serializer with filtering info"""
    sender_details = UserBriefSerializer(source='sender', read_only=True)
    is_edited = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    read_by = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'content', 'sender', 'sender_details', 
            'created_at', 'delivered', 'delivered_at', 'read', 'read_at',
            'message_type', 'metadata', 'attachment', 'attachment_type',
            'is_system_message', 'has_filtered_content', 'filter_warnings',
            'filtered_content', 'is_edited', 'can_edit', 'read_by'
        ]
        read_only_fields = [
            'sender', 'created_at', 'conversation', 
            'has_filtered_content', 'filter_warnings', 'filtered_content',
            'is_system_message'
        ]
    
    def get_is_edited(self, obj):  # Fixed method name
        """Messages can't be edited in current implementation"""
        return False
    
    def get_can_edit(self, obj):  # Fixed method name
        """Check if user can edit message (not implemented yet)"""
        request = self.context.get('request')
        if not request or not request.user:
            return False
        
        # Only allow editing own messages within 15 minutes
        if obj.sender == request.user:
            time_diff = timezone.now() - obj.created_at
            return time_diff.total_seconds() < 900  # 15 minutes
        return False
    
    def create(self, validated_data):
        """Create message with sender set to current user"""
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)
    
    def get_read_by(self, obj):  # Fixed method name
        """Get list of users who read this message"""
        # This would require a MessageReadReceipt model
        # For now, just return if current user read it
        request = self.context.get('request')
        if request and request.user != obj.sender:
            return [request.user.id] if obj.read else []
        return []


class ConversationSerializer(serializers.ModelSerializer):
    """Enhanced conversation serializer with property context"""
    participants_details = UserBriefSerializer(
        source='participants', 
        many=True, 
        read_only=True
    )
    other_participant = serializers.SerializerMethodField()
    latest_message = serializers.SerializerMethodField()
    property_details = PropertyBriefSerializer(source='property', read_only=True)
    unread_count = serializers.SerializerMethodField()
    
    # Annotated fields from queryset
    message_count = serializers.IntegerField(read_only=True)
    last_message_time = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'participants_details', 'other_participant',
            'property', 'property_details', 'conversation_type', 'status',
            'created_at', 'updated_at', 'latest_message', 'unread_count',
            'message_count', 'last_message_time', 'has_flagged_content',
            'flagged_at', 'initial_message_template', 'owner_response_time'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'message_count', 
            'last_message_time', 'has_flagged_content', 'flagged_at',
            'owner_response_time'
        ]
    
    def get_other_participant(self, obj):  # Fixed method name
        """Get the other participant's details"""
        user = self.context.get('request').user
        if user:
            other = obj.other_participant(user)
            if other:
                return UserBriefSerializer(other).data
        return None
    
    def get_latest_message(self, obj):
        """Get the most recent message"""
        latest = obj.messages.order_by('-created_at').first()
        if latest:
            return MessageSerializer(latest, context=self.context).data
        return None
    
    def get_unread_count(self, obj):  # Fixed method name
        """Get unread message count for current user"""
        user = self.context.get('request').user
        if user:
            # Use annotated value if available (from queryset)
            if hasattr(obj, 'unread_count'):
                return obj.unread_count
            # Otherwise calculate
            return obj.get_unread_count(user)
        return 0
    
    def create(self, validated_data):
        """Create conversation with participants"""
        participants = validated_data.pop('participants', [])
        conversation = Conversation.objects.create(**validated_data)
        
        # Add current user as participant
        user = self.context['request'].user
        if user not in participants:
            participants.append(user)
        
        conversation.participants.set(participants)
        return conversation


class ConversationDetailSerializer(ConversationSerializer):
    """Detailed conversation serializer with messages"""
    messages = MessageSerializer(many=True, read_only=True)
    can_send_message = serializers.SerializerMethodField()  # Fixed field name
    response_time_stats = serializers.SerializerMethodField()  # Fixed field name
    
    class Meta:
        model = Conversation
        fields = ConversationSerializer.Meta.fields + [
            'messages', 'can_send_message', 'response_time_stats',
            'owner_response_time'  # Fixed field name
        ]
        read_only_fields = ConversationSerializer.Meta.read_only_fields + [
            'owner_response_time'  # Fixed field name
        ]
    
    def get_can_send_message(self, obj):  # Fixed method name
        """Check if user can send messages in this conversation"""
        # Block messages in archived or flagged conversations
        return obj.status not in ['archived', 'flagged']
    
    def get_response_time_stats(self, obj):  # Fixed method name
        """Get response time statistics for the conversation"""
        if not obj.property:
            return None
        
        owner = obj.property.owner
        # TODO: Calculate from historical data
        # For now, return placeholder data
        return {
            'averageResponseTime': '2 hours',
            'responseRate': 95,
            'lastActive': owner.last_login
        }


class MessageTemplateSerializer(serializers.ModelSerializer):
    """Serializer for message templates"""
    localized_content = serializers.SerializerMethodField()  # Fixed field name
    
    class Meta:
        model = MessageTemplate
        fields = [
            'id', 'template_type', 'title', 'content',  # Fixed field names
            'localized_content', 'variables', 'usage_count',  # Fixed field names
            'is_active', 'order'  # Fixed field name
        ]
        read_only_fields = ['usage_count', 'created_at', 'updated_at']  # Fixed field names
    
    def get_localized_content(self, obj):  # Fixed method name
        """Get content in user's preferred language"""
        request = self.context.get('request')
        if request and hasattr(request, 'LANGUAGE_CODE'):
            if request.LANGUAGE_CODE == 'es' and obj.content_es:
                return {
                    'title': obj.title_es or obj.title,
                    'content': obj.content_es
                }
        
        return {
            'title': obj.title,
            'content': obj.content
        }


class ConversationFlagSerializer(serializers.ModelSerializer):
    """Serializer for conversation flags"""
    flagged_by_details = UserBriefSerializer(source='flagged_by', read_only=True)  # Fixed field name
    conversation_details = serializers.SerializerMethodField()  # Fixed field name
    
    class Meta:
        model = ConversationFlag
        fields = [
            'id', 'conversation', 'conversation_details', 'message',  # Fixed field name
            'flagged_by', 'flagged_by_details', 'reason', 'description',  # Fixed field names
            'created_at', 'status', 'reviewed_by', 'reviewed_at',  # Fixed field names
            'review_notes', 'action_taken', 'updated_at'  # Fixed field names
        ]
        read_only_fields = [
            'flagged_by', 'created_at', 'updated_at', 'reviewed_by',  # Fixed field names
            'reviewed_at', 'review_notes', 'action_taken'  # Fixed field names
        ]
    
    def get_conversation_details(self, obj):  # Fixed method name
        """Get basic conversation info for admin review"""
        return {
            'id': obj.conversation.id,
            'property': obj.conversation.property.title if obj.conversation.property else None,
            'participants': obj.conversation.participants.count(),
            'messageCount': obj.conversation.messages.count()
        }
    
    def create(self, validated_data):
        """Set flagged_by to current user on creation"""
        validated_data['flagged_by'] = self.context['request'].user
        return super().create(validated_data)


# These serializers use camelCase input fields with source mapping, which is correct
class ConversationStartSerializer(serializers.Serializer):
    """Serializer for starting a new conversation"""
    userId = serializers.IntegerField(source='user_id')
    propertyId = serializers.IntegerField(source='property_id', required=False)
    message = serializers.CharField(max_length=1000, min_length=1)
    templateType = serializers.CharField(
        source='template_type', 
        required=False,
        allow_blank=True
    )
    metadata = serializers.JSONField(required=False, default=dict)
    
    def validate_userId(self, value):
        """Validate user exists and is active"""
        try:
            user = User.objects.get(id=value)
            if not user.is_active:
                raise serializers.ValidationError("Cannot message inactive users")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
    
    def validate_message(self, value):
        """Validate message content"""
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty")
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Message is too short")
        return value.strip()
    
    def validate(self, attrs):
        """Validate the conversation can be started"""
        request = self.context.get('request')
        if request and request.user.id == attrs.get('user_id'):
            raise serializers.ValidationError("Cannot start conversation with yourself")
        
        # If property is specified, validate it exists
        property_id = attrs.get('property_id')
        if property_id:
            try:
                Property.objects.get(id=property_id, is_active=True)
            except Property.DoesNotExist:
                raise serializers.ValidationError("Property not found or inactive")
        
        return attrs


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new messages"""
    
    class Meta:
        model = Message
        fields = ['content', 'message_type', 'metadata', 'attachment']
        
    def validate_content(self, value):
        """Validate message content"""
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty")
        return value.strip()
    
    def validate_attachment(self, value):
        """Validate attachment file"""
        if value:
            # 10MB limit
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("File too large. Maximum size is 10MB")
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError("Invalid file type. Allowed: JPEG, PNG, GIF, PDF")
        
        return value
