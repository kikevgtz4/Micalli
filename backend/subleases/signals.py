# backend/subleases/signals.py (new file)
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Sublease
from .utils import calculate_sublease_proximities

@receiver(post_save, sender=Sublease)
def handle_sublease_post_save(sender, instance, created, **kwargs):
    """Handle post-save actions for sublease"""
    
    # Calculate university proximities when location is set
    if instance.latitude and instance.longitude:
        calculate_sublease_proximities(instance)