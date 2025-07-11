# backend/messaging/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Conversation, Message
from .serializers import MessageSerializer
from .services.content_filter import MessageContentFilter
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time messaging"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.conversation_id = None
        self.conversation_group_name = None
        self.content_filter = MessageContentFilter()
        
    async def connect(self):
        """Handle WebSocket connection"""
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation_group_name = f'chat_{self.conversation_id}'
        
        # Get user from scope (set by JWTAuthMiddleware)
        self.user = self.scope.get('user')
        
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)  # Unauthorized
            return
            
        # Verify user has access to conversation
        if not await self.user_has_access():
            await self.close(code=4003)  # Forbidden
            return
            
        # Join conversation group
        await self.channel_layer.group_add(
            self.conversation_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection success
        await self.send(json.dumps({
            'type': 'connection_established',
            'user_id': self.user.id,
            'conversation_id': self.conversation_id
        }))
        
        # Update user presence
        await self.update_user_presence(True)
        
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if self.conversation_group_name:
            # Leave conversation group
            await self.channel_layer.group_discard(
                self.conversation_group_name,
                self.channel_name
            )
            
            # Update user presence
            await self.update_user_presence(False)
            
            # Notify others that user stopped typing (if they were)
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'typing_indicator',
                    'user_id': self.user.id,
                    'is_typing': False
                }
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            handlers = {
                'send_message': self.handle_send_message,
                'mark_read': self.handle_mark_read,
                'typing_start': self.handle_typing_start,
                'typing_stop': self.handle_typing_stop,
            }
            
            handler = handlers.get(message_type)
            if handler:
                await handler(data)
            else:
                await self.send_error('Unknown message type')
                
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON')
        except Exception as e:
            logger.error(f"Error in receive: {e}")
            await self.send_error('Internal error')
    
    # Message handlers
    async def handle_send_message(self, data):
        """Handle sending a new message"""
        content = data.get('content', '').strip()
        metadata = data.get('metadata', {})
        
        if not content:
            await self.send_error('Message content required')
            return
            
        # Apply content filtering
        filter_result = await self.filter_content(content)
        
        if filter_result['action'] == 'block':
            await self.send(json.dumps({
                'type': 'message_blocked',
                'violations': filter_result['violations']
            }))
            return
            
        # Create message in database
        message = await self.create_message(content, metadata, filter_result)
        
        # Serialize message
        message_data = await self.serialize_message(message)
        
        # Send to all users in conversation
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'chat_message',
                'message': message_data,
                'sender_id': self.user.id
            }
        )
        
        # Send delivery confirmation to sender
        await self.send(json.dumps({
            'type': 'message_sent',
            'message_id': message.id,
            'timestamp': message.created_at.isoformat()
        }))
        
    async def handle_mark_read(self, data):
        """Handle marking messages as read"""
        message_ids = data.get('message_ids', [])
        
        if not message_ids:
            # Mark all messages as read
            count = await self.mark_all_read()
        else:
            # Mark specific messages as read
            count = await self.mark_messages_read(message_ids)
            
        # Notify sender(s) of read receipts
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'read_receipt',
                'user_id': self.user.id,
                'message_ids': message_ids,
                'read_at': timezone.now().isoformat()
            }
        )
        
    async def handle_typing_start(self, data):
        """Handle typing start indicator"""
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'is_typing': True
            }
        )
        
    async def handle_typing_stop(self, data):
        """Handle typing stop indicator"""
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'is_typing': False
            }
        )
    
    # Event handlers (from channel layer)
    async def chat_message(self, event):
        """Send message to WebSocket"""
        # Don't send own messages back
        if event['sender_id'] != self.user.id:
            await self.send(json.dumps({
                'type': 'new_message',
                'message': event['message']
            }))
            
            # Auto-mark as delivered
            await self.mark_message_delivered(event['message']['id'])
            
    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket"""
        # Don't send own typing status back
        if event['user_id'] != self.user.id:
            await self.send(json.dumps({
                'type': 'user_typing',
                'user_id': event['user_id'],
                'is_typing': event['is_typing']
            }))
            
    async def read_receipt(self, event):
        """Send read receipt to WebSocket"""
        # Only send to message senders
        await self.send(json.dumps({
            'type': 'messages_read',
            'user_id': event['user_id'],
            'message_ids': event['message_ids'],
            'read_at': event['read_at']
        }))
    
    # Database operations
    @database_sync_to_async
    def user_has_access(self):
        """Check if user has access to conversation"""
        return Conversation.objects.filter(
            id=self.conversation_id,
            participants=self.user
        ).exists()
        
    @database_sync_to_async
    def create_message(self, content, metadata, filter_result):
        """Create message in database"""
        conversation = Conversation.objects.get(id=self.conversation_id)
        
        message_data = {
            'conversation': conversation,
            'sender': self.user,
            'content': content,
            'metadata': metadata,
            'delivered': False,
            'read': False
        }
        
        if filter_result['action'] == 'warn':
            message_data.update({
                'filtered_content': filter_result['filtered_content'],
                'has_filtered_content': True,
                'filter_warnings': filter_result['violations']
            })
            
        return Message.objects.create(**message_data)
        
    @database_sync_to_async
    def serialize_message(self, message):
        """Serialize message for WebSocket"""
        from .serializers import MessageSerializer
        serializer = MessageSerializer(message)
        return serializer.data
        
    @database_sync_to_async
    def mark_message_delivered(self, message_id):
        """Mark message as delivered"""
        Message.objects.filter(
            id=message_id,
            conversation_id=self.conversation_id
        ).exclude(sender=self.user).update(
            delivered=True,
            delivered_at=timezone.now()
        )
        
    @database_sync_to_async
    def mark_messages_read(self, message_ids):
        """Mark specific messages as read"""
        return Message.objects.filter(
            id__in=message_ids,
            conversation_id=self.conversation_id
        ).exclude(sender=self.user).update(
            read=True,
            read_at=timezone.now()
        )
        
    @database_sync_to_async
    def mark_all_read(self):
        """Mark all messages in conversation as read"""
        return Message.objects.filter(
            conversation_id=self.conversation_id,
            read=False
        ).exclude(sender=self.user).update(
            read=True,
            read_at=timezone.now()
        )
        
    @database_sync_to_async
    def update_user_presence(self, is_online):
        """Update user online status"""
        # This could update a Redis key or database field
        # For now, we'll skip implementation
        pass
        
    async def filter_content(self, content):
        """Apply content filtering asynchronously"""
        # Run sync filter in thread pool
        return await database_sync_to_async(
            self.content_filter.analyze_message
        )(content)
        
    async def send_error(self, message):
        """Send error message to client"""
        await self.send(json.dumps({
            'type': 'error',
            'message': message
        }))