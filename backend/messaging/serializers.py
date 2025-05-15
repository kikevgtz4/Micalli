from rest_framework import serializers
from .models import Conversation, Message, ViewingRequest
from properties.serializers import PropertySerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserBriefSerializer(serializers.ModelSerializer):
    """Brief serializer for user info in messages"""
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'profile_picture']
    
    def get_name(self, obj):
        return obj.get_full_name() or obj.username


class MessageSerializer(serializers.ModelSerializer):
    sender_details = UserBriefSerializer(source='sender', read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['sender', 'created_at', 'conversation']
    
    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class ConversationSerializer(serializers.ModelSerializer):
    participants_details = UserBriefSerializer(source='participants', many=True, read_only=True)
    latest_message = serializers.SerializerMethodField()
    property_details = PropertySerializer(source='property', read_only=True)
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_latest_message(self, obj):
        latest = obj.messages.order_by('-created_at').first()
        if latest:
            return MessageSerializer(latest).data
        return None
    
    def get_unread_count(self, obj):
        user = self.context.get('request').user
        return obj.messages.filter(read=False).exclude(sender=user).count()


class ConversationDetailSerializer(ConversationSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Conversation
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ViewingRequestSerializer(serializers.ModelSerializer):
    requester_details = UserBriefSerializer(source='requester', read_only=True)
    property_details = PropertySerializer(source='property', read_only=True)
    
    class Meta:
        model = ViewingRequest
        fields = '__all__'
        read_only_fields = ['requester', 'created_at', 'updated_at', 'conversation']
    
    def create(self, validated_data):
        validated_data['requester'] = self.context['request'].user
        # Create or get conversation with property owner
        property_obj = validated_data['property']
        user = self.context['request'].user
        
        # Find or create conversation
        conversations = Conversation.objects.filter(
            participants=property_obj.owner,
            property=property_obj
        ).filter(participants=user)
        
        if conversations.exists():
            conversation = conversations.first()
        else:
            conversation = Conversation.objects.create(property=property_obj)
            conversation.participants.add(user, property_obj.owner)
        
        validated_data['conversation'] = conversation
        
        return super().create(validated_data)