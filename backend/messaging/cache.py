# backend/messaging/cache.py
from django.core.cache import cache
from typing import List, Optional, Dict, Any
import hashlib
import json


class MessageCache:
    """Cache frequently accessed message data"""
    
    CACHE_VERSION = 1  # Increment when cache structure changes
    DEFAULT_TIMEOUT = 300  # 5 minutes
    
    @classmethod
    def _make_key(cls, key_type: str, *args) -> str:
        """Generate a cache key with versioning"""
        key_parts = [f"v{cls.CACHE_VERSION}", "msg", key_type] + [str(arg) for arg in args]
        return ":".join(key_parts)
    
    @classmethod
    def get_conversation_messages(cls, conversation_id: int, page: int = 1) -> Optional[List]:
        """Get cached messages for a conversation"""
        cache_key = cls._make_key('conv_msgs', conversation_id, page)
        return cache.get(cache_key)
    
    @classmethod
    def set_conversation_messages(cls, conversation_id: int, page: int, messages: List, timeout: int = None):
        """Cache messages for a conversation"""
        cache_key = cls._make_key('conv_msgs', conversation_id, page)
        cache.set(cache_key, messages, timeout or cls.DEFAULT_TIMEOUT)
    
    @classmethod
    def get_conversation_stats(cls, conversation_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Get cached conversation statistics"""
        cache_key = cls._make_key('conv_stats', conversation_id, user_id)
        return cache.get(cache_key)
    
    @classmethod
    def set_conversation_stats(cls, conversation_id: int, user_id: int, stats: Dict[str, Any], timeout: int = None):
        """Cache conversation statistics"""
        cache_key = cls._make_key('conv_stats', conversation_id, user_id)
        cache.set(cache_key, stats, timeout or cls.DEFAULT_TIMEOUT)
    
    @classmethod
    def invalidate_conversation(cls, conversation_id: int):
        """Invalidate all cached data for a conversation"""
        # Delete message pages
        for page in range(1, 11):  # Assume max 10 pages cached
            cache.delete(cls._make_key('conv_msgs', conversation_id, page))
        
        # Delete stats for all possible users (this is a pattern delete)
        # In production, you might want to track which users have cached data
        cache_pattern = f"v{cls.CACHE_VERSION}:msg:conv_stats:{conversation_id}:*"
        # Note: pattern delete depends on your cache backend
        # For Redis, you'd use: cache.delete_pattern(cache_pattern)
        
    @classmethod
    def get_user_conversations(cls, user_id: int, filters: Optional[Dict] = None) -> Optional[List]:
        """Get cached conversation list for a user"""
        filter_hash = hashlib.md5(json.dumps(filters or {}, sort_keys=True).encode()).hexdigest()[:8]
        cache_key = cls._make_key('user_convs', user_id, filter_hash)
        return cache.get(cache_key)
    
    @classmethod
    def set_user_conversations(cls, user_id: int, conversations: List, filters: Optional[Dict] = None, timeout: int = None):
        """Cache user's conversation list"""
        filter_hash = hashlib.md5(json.dumps(filters or {}, sort_keys=True).encode()).hexdigest()[:8]
        cache_key = cls._make_key('user_convs', user_id, filter_hash)
        cache.set(cache_key, conversations, timeout or cls.DEFAULT_TIMEOUT)
    
    @classmethod
    def invalidate_user_conversations(cls, user_id: int):
        """Invalidate all cached conversation lists for a user"""
        # This would need pattern delete support
        # For now, we'll have to invalidate specific filter combinations
        pass


class TypingIndicatorCache:
    """Manage typing indicator states"""
    
    TYPING_TIMEOUT = 10  # seconds
    
    @staticmethod
    def set_typing(conversation_id: int, user_id: int):
        """Set user as typing"""
        cache_key = f'typing:{conversation_id}:{user_id}'
        cache.set(cache_key, True, timeout=TypingIndicatorCache.TYPING_TIMEOUT)
    
    @staticmethod
    def remove_typing(conversation_id: int, user_id: int):
        """Remove typing status"""
        cache_key = f'typing:{conversation_id}:{user_id}'
        cache.delete(cache_key)
    
    @staticmethod
    def get_typing_users(conversation_id: int) -> List[int]:
        """Get all users currently typing in a conversation"""
        # This would need to scan keys with pattern matching
        # Implementation depends on your cache backend
        return []
