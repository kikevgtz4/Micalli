# backend/roommates/signals.py (NEW FILE)
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from accounts.models import User
from .models import RoommateProfile

@receiver(post_save, sender=User)
def sync_user_to_roommate_profile(sender, instance, created, **kwargs):
    """Sync User profile changes to RoommateProfile"""
    if instance.user_type == 'student' and not created:
        try:
            profile = RoommateProfile.objects.get(user=instance)
            updated = False
            
            # Sync fields
            if instance.university and profile.university != instance.university:
                profile.university = instance.university
                updated = True
            
            if instance.program and profile.major != instance.program:
                profile.major = instance.program
                updated = True
                
            if instance.graduation_year and profile.year != instance.graduation_year:
                # Convert graduation year to study year (1-5)
                from datetime import datetime
                current_year = datetime.now().year
                study_year = instance.graduation_year - current_year + 1
                if 1 <= study_year <= 5 and profile.year != study_year:
                    profile.year = study_year
                    updated = True
            
            if updated:
                profile.save()
                
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