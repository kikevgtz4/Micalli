from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """Custom user model for UniHousing"""
    
    class UserType(models.TextChoices):
        STUDENT = 'student', _('Student')
        PROPERTY_OWNER = 'property_owner', _('Property Owner')
        ADMIN = 'admin', _('Admin')
    
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.STUDENT,
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    
    # Student-specific fields
    university = models.ForeignKey(
        'universities.University', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='students'
    )
    student_id_verified = models.BooleanField(default=False)
    graduation_year = models.IntegerField(null=True, blank=True)
    program = models.CharField(max_length=100, blank=True, null=True)
    
    # Property Owner-specific fields
    verification_status = models.BooleanField(default=False)
    business_name = models.CharField(max_length=100, blank=True, null=True)
    business_registration = models.CharField(max_length=100, blank=True, null=True)

    # Email verification fields
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    email_verification_sent_at = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return self.username
    
    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')