from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedSimpleRouter
from .views import ConversationViewSet, MessageViewSet, ViewingRequestViewSet

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'viewings', ViewingRequestViewSet, basename='viewing')

# Nested routes for messages within a conversation
messages_router = NestedSimpleRouter(router, r'conversations', lookup='conversation')
messages_router.register(r'messages', MessageViewSet, basename='conversation-messages')

# in backend/messaging/urls.py
urlpatterns = [
    path('conversations/', ConversationViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('conversations/<int:pk>/', ConversationViewSet.as_view({'get': 'retrieve'})),
    path('conversations/start/', ConversationViewSet.as_view({'post': 'start'})),
    # Other URL patterns
]