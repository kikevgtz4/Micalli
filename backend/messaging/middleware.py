# backend/messaging/middleware.py
import logging
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

logger = logging.getLogger(__name__)
User = get_user_model()


class JWTAuthMiddleware(BaseMiddleware):
    """
    JWT authentication middleware for Django Channels WebSocket connections.
    Extracts JWT from query string and authenticates user.
    """
    
    async def __call__(self, scope, receive, send):
        """
        Process the WebSocket connection and authenticate user.
        """
        # Parse query string to get token
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        # Authenticate user
        scope['user'] = await self.get_user_from_token(token)
        
        # Log authentication result
        if scope['user'].is_authenticated:
            logger.debug(
                f"WebSocket authenticated: user_id={scope['user'].id}, "
                f"path={scope.get('path', 'unknown')}"
            )
        else:
            logger.debug(
                f"WebSocket anonymous connection: path={scope.get('path', 'unknown')}"
            )
        
        # Call the next middleware/consumer
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def get_user_from_token(self, token_string):
        """
        Validate JWT token and return authenticated user.
        Returns AnonymousUser if token is invalid or user not found.
        """
        if not token_string:
            logger.debug("No token provided in WebSocket connection")
            return AnonymousUser()
        
        try:
            # Decode the JWT token
            access_token = AccessToken(token_string)
            user_id = access_token.get('user_id')
            
            if not user_id:
                logger.warning("Token missing user_id claim")
                return AnonymousUser()
            
            # Get the user from database
            user = User.objects.get(id=user_id)
            
            # Verify user is active
            if not user.is_active:
                logger.warning(
                    f"Inactive user {user.id} attempted WebSocket connection"
                )
                return AnonymousUser()
            
            # Success - return authenticated user
            return user
            
        except (InvalidToken, TokenError) as e:
            logger.warning(f"Invalid JWT token: {type(e).__name__}: {str(e)}")
            return AnonymousUser()
            
        except User.DoesNotExist:
            logger.warning(f"User not found for token user_id: {user_id}")
            return AnonymousUser()
            
        except Exception as e:
            logger.error(
                f"Unexpected error in JWT authentication: {type(e).__name__}: {str(e)}", 
                exc_info=True
            )
            return AnonymousUser()


class WebSocketDenier:
    """
    Simple application that denies all WebSocket connections.
    Used when authentication fails and we want to close immediately.
    """
    
    async def __call__(self, scope, receive, send):
        await send({
            'type': 'websocket.close',
            'code': 4001,  # Unauthorized
        })