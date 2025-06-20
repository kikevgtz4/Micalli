# Create backend/accounts/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, PropertyOwner

@receiver(post_save, sender=User)
def create_property_owner_profile(sender, instance, created, **kwargs):
    """Create PropertyOwner profile when a property owner user is created"""
    if created and instance.user_type == 'property_owner':
        PropertyOwner.objects.create(user=instance)
    elif not created and instance.user_type == 'property_owner':
        # If user type changed to property_owner, create profile if doesn't exist
        PropertyOwner.objects.get_or_create(user=instance)