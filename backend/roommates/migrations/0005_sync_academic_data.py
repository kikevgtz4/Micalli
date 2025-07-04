# backend/roommates/migrations/0005_sync_academic_data.py
from django.db import migrations

def sync_academic_data(apps, schema_editor):
    """Sync academic data from RoommateProfile to User model"""
    RoommateProfile = apps.get_model('roommates', 'RoommateProfile')
    
    for profile in RoommateProfile.objects.all():
        user = profile.user
        updated = False
        
        # Only sync if User doesn't have these fields set
        if hasattr(profile, 'university_id') and profile.university_id and not user.university_id:
            user.university_id = profile.university_id
            updated = True
            
        if hasattr(profile, 'major') and profile.major and not user.program:
            user.program = profile.major
            updated = True
            
        # Don't convert year anymore - just sync directly
        if hasattr(profile, 'year') and profile.year and not user.graduation_year:
            # If you have existing data with study years (1-5), you might need conversion here
            # Otherwise, just sync directly
            user.graduation_year = profile.year
            updated = True
            
        if updated:
            user.save()
            print(f"Updated user {user.username} with academic data")

def reverse_sync(apps, schema_editor):
    """Reverse operation - not needed as we're removing fields"""
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('roommates', '0004_remove_roommateprofile_roommates_r_univers_04052e_idx_and_more'),
    ]
    
    operations = [
        migrations.RunPython(sync_academic_data, reverse_sync),
    ]