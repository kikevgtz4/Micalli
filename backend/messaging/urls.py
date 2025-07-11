# backend/messaging/urls.py

from django.urls import path, include
from rest_framework_nested import routers

app_name = 'messaging'

def get_urlpatterns():
    from .views import ConversationViewSet, MessageViewSet, MessageTemplateViewSet
    
    # Main router
    router = routers.DefaultRouter()
    router.register(r'conversations', ConversationViewSet, basename='conversation')
    router.register(r'templates', MessageTemplateViewSet, basename='template')
    
    # Nested router for messages within conversations
    conversations_router = routers.NestedDefaultRouter(
        router, 
        r'conversations', 
        lookup='conversation'
    )
    conversations_router.register(
        r'messages', 
        MessageViewSet, 
        basename='conversation-messages'
    )
    
    return [
        path('', include(router.urls)),
        path('', include(conversations_router.urls)),
    ]

urlpatterns = get_urlpatterns()