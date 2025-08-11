# backend/subleases/signals.py - Update to include application notifications
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Sublease, SubleaseApplication
from .utils import calculate_sublease_proximities, send_application_notification

@receiver(post_save, sender=Sublease)
def handle_sublease_post_save(sender, instance, created, **kwargs):
    """Handle post-save actions for sublease"""
    # Calculate university proximities when location is set
    if instance.latitude and instance.longitude:
        calculate_sublease_proximities(instance)

@receiver(post_save, sender=SubleaseApplication)
def handle_application_post_save(sender, instance, created, **kwargs):
    """Send notification when new application is created"""
    if created:
        send_application_notification(instance)
