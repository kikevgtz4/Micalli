# backend/messaging/apps.py
from django.apps import AppConfig
import logging


class MessagingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'messaging'
    
    def ready(self):
        # Configure logging for messaging app
        logger = logging.getLogger('messaging')
        logger.setLevel(logging.INFO)
