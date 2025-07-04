# backend/roommates/signals.py (NEW FILE)
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from accounts.models import User
from .models import RoommateProfile

@receiver(post_save, sender=User)
def sync_user_to_roommate_profile(sender, instance, created, **kwargs):
    """Sync User profile changes to RoommateProfile"""
    # Since RoommateProfile now uses properties to access User fields,
    # we don't need to sync individual fields anymore.
    # Just ensure the profile's completion percentage is recalculated
    if instance.user_type == 'student' and not created:
        try:
            profile = RoommateProfile.objects.get(user=instance)
            # Trigger save to recalculate completion percentage
            profile.save(update_fields=['completion_percentage'])
        except RoommateProfile.DoesNotExist:
            pass

@receiver(pre_save, sender=RoommateProfile)
def sync_roommate_profile_to_user(sender, instance, **kwargs):
    """Sync RoommateProfile changes back to User"""
    if instance.pk:  # Only on update, not create
        try:
            user = instance.user
            updated = False
            
            if instance.university and user.university != instance.university:
                user.university = instance.university
                updated = True
                
            if instance.major and user.program != instance.major:
                user.program = instance.major
                updated = True
                
            if updated:
                user.save()
                
        except Exception:
            pass