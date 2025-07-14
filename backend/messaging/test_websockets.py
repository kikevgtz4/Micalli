# backend/messaging/test_websockets.py
import json
import asyncio
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from messaging.consumers import ChatConsumer, ConversationListConsumer
from messaging.models import Conversation, Message
from properties.models import Property
from unihousing_backend.asgi import application

User = get_user_model()


class WebSocketTestCase(TransactionTestCase):
    """Base test case for WebSocket testing"""
    
    def setUp(self):
        # Create test users
        self.student = User.objects.create_user(
            username='student_test',
            email='student@test.com',
            user_type='student'
        )
        self.owner = User.objects.create_user(
            username='owner_test',
            email='owner@test.com',
            user_type='property_owner'
        )
        
        # Create test property
        self.property = Property.objects.create(
            title='Test Property',
            owner=self.owner,
            rent_amount=5000,
            bedrooms=2,
            bathrooms=1,
            total_area=80,
            is_active=True
        )
        
        # Create test conversation
        self.conversation = Conversation.objects.create(
            property=self.property,
            conversation_type='property_inquiry'
        )
        self.conversation.participants.add(self.student, self.owner)
        
        # Generate tokens
        self.student_token = str(RefreshToken.for_user(self.student).access_token)
        self.owner_token = str(RefreshToken.for_user(self.owner).access_token)


