# backend/messaging/consumers.py
import json
import asyncio
import time
from typing import Optional, Dict, Any, List
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.cache import cache
from .models import Conversation, Message
from .serializers import MessageSerializer
from .monitoring import WebSocketMonitor
from channels.exceptions import StopConsumer
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time messaging with enhanced features"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Only initialize essential attributes
        self.user = None
        self.conversation_id = None
        self.conversation_group_name = None
        self.user_group_name = None
        self.typing_task = None
        self.heartbeat_task = None
        self.connection_time = None
        # Don't instantiate heavy objects here
        self._content_filter = None
        
    @property
    def content_filter(self):
        """Lazy load content filter only when needed"""
        if self._content_filter is None:
            from .services.content_filter import MessageContentFilter
            self._content_filter = MessageContentFilter()
        return self._content_filter
        
    async def connect(self):
        """Handle WebSocket connection with minimal pre-accept operations"""
        self.connection_time = time.time()
        
        try:
            # CRITICAL: Accept IMMEDIATELY - this is the most important fix
            await self.accept()
            logger.info("✅ WebSocket connection accepted")
            
            # Now perform setup in a separate method to isolate errors
            await self.initialize_connection()
            
        except Exception as e:
            logger.error(f"❌ Error in connect: {type(e).__name__}: {e}", exc_info=True)
            try:
                await self.close(code=1011)  # Internal error
            except:
                pass
    
    async def initialize_connection(self):
        """Initialize connection after accepting - isolated for better error handling"""
        try:
            # Extract conversation ID
            self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
            logger.info(f"Conversation ID: {self.conversation_id}")
            
            # Get authenticated user
            self.user = self.scope.get('user')
            
            # Validate authentication
            if not self.user or not getattr(self.user, 'is_authenticated', False):
                logger.warning(f"Unauthorized WebSocket connection attempt for conversation {self.conversation_id}")
                await self.send(json.dumps({
                    'type': 'error',
                    'code': 4001,
                    'message': 'Authentication required'
                }))
                await self.close(code=4001)
                return
            
            logger.info(f"User {self.user.id} authenticated")
            
            # Verify access with improved error handling
            has_access = await self.user_has_access()
            if not has_access:
                logger.warning(f"User {self.user.id} denied access to conversation {self.conversation_id}")
                await self.send(json.dumps({
                    'type': 'error',
                    'code': 4003,
                    'message': 'Access denied to this conversation'
                }))
                await self.close(code=4003)
                return
            
            # Set up group names
            self.conversation_group_name = f'chat_{self.conversation_id}'
            self.user_group_name = f'user_{self.user.id}'
            
            # Join groups with error handling
            try:
                await self.channel_layer.group_add(
                    self.conversation_group_name,
                    self.channel_name
                )
                logger.info(f"Joined conversation group: {self.conversation_group_name}")
                
                await self.channel_layer.group_add(
                    self.user_group_name,
                    self.channel_name
                )
                logger.info(f"Joined user group: {self.user_group_name}")
            except Exception as e:
                logger.error(f"Failed to join groups: {e}")
                await self.close(code=1011)
                return
            
            # Send initial connection success
            await self.send(json.dumps({
                'type': 'connection_established',
                'user_id': self.user.id,
                'conversation_id': int(self.conversation_id),  # Ensure it's an int
                'timestamp': timezone.now().isoformat(),
                'user': {
                    'id': self.user.id,
                    'name': self.user.get_full_name() or self.user.username,
                    'email': self.user.email
                }
            }))
            
            # Start heartbeat task
            self.heartbeat_task = asyncio.create_task(self.heartbeat_loop())
            
            # Perform background tasks without blocking
            asyncio.create_task(self.post_connection_setup())
            
            # Log successful connection
            connection_duration = time.time() - self.connection_time
            logger.info(
                f"✅ User {self.user.id} connected to conversation {self.conversation_id} "
                f"(setup took {connection_duration:.3f}s)"
            )
            
        except Exception as e:
            logger.error(f"Error in initialize_connection: {e}", exc_info=True)
            await self.close(code=1011)
    
    async def post_connection_setup(self):
        """Perform non-critical setup tasks after connection is established"""
        try:
            # Update presence with better error handling
            online_users = await self.safe_update_user_presence(True)
            
            if online_users is not None:
                await self.send(json.dumps({
                    'type': 'online_users',
                    'users': online_users
                }))
            
            # Mark messages as delivered
            await self.mark_messages_as_delivered()
            
            # Log connection for monitoring
            WebSocketMonitor.log_connection(
                self.user.id,
                self.conversation_id,
                'connected'
            )
            
        except Exception as e:
            logger.error(f"Error in post_connection_setup: {e}")
            # Don't close connection for non-critical errors
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection with proper cleanup"""
        try:
            # Cancel all running tasks
            tasks_to_cancel = []
            if self.heartbeat_task:
                tasks_to_cancel.append(self.heartbeat_task)
            if self.typing_task:
                tasks_to_cancel.append(self.typing_task)
                
            for task in tasks_to_cancel:
                task.cancel()
            
            # Only proceed if we have required attributes
            if hasattr(self, 'user') and self.user and hasattr(self, 'conversation_group_name'):
                # Leave groups with error handling
                try:
                    if self.conversation_group_name:
                        await self.channel_layer.group_discard(
                            self.conversation_group_name,
                            self.channel_name
                        )
                    
                    if hasattr(self, 'user_group_name') and self.user_group_name:
                        await self.channel_layer.group_discard(
                            self.user_group_name,
                            self.channel_name
                        )
                except Exception as e:
                    logger.error(f"Error leaving groups: {e}")
                
                # Update presence with error handling
                await self.safe_update_user_presence(False)
                
                # Log disconnection
                if self.connection_time:
                    total_duration = time.time() - self.connection_time
                    logger.info(
                        f"User {self.user.id} disconnected from conversation "
                        f"{getattr(self, 'conversation_id', 'unknown')} after {total_duration:.1f}s"
                    )
                
        except Exception as e:
            logger.error(f"Error in disconnect: {e}", exc_info=True)
        finally:
            # CRITICAL: Always raise StopConsumer
            raise StopConsumer()
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages with rate limiting"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            # Handle heartbeat/ping-pong
            if message_type == 'ping':
                await self.send(json.dumps({
                    'type': 'pong', 
                    'timestamp': timezone.now().isoformat(),
                    'server_time': int(time.time() * 1000)
                }))
                return
            
            # Apply rate limiting
            if not await self.check_rate_limit():
                await self.send_error('Rate limit exceeded. Please slow down.')
                return
            
            # Route to appropriate handler
            handlers = {
                'send_message': self.handle_send_message,
                'mark_read': self.handle_mark_read,
                'typing_start': self.handle_typing_start,
                'typing_stop': self.handle_typing_stop,
                'request_history': self.handle_request_history,
                'edit_message': self.handle_edit_message,
                'delete_message': self.handle_delete_message,
            }
            
            handler = handlers.get(message_type)
            if handler:
                await handler(data)
            else:
                await self.send_error(f'Unknown message type: {message_type}')
                
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON format')
        except Exception as e:
            logger.error(f"Error in receive: {e}", exc_info=True)
            await self.send_error('Internal server error')
    
    async def heartbeat_loop(self):
        """Send periodic heartbeat to keep connection alive"""
        try:
            while True:
                await asyncio.sleep(30)  # Send heartbeat every 30 seconds
                try:
                    await self.send(json.dumps({
                        'type': 'heartbeat',
                        'timestamp': timezone.now().isoformat()
                    }))
                except Exception as e:
                    logger.error(f"Error sending heartbeat: {e}")
                    break
        except asyncio.CancelledError:
            logger.debug("Heartbeat task cancelled")
    
    # Improved database operations with better error handling
    @database_sync_to_async
    def user_has_access(self):
        """Check if user has access to conversation"""
        try:
            return Conversation.objects.filter(
                id=self.conversation_id,
                participants=self.user
            ).exists()
        except Exception as e:
            logger.error(f"Error checking user access: {e}")
            return False
    
    async def safe_update_user_presence(self, is_online):
        """Update user presence with error handling"""
        try:
            return await self.update_user_presence(is_online)
        except Exception as e:
            logger.error(f"Error updating user presence: {e}")
            return []
    
    @database_sync_to_async
    def update_user_presence(self, is_online):
        """Update user online status and return online users"""
        try:
            cache_key = f'presence:conversation:{self.conversation_id}'
            online_users = cache.get(cache_key, set())
            
            if is_online:
                online_users.add(self.user.id)
            else:
                online_users.discard(self.user.id)
            
            # Use try/except for cache operations
            try:
                cache.set(cache_key, online_users, timeout=300)  # 5 minutes
            except Exception as e:
                logger.error(f"Cache error: {e}")
                # Continue without cache
            
            # Get user details for online users
            if online_users:
                users = User.objects.filter(id__in=online_users).values(
                    'id', 'username', 'first_name', 'last_name', 'email'
                )
                return [
                    {
                        'id': u['id'],
                        'name': f"{u['first_name']} {u['last_name']}".strip() or u['username'],
                        'email': u['email']
                    }
                    for u in users
                ]
            return []
        except Exception as e:
            logger.error(f"Error in update_user_presence: {e}")
            return []
    
    # Keep all other methods the same but add error handling where needed
    async def handle_send_message(self, data):
        """Handle sending a new message with enhanced validation"""
        start_time = time.time()
        
        content = data.get('content', '').strip()
        metadata = data.get('metadata', {})
        temp_id = data.get('temp_id')
        
        if not content:
            await self.send_error('Message content required')
            return
        
        if len(content) > 5000:
            await self.send_error('Message too long (max 5000 characters)')
            return
        
        # Apply content filtering
        filter_result = await self.filter_content(content)
        
        if filter_result['action'] == 'block':
            await self.send(json.dumps({
                'type': 'message_blocked',
                'temp_id': temp_id,
                'violations': filter_result['violations']
            }))
            WebSocketMonitor.log_message(
                self.user.id,
                self.conversation_id,
                'send_message',
                success=False
            )
            return
        
        # Create message in database
        message = await self.create_message(content, metadata, filter_result)
        
        # Serialize message for frontend
        message_data = await self.serialize_message(message)
        
        # Add temp_id for optimistic UI correlation
        if temp_id:
            message_data['temp_id'] = temp_id
        
        # Notify conversation list updates for all participants
        participants = await self.get_conversation_participants()
        for participant in participants:
            await self.channel_layer.group_send(
                f'conversations_user_{participant.id}',
                {
                    'type': 'new_message_notification',
                    'conversation_id': int(self.conversation_id),
                    'message': message_data
                }
            )
        
        # Broadcast to all users in conversation
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
            'temp_id': temp_id,
            'timestamp': message.created_at.isoformat()
        }))
        
        # Update conversation timestamp
        await self.update_conversation_timestamp()
        
        # Log performance
        duration = time.time() - start_time
        WebSocketMonitor.log_message(
            self.user.id,
            self.conversation_id,
            'send_message',
            success=True
        )
        
        if duration > 0.5:
            logger.warning(f"Slow message send: {duration:.3f}s")
    
    # Include all other handler methods with the same implementation
    # but ensure proper error handling and type conversions
    
    async def handle_mark_read(self, data):
        """Handle marking messages as read with optimizations"""
        message_ids = data.get('message_ids', [])
        
        if not message_ids:
            # Mark all messages as read
            count = await self.mark_all_read()
            message_ids = 'all'
        else:
            # Mark specific messages as read
            count = await self.mark_messages_read(message_ids)
            
        if count > 0:
            # Notify sender(s) of read receipts
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'read_receipt',
                    'user_id': self.user.id,
                    'message_ids': message_ids,
                    'read_at': timezone.now().isoformat(),
                    'user_name': self.user.get_full_name() or self.user.username
                }
            )
    
    async def handle_typing_start(self, data):
        """Handle typing start with auto-stop after timeout"""
        # Cancel previous typing task if exists
        if self.typing_task:
            self.typing_task.cancel()
            
        # Send typing indicator
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'is_typing': True,
                'user_name': self.user.get_full_name() or self.user.username
            }
        )
        
        # Auto-stop typing after 10 seconds
        self.typing_task = asyncio.create_task(self.auto_stop_typing())
    
    async def handle_typing_stop(self, data):
        """Handle typing stop"""
        if self.typing_task:
            self.typing_task.cancel()
            self.typing_task = None
            
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'is_typing': False,
                'user_name': self.user.get_full_name() or self.user.username
            }
        )
    
    async def handle_request_history(self, data):
        """Handle request for message history"""
        before_id = data.get('before_id')
        limit = min(data.get('limit', 50), 100)  # Max 100 messages
        
        messages = await self.get_message_history(before_id, limit)
        
        await self.send(json.dumps({
            'type': 'message_history',
            'messages': messages,
            'has_more': len(messages) == limit
        }))
    
    async def handle_edit_message(self, data):
        """Handle message editing"""
        message_id = data.get('message_id')
        new_content = data.get('content', '').strip()
        
        if not message_id or not new_content:
            await self.send_error('Message ID and content required')
            return
            
        # Apply content filtering to edited content
        filter_result = await self.filter_content(new_content)
        
        if filter_result['action'] == 'block':
            await self.send(json.dumps({
                'type': 'edit_blocked',
                'message_id': message_id,
                'violations': filter_result['violations']
            }))
            return
            
        # Edit message in database
        success = await self.edit_message_in_db(message_id, new_content, filter_result)
        
        if success:
            # Notify all users
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'message_edited',
                    'message_id': message_id,
                    'new_content': new_content,
                    'edited_at': timezone.now().isoformat(),
                    'editor_id': self.user.id
                }
            )
        else:
            await self.send_error('Cannot edit this message')
    
    async def handle_delete_message(self, data):
        """Handle message deletion"""
        message_id = data.get('message_id')
        
        if not message_id:
            await self.send_error('Message ID required')
            return
            
        # Soft delete message
        success = await self.delete_message_in_db(message_id)
        
        if success:
            # Notify all users
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'message_deleted',
                    'message_id': message_id,
                    'deleted_at': timezone.now().isoformat(),
                    'deleter_id': self.user.id
                }
            )
        else:
            await self.send_error('Cannot delete this message')
    
    # Event handlers (from channel layer)
    async def chat_message(self, event):
        """Send message to WebSocket"""
        # Don't send own messages back (they already have it)
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
                'user_name': event.get('user_name', 'User'),
                'is_typing': event['is_typing']
            }))
    
    async def read_receipt(self, event):
        """Send read receipt to WebSocket"""
        await self.send(json.dumps({
            'type': 'messages_read',
            'user_id': event['user_id'],
            'user_name': event.get('user_name', 'User'),
            'message_ids': event['message_ids'],
            'read_at': event['read_at']
        }))
    
    async def message_edited(self, event):
        """Send message edit notification"""
        await self.send(json.dumps({
            'type': 'message_edited',
            'message_id': event['message_id'],
            'new_content': event['new_content'],
            'edited_at': event['edited_at'],
            'editor_id': event['editor_id']
        }))
        
    async def message_deleted(self, event):
        """Send message deletion notification"""
        await self.send(json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id'],
            'deleted_at': event['deleted_at'],
            'deleter_id': event['deleter_id']
        }))
    
    # Include all database operations methods with the same implementation
    # Ensure all have proper error handling
    
    @database_sync_to_async
    def get_conversation_participants(self):
        """Get all participants in the conversation"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return list(conversation.participants.all())
        except Exception as e:
            logger.error(f"Error getting participants: {e}")
            return []
    
    @database_sync_to_async
    def create_message(self, content, metadata, filter_result):
        """Create message in database"""
        conversation = Conversation.objects.select_related('property').get(
            id=self.conversation_id
        )
        
        message_data = {
            'conversation': conversation,
            'sender': self.user,
            'content': content,
            'metadata': metadata,
            'delivered': False,
            'read': False,
            'message_type': metadata.get('type', 'text')
        }
        
        if filter_result['action'] == 'warn':
            message_data.update({
                'filtered_content': filter_result['filtered_content'],
                'has_filtered_content': True,
                'filter_warnings': filter_result['violations']
            })
            
        message = Message.objects.create(**message_data)
        
        # Update conversation's latest_message
        conversation.latest_message = message
        conversation.save(update_fields=['latest_message', 'updated_at'])
        
        return message
    
    @database_sync_to_async
    def serialize_message(self, message):
        """Serialize message for WebSocket with camelCase conversion"""
        from .serializers import MessageSerializer
        from .utils import snake_to_camel_case
        
        serializer = MessageSerializer(message)
        # Convert to camelCase for frontend
        return snake_to_camel_case(serializer.data)
    
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
    def mark_messages_as_delivered(self):
        """Mark all undelivered messages as delivered for this user"""
        return Message.objects.filter(
            conversation_id=self.conversation_id,
            delivered=False
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
    def update_conversation_timestamp(self):
        """Update conversation's last activity timestamp"""
        Conversation.objects.filter(
            id=self.conversation_id
        ).update(updated_at=timezone.now())
    
    @database_sync_to_async
    def get_message_history(self, before_id, limit):
        """Get paginated message history"""
        from .serializers import MessageSerializer
        from .utils import snake_to_camel_case
        
        query = Message.objects.filter(
            conversation_id=self.conversation_id
        ).select_related('sender').order_by('-created_at')
        
        if before_id:
            query = query.filter(id__lt=before_id)
            
        messages = query[:limit]
        serializer = MessageSerializer(messages, many=True)
        
        # Convert to camelCase and reverse order (oldest first)
        return [snake_to_camel_case(msg) for msg in reversed(serializer.data)]
    
    @database_sync_to_async
    def edit_message_in_db(self, message_id, new_content, filter_result):
        """Edit message if user has permission"""
        try:
            message = Message.objects.get(
                id=message_id,
                conversation_id=self.conversation_id,
                sender=self.user
            )
            
            # Check if message can be edited (e.g., within 15 minutes)
            if (timezone.now() - message.created_at).total_seconds() > 900:  # 15 minutes
                return False
                
            message.content = new_content
            message.is_edited = True
            message.edited_at = timezone.now()
            
            if filter_result['action'] == 'warn':
                message.filtered_content = filter_result['filtered_content']
                message.has_filtered_content = True
                message.filter_warnings = filter_result['violations']
                
            message.save()
            return True
            
        except Message.DoesNotExist:
            return False
    
    @database_sync_to_async
    def delete_message_in_db(self, message_id):
        """Soft delete message if user has permission"""
        try:
            message = Message.objects.get(
                id=message_id,
                conversation_id=self.conversation_id,
                sender=self.user
            )
            
            # Check if message can be deleted (e.g., within 1 hour)
            if (timezone.now() - message.created_at).total_seconds() > 3600:  # 1 hour
                return False
                
            # Soft delete
            message.is_deleted = True
            message.deleted_at = timezone.now()
            message.save()
            return True
            
        except Message.DoesNotExist:
            return False
    
    async def filter_content(self, content):
        """Apply content filtering asynchronously"""
        # Run sync filter in thread pool
        return await database_sync_to_async(
            self.content_filter.analyze_message
        )(content)
    
    async def check_rate_limit(self):
        """Simple rate limiting per user"""
        cache_key = f'ws_rate_limit:{self.user.id}'
        try:
            count = cache.get(cache_key, 0)
            
            if count >= 30:  # 30 messages per minute
                return False
                
            cache.set(cache_key, count + 1, timeout=60)
            return True
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            return True  # Allow on error
    
    async def auto_stop_typing(self):
        """Auto stop typing after timeout"""
        await asyncio.sleep(10)  # 10 seconds
        await self.handle_typing_stop({})
    
    async def send_error(self, message: str, error_code: Optional[str] = None):
        """Send error message to client"""
        try:
            await self.send(json.dumps({
                'type': 'error',
                'message': message,
                'error_code': error_code,
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            logger.error(f"Error sending error message: {e}")

class ConversationListConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time conversation list updates"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.user_group_name = None
        self.connection_time = None
    
    async def connect(self):
        """Handle WebSocket connection for conversation list"""
        self.connection_time = time.time()
        
        try:
            # CRITICAL: Accept connection FIRST
            await self.accept()
            
            # Initialize connection
            await self.initialize_connection()
            
        except Exception as e:
            logger.error(f"Error in ConversationListConsumer connect: {e}", exc_info=True)
            await self.close(code=1011)
    
    async def initialize_connection(self):
        """Initialize after accepting connection"""
        # Get authenticated user
        self.user = self.scope.get('user')
        
        if not self.user or not self.user.is_authenticated:
            logger.warning("Unauthorized WebSocket connection attempt for conversation list")
            await self.send(json.dumps({
                'type': 'error',
                'code': 4001,
                'message': 'Authentication required'
            }))
            await self.close(code=4001)
            return
        
        # Join user's conversation list group
        self.user_group_name = f'conversations_user_{self.user.id}'
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        # Send connection success
        await self.send(json.dumps({
            'type': 'connection_established',
            'user_id': self.user.id,
            'timestamp': timezone.now().isoformat()
        }))
        
        logger.info(f"User {self.user.id} connected to conversation list WebSocket")
    
    async def disconnect(self, close_code):
        """Handle disconnection with proper cleanup"""
        try:
            if self.user_group_name and hasattr(self, 'channel_layer'):
                await self.channel_layer.group_discard(
                    self.user_group_name,
                    self.channel_name
                )
                
            if hasattr(self, 'user') and self.user and self.connection_time:
                duration = time.time() - self.connection_time
                logger.info(
                    f"User {self.user.id} disconnected from conversation list "
                    f"after {duration:.1f}s"
                )
        except Exception as e:
            logger.error(f"Error in disconnect: {e}", exc_info=True)
        finally:
            # CRITICAL: Always raise StopConsumer
            raise StopConsumer()
    
    async def receive(self, text_data):
        """Handle incoming messages (mostly for heartbeat)"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(json.dumps({
                    'type': 'pong',
                    'timestamp': timezone.now().isoformat()
                }))
            
        except Exception as e:
            logger.error(f"Error in receive: {e}", exc_info=True)
    
    # Event handlers for channel layer
    async def conversation_update(self, event):
        """Send conversation update to WebSocket"""
        await self.send(json.dumps({
            'type': 'conversation_updated',
            'conversation': event['conversation']
        }))
    
    async def new_message_notification(self, event):
        """Notify about new message in a conversation"""
        await self.send(json.dumps({
            'type': 'new_message',
            'conversation_id': event['conversation_id'],
            'message': event['message']
        }))
    
    async def conversation_status_change(self, event):
        """Notify about conversation status change"""
        await self.send(json.dumps({
            'type': 'conversation_status_changed',
            'conversation_id': event['conversation_id'],
            'status': event['status']
        }))


# class ConversationListConsumer(AsyncWebsocketConsumer):
#     """WebSocket consumer for real-time conversation list updates"""
    
#     def __init__(self, *args, **kwargs):
#         super().__init__(*args, **kwargs)
#         self.user = None
#         self.user_group_name = None
#         self.connection_time = None
        
#     async def connect(self):
#         """Handle WebSocket connection for conversation list"""
#         self.connection_time = time.time()
        
#         try:
#             # CRITICAL: Accept connection FIRST
#             await self.accept()
            
#             # Get authenticated user
#             self.user = self.scope.get('user')
            
#             if not self.user or not self.user.is_authenticated:
#                 logger.warning("Unauthorized WebSocket connection attempt for conversation list")
#                 await self.send(json.dumps({
#                     'type': 'error',
#                     'code': 4001,
#                     'message': 'Authentication required'
#                 }))
#                 await self.close(code=4001)
#                 return
            
#             # Join user's conversation list group
#             self.user_group_name = f'conversations_user_{self.user.id}'
#             await self.channel_layer.group_add(
#                 self.user_group_name,
#                 self.channel_name
#             )
            
#             # Send connection success
#             await self.send(json.dumps({
#                 'type': 'connection_established',
#                 'user_id': self.user.id,
#                 'timestamp': timezone.now().isoformat()
#             }))
            
#             logger.info(f"User {self.user.id} connected to conversation list WebSocket")
            
#         except Exception as e:
#             logger.error(f"Error in ConversationListConsumer connect: {e}", exc_info=True)
#             await self.close(code=4000)
    
#     async def disconnect(self, close_code):
#         """Handle disconnection with proper cleanup"""
#         try:
#             if self.user_group_name and hasattr(self, 'channel_layer'):
#                 await self.channel_layer.group_discard(
#                     self.user_group_name,
#                     self.channel_name
#                 )
                
#             if hasattr(self, 'user') and self.user and self.connection_time:
#                 duration = time.time() - self.connection_time
#                 logger.info(
#                     f"User {self.user.id} disconnected from conversation list "
#                     f"after {duration:.1f}s"
#                 )
#         except Exception as e:
#             logger.error(f"Error in disconnect: {e}", exc_info=True)
#         finally:
#             # CRITICAL: Always raise StopConsumer
#             raise StopConsumer()
    
#     async def receive(self, text_data):
#         """Handle incoming messages (mostly for heartbeat)"""
#         try:
#             data = json.loads(text_data)
#             message_type = data.get('type')
            
#             if message_type == 'ping':
#                 await self.send(json.dumps({
#                     'type': 'pong',
#                     'timestamp': timezone.now().isoformat()
#                 }))
            
#         except Exception as e:
#             logger.error(f"Error in receive: {e}", exc_info=True)
    
#     # Event handlers for channel layer
#     async def conversation_update(self, event):
#         """Send conversation update to WebSocket"""
#         await self.send(json.dumps({
#             'type': 'conversation_updated',
#             'conversation': event['conversation']
#         }))
    
#     async def new_message_notification(self, event):
#         """Notify about new message in a conversation"""
#         await self.send(json.dumps({
#             'type': 'new_message',
#             'conversation_id': event['conversation_id'],
#             'message': event['message']
#         }))
    
#     async def conversation_status_change(self, event):
#         """Notify about conversation status change"""
#         await self.send(json.dumps({
#             'type': 'conversation_status_changed',
#             'conversation_id': event['conversation_id'],
#             'status': event['status']
#         }))

class TestConsumer(AsyncWebsocketConsumer):
    """Simple test consumer to debug WebSocket issues"""
    
    async def connect(self):
        logger.info("🔧 TestConsumer: connect() called")
        
        # Accept immediately
        await self.accept()
        logger.info("🔧 TestConsumer: Connection accepted")
        
        # Get user info
        self.user = self.scope.get('user')
        logger.info(f"🔧 TestConsumer: User = {self.user}, authenticated = {getattr(self.user, 'is_authenticated', False)}")
        
        # Send test message
        await self.send(json.dumps({
            'type': 'test',
            'message': 'Test consumer connected successfully',
            'user_id': getattr(self.user, 'id', None),
            'user_authenticated': getattr(self.user, 'is_authenticated', False)
        }))
        
        logger.info("🔧 TestConsumer: Setup complete")
    
    async def disconnect(self, close_code):
        logger.info(f"🔧 TestConsumer: Disconnected with code {close_code}")
        raise StopConsumer()
    
    async def receive(self, text_data):
        logger.info(f"🔧 TestConsumer: Received: {text_data}")
        await self.send(json.dumps({
            'type': 'echo',
            'data': text_data
        }))

















        
