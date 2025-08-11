# backend/micalli_backend/asgi.py
import os
import django
from django.core.asgi import get_asgi_application

# IMPORTANT: Set Django settings module BEFORE importing anything else
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'micalli_backend.settings')

# Initialize Django ASGI application early to ensure settings are loaded
django.setup()  # Explicitly setup Django
django_asgi_app = get_asgi_application()

# Now import Channels routing after Django is setup
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator, OriginValidator

# Import these AFTER Django is initialized
from messaging.routing import websocket_urlpatterns
from messaging.middleware import JWTAuthMiddleware, WebSocketOriginValidator

# Get allowed origins from settings
from django.conf import settings

# Create the application with proper middleware stack
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        WebSocketOriginValidator(
            JWTAuthMiddleware(
                URLRouter(websocket_urlpatterns)
            ),
            allowed_origins=getattr(settings, 'WEBSOCKET_ALLOWED_ORIGINS', [])
        )
    ),
})
