# backend/messaging/management/commands/debug_websocket.py
from django.core.management.base import BaseCommand
from django.core.cache import cache
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import asyncio
import websocket
import json
import time
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class Command(BaseCommand):
    help = 'Debug WebSocket connections'

    def add_arguments(self, parser):
        parser.add_argument('--test-connection', action='store_true', help='Test WebSocket connection')
        parser.add_argument('--check-redis', action='store_true', help='Check Redis connection')
        parser.add_argument('--check-channel-layer', action='store_true', help='Check channel layer')
        parser.add_argument('--user-id', type=int, help='User ID for testing')
        parser.add_argument('--conversation-id', type=int, help='Conversation ID for testing')

    def handle(self, *args, **options):
        if options['check_redis']:
            self.check_redis()
        
        if options['check_channel_layer']:
            self.check_channel_layer()
        
        if options['test_connection']:
            self.test_websocket_connection(
                options.get('user_id', 1),
                options.get('conversation_id', 1)
            )

    def check_redis(self):
        """Test Redis connection and operations"""
        self.stdout.write("Testing Redis connection...")
        
        try:
            # Test basic operations
            cache.set('test_key', 'test_value', 10)
            value = cache.get('test_key')
            
            if value == 'test_value':
                self.stdout.write(self.style.SUCCESS("✓ Redis cache is working"))
            else:
                self.stdout.write(self.style.ERROR("✗ Redis cache test failed"))
            
            # Test Redis info
            from django_redis import get_redis_connection
            conn = get_redis_connection("default")
            info = conn.info()
            
            self.stdout.write(f"Redis version: {info.get('redis_version', 'Unknown')}")
            self.stdout.write(f"Connected clients: {info.get('connected_clients', 0)}")
            self.stdout.write(f"Used memory: {info.get('used_memory_human', 'Unknown')}")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Redis error: {e}"))

    def check_channel_layer(self):
        """Test channel layer functionality"""
        self.stdout.write("Testing channel layer...")
        
        try:
            channel_layer = get_channel_layer()
            self.stdout.write(f"Channel layer backend: {channel_layer.__class__.__name__}")
            
            # Test group operations
            async def test_channel_layer():
                test_group = "test_group"
                test_channel = "test_channel"
                
                # Add to group
                await channel_layer.group_add(test_group, test_channel)
                self.stdout.write(self.style.SUCCESS("✓ Group add successful"))
                
                # Send to group
                await channel_layer.group_send(
                    test_group,
                    {"type": "test.message", "text": "Hello"}
                )
                self.stdout.write(self.style.SUCCESS("✓ Group send successful"))
                
                # Clean up
                await channel_layer.group_discard(test_group, test_channel)
                self.stdout.write(self.style.SUCCESS("✓ Group discard successful"))
            
            # Run async test
            asyncio.run(test_channel_layer())
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Channel layer error: {e}"))

    def test_websocket_connection(self, user_id, conversation_id):
        """Test actual WebSocket connection"""
        self.stdout.write(f"Testing WebSocket connection for user {user_id}, conversation {conversation_id}...")
        
        try:
            # Get user and create token
            user = User.objects.get(id=user_id)
            refresh = RefreshToken.for_user(user)
            token = str(refresh.access_token)
            
            # Construct WebSocket URL
            ws_url = f"ws://localhost:8000/ws/chat/{conversation_id}/?token={token}"
            self.stdout.write(f"Connecting to: {ws_url}")
            
            # Create WebSocket connection
            ws = websocket.WebSocket()
            ws.connect(ws_url)
            
            self.stdout.write(self.style.SUCCESS("✓ WebSocket connected"))
            
            # Wait for connection_established message
            start_time = time.time()
            while time.time() - start_time < 5:  # 5 second timeout
                try:
                    result = ws.recv()
                    data = json.loads(result)
                    self.stdout.write(f"Received: {data.get('type', 'unknown')}")
                    
                    if data.get('type') == 'connection_established':
                        self.stdout.write(self.style.SUCCESS("✓ Connection established successfully"))
                        break
                except websocket.WebSocketTimeoutException:
                    continue
            
            # Send test message
            test_message = {
                "type": "send_message",
                "content": "Test message from debug script",
                "temp_id": int(time.time())
            }
            ws.send(json.dumps(test_message))
            self.stdout.write("Sent test message")
            
            # Wait for response
            result = ws.recv()
            data = json.loads(result)
            self.stdout.write(f"Response: {data.get('type', 'unknown')}")
            
            # Close connection
            ws.close()
            self.stdout.write(self.style.SUCCESS("✓ WebSocket test completed"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ WebSocket test failed: {e}"))