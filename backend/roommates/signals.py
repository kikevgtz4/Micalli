# backend/roommates/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import User
from .models import RoommateProfile

@receiver(post_save, sender=User)
def update_roommate_profile_completion(sender, instance, created, **kwargs):
    """Update RoommateProfile completion when User fields change"""
    if instance.user_type == 'student' and not created:
        try:
            profile = RoommateProfile.objects.get(user=instance)
            # Just trigger save to recalculate completion percentage
            # The model's save method will handle the calculation
            profile.save(update_fields=['completion_percentage'])
        except RoommateProfile.DoesNotExist:
            pass
