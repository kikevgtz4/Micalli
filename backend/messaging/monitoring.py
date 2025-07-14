# backend/messaging/monitoring.py
import logging
import time
from functools import wraps
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import json

logger = logging.getLogger('messaging.websocket')


class WebSocketMonitor:
    """Monitor WebSocket connections and performance"""
    
    @staticmethod
    def log_connection(user_id: int, conversation_id: int, action: str):
        """Log WebSocket connection events"""
        logger.info(f"WebSocket {action}", extra={
            'user_id': user_id,
            'conversation_id': conversation_id,
            'timestamp': timezone.now().isoformat(),
            'action': action
        })
        
        # Update metrics in cache
        cache_key = f'ws_metrics:{timezone.now().strftime("%Y%m%d")}'
        metrics = cache.get(cache_key, {
            'connections': 0,
            'disconnections': 0,
            'messages_sent': 0,
            'errors': 0
        })
        
        if action == 'connected':
            metrics['connections'] += 1
        elif action == 'disconnected':
            metrics['disconnections'] += 1
            
        cache.set(cache_key, metrics, 86400)  # 24 hours
    
    @staticmethod
    def log_message(user_id: int, conversation_id: int, message_type: str, success: bool):
        """Log message events"""
        logger.info(f"WebSocket message", extra={
            'user_id': user_id,
            'conversation_id': conversation_id,
            'message_type': message_type,
            'success': success,
            'timestamp': timezone.now().isoformat()
        })
    
    @staticmethod
    def get_active_connections():
        """Get count of active WebSocket connections"""
        # This would integrate with your WebSocket consumer to track active connections
        return cache.get('active_websocket_connections', 0)
    
    @staticmethod
    def get_metrics(date=None):
        """Get WebSocket metrics for a specific date"""
        if not date:
            date = timezone.now()
        
        cache_key = f'ws_metrics:{date.strftime("%Y%m%d")}'
        return cache.get(cache_key, {})


def monitor_websocket_performance(func):
    """Decorator to monitor WebSocket method performance"""
    @wraps(func)
    async def wrapper(self, *args, **kwargs):
        start_time = time.time()
        error = None
        
        try:
            result = await func(self, *args, **kwargs)
            return result
        except Exception as e:
            error = str(e)
            raise
        finally:
            duration = time.time() - start_time
            logger.info(f"WebSocket method performance", extra={
                'method': func.__name__,
                'duration_ms': round(duration * 1000, 2),
                'user_id': getattr(self, 'user', {}).id if hasattr(self, 'user') else None,
                'error': error,
                'timestamp': timezone.now().isoformat()
            })
    
    return wrapper

