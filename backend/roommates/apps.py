# backend/roommates/apps.py (UPDATE)
from django.apps import AppConfig

class RoommatesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'roommates'
    
    def ready(self):
        import roommates.signals  # Register signals