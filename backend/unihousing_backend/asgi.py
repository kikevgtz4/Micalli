# backend/unihousing_backend/asgi.py
import os
from django.core.asgi import get_asgi_application

# IMPORTANT: Set Django settings module BEFORE importing anything else
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'unihousing_backend.settings')

# Initialize Django ASGI application early to ensure settings are loaded
django_asgi_app = get_asgi_application()

# Now import Channels routing after Django is setup
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

# Import these AFTER Django is initialized
from messaging.routing import websocket_urlpatterns
from messaging.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})