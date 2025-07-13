# backend/messaging/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Chat WebSocket endpoint - Fixed to only accept numeric IDs
    re_path(
        r'ws/chat/(?P<conversation_id>\d+)/$', 
        consumers.ChatConsumer.as_asgi(),
        name='ws_chat'
    ),
    
    # Conversation list WebSocket endpoint
    re_path(
        r'ws/conversations/$', 
        consumers.ConversationListConsumer.as_asgi(),
        name='ws_conversations'
    ),
]