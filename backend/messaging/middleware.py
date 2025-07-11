# backend/messaging/middleware.py
from venv import logger
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
import logging

User = get_user_model()

class JWTAuthMiddleware:
    """Custom middleware for JWT authentication in WebSocket connections"""
    
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if token:
            scope['user'] = await self.get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()
            
        return await self.app(scope, receive, send)
        
    @database_sync_to_async
    def get_user_from_token(self, token):
        """Validate token and return user"""
        try:
            # Decode the token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get the user
            user = User.objects.get(id=user_id)
            return user
            
        except (InvalidToken, TokenError) as e:
            logger.warning(f"Invalid token: {str(e)}")
            return AnonymousUser()
        except User.DoesNotExist:
            logger.warning(f"User not found for token")
            return AnonymousUser()
        except Exception as e:
            logger.error(f"Error in JWT auth: {str(e)}", exc_info=True)
            return AnonymousUser()