class ChatConsumerTestCase(WebSocketTestCase):
    """Test ChatConsumer WebSocket functionality"""
    
    async def test_connect_authenticated(self):
        """Test successful WebSocket connection with valid token"""
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.id}/?token={self.student_token}"
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Should receive connection confirmation
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'connection_established')
        self.assertEqual(response['user_id'], self.student.id)
        
        await communicator.disconnect()
    
    async def test_connect_unauthenticated(self):
        """Test WebSocket connection fails without token"""
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.id}/"
        )
        connected, code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(code, 4001)  # Unauthorized
    
    async def test_send_message(self):
        """Test sending a message through WebSocket"""
        # Connect both users
        student_comm = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.id}/?token={self.student_token}"
        )
        owner_comm = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.id}/?token={self.owner_token}"
        )
        
        await student_comm.connect()
        await owner_comm.connect()
        
        # Clear connection messages
        await student_comm.receive_json_from()
        await owner_comm.receive_json_from()
        
        # Student sends message
        message_content = "Hello, I'm interested in the property!"
        await student_comm.send_json_to({
            'type': 'send_message',
            'content': message_content,
            'temp_id': 12345
        })
        
        # Student receives confirmation
        confirmation = await student_comm.receive_json_from()
        self.assertEqual(confirmation['type'], 'message_sent')
        self.assertEqual(confirmation['temp_id'], 12345)
        
        # Owner receives the message
        received = await owner_comm.receive_json_from()
        self.assertEqual(received['type'], 'new_message')
        self.assertEqual(received['message']['content'], message_content)
        
        # Verify message in database
        message_count = await database_sync_to_async(Message.objects.filter(
            conversation=self.conversation,
            content=message_content
        ).count)()
        self.assertEqual(message_count, 1)
        
        await student_comm.disconnect()
        await owner_comm.disconnect()
    
    async def test_typing_indicators(self):
        """Test typing indicator functionality"""
        student_comm = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.id}/?token={self.student_token}"
        )
        owner_comm = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.id}/?token={self.owner_token}"
        )
        
        await student_comm.connect()
        await owner_comm.connect()
        
        # Clear connection messages
        await student_comm.receive_json_from()
        await owner_comm.receive_json_from()
        
        # Student starts typing
        await student_comm.send_json_to({'type': 'typing_start'})
        
        # Owner receives typing notification
        typing_msg = await owner_comm.receive_json_from()
        self.assertEqual(typing_msg['type'], 'user_typing')
        self.assertEqual(typing_msg['user_id'], self.student.id)
        self.assertTrue(typing_msg['is_typing'])
        
        # Student stops typing
        await student_comm.send_json_to({'type': 'typing_stop'})
        
        # Owner receives stop typing notification
        stop_msg = await owner_comm.receive_json_from()
        self.assertEqual(stop_msg['type'], 'user_typing')
        self.assertFalse(stop_msg['is_typing'])
        
        await student_comm.disconnect()
        await owner_comm.disconnect()
    
    async def test_read_receipts(self):
        """Test read receipt functionality"""
        # Create a message first
        message = await database_sync_to_async(Message.objects.create)(
            conversation=self.conversation,
            sender=self.student,
            content="Test message for read receipt"
        )
        
        owner_comm = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.id}/?token={self.owner_token}"
        )
        await owner_comm.connect()
        await owner_comm.receive_json_from()  # Clear connection message
        
        # Owner marks message as read
        await owner_comm.send_json_to({
            'type': 'mark_read',
            'message_ids': [message.id]
        })
        
        # Verify message marked as read in database
        await asyncio.sleep(0.1)  # Small delay for DB update
        updated_message = await database_sync_to_async(
            Message.objects.get
        )(id=message.id)
        self.assertTrue(updated_message.read)
        
        await owner_comm.disconnect()
    
    async def test_content_filtering(self):
        """Test content filtering blocks prohibited content"""
        student_comm = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.id}/?token={self.student_token}"
        )
        await student_comm.connect()
        await student_comm.receive_json_from()  # Clear connection message
        
        # Send message with phone number
        await student_comm.send_json_to({
            'type': 'send_message',
            'content': 'Call me at 555-123-4567',
            'temp_id': 99999
        })
        
        # Should receive blocked message
        response = await student_comm.receive_json_from()
        self.assertEqual(response['type'], 'message_blocked')
        self.assertEqual(response['temp_id'], 99999)
        self.assertTrue(len(response['violations']) > 0)
        
        await student_comm.disconnect()
    
    async def test_rate_limiting(self):
        """Test rate limiting for rapid messages"""
        student_comm = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.id}/?token={self.student_token}"
        )
        await student_comm.connect()
        await student_comm.receive_json_from()  # Clear connection message
        
        # Send many messages rapidly
        for i in range(35):  # Over the 30/minute limit
            await student_comm.send_json_to({
                'type': 'send_message',
                'content': f'Message {i}'
            })
        
        # Should eventually receive an error
        error_received = False
        for _ in range(35):
            try:
                response = await asyncio.wait_for(
                    student_comm.receive_json_from(),
                    timeout=0.1
                )
                if response.get('type') == 'error':
                    error_received = True
                    break
            except asyncio.TimeoutError:
                continue
        
        self.assertTrue(error_received)
        await student_comm.disconnect()


class ConversationListConsumerTestCase(WebSocketTestCase):
    """Test ConversationListConsumer functionality"""
    
    async def test_conversation_list_updates(self):
        """Test receiving updates when new messages arrive"""
        list_comm = WebsocketCommunicator(
            application,
            f"/ws/conversations/?token={self.owner_token}"
        )
        connected, _ = await list_comm.connect()
        self.assertTrue(connected)
        
        # Clear connection message
        await list_comm.receive_json_from()
        
        # Create a new message in a conversation
        await database_sync_to_async(Message.objects.create)(
            conversation=self.conversation,
            sender=self.student,
            content="New message for list update"
        )
        
        # Manually trigger the notification (in real app, this would be done by ChatConsumer)
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f'conversations_user_{self.owner.id}',
            {
                'type': 'new_message_notification',
                'conversation_id': self.conversation.id,
                'message': {
                    'id': 1,
                    'content': 'New message for list update',
                    'sender': self.student.id
                }
            }
        )
        
        # Owner should receive notification
        notification = await list_comm.receive_json_from()
        self.assertEqual(notification['type'], 'new_message')
        self.assertEqual(notification['conversation_id'], self.conversation.id)
        
        await list_comm.disconnect()