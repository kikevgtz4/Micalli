# backend/messaging/middleware.py
import logging
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
import time

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
        start_time = time.time()
        
        # Parse query string to get token
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        # Log connection attempt
        logger.debug(f"WebSocket connection attempt - path: {scope.get('path', 'unknown')}")
        
        # Authenticate user
        scope['user'] = await self.get_user_from_token(token)
        
        # Log authentication result
        auth_time = time.time() - start_time
        if scope['user'].is_authenticated:
            logger.info(
                f"WebSocket authenticated: user_id={scope['user'].id}, "
                f"path={scope.get('path', 'unknown')}, "
                f"auth_time={auth_time:.3f}s"
            )
        else:
            logger.debug(
                f"WebSocket anonymous connection: path={scope.get('path', 'unknown')}, "
                f"auth_time={auth_time:.3f}s"
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
            
            # Check if token is expired
            if access_token.get('exp', 0) < time.time():
                logger.warning("Expired JWT token in WebSocket connection")
                return AnonymousUser()
            
            user_id = access_token.get('user_id')
            
            if not user_id:
                logger.warning("Token missing user_id claim")
                return AnonymousUser()
            
            # Get the user from database (removed select_related)
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                logger.warning(f"User not found for token user_id: {user_id}")
                return AnonymousUser()
            
            # Verify user is active
            if not user.is_active:
                logger.warning(
                    f"Inactive user {user.id} attempted WebSocket connection"
                )
                return AnonymousUser()
            
            # Success - return authenticated user
            return user
            
        except InvalidToken as e:
            logger.warning(f"Invalid JWT token: {str(e)}")
            return AnonymousUser()
            
        except TokenError as e:
            logger.warning(f"JWT token error: {type(e).__name__}: {str(e)}")
            return AnonymousUser()
            
        except Exception as e:
            logger.error(
                f"Unexpected error in JWT authentication: {type(e).__name__}: {str(e)}", 
                exc_info=True
            )
            return AnonymousUser()


class WebSocketOriginValidator(BaseMiddleware):
    """
    Additional security middleware to validate WebSocket origin.
    """
    
    def __init__(self, app, allowed_origins=None):
        super().__init__(app)
        self.allowed_origins = allowed_origins or []
    
    async def __call__(self, scope, receive, send):
        """
        Validate the origin of WebSocket connections.
        """
        if scope['type'] == 'websocket':
            headers = dict(scope.get('headers', []))
            origin = headers.get(b'origin', b'').decode()
            
            if origin and self.allowed_origins:
                if origin not in self.allowed_origins:
                    logger.warning(f"WebSocket connection rejected - invalid origin: {origin}")
                    await send({
                        'type': 'websocket.close',
                        'code': 4003,  # Forbidden
                    })
                    return
        
        return await super().__call__(scope, receive, send)