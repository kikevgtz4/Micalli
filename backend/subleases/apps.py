# backend/subleases/apps.py
from django.apps import AppConfig

class SubleasesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'subleases'
    verbose_name = 'Subleases'
    
    def ready(self):
        import subleases.signals  # Now uncomment this
