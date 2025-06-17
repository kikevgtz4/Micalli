from datetime import date
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
    date_of_birth = models.DateField(blank=True, null=True, help_text="User's date of birth")
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

    date_of_birth = models.DateField(blank=True, null=True)
    
    @property
    def age(self):
        """Calculate age from date of birth"""
        if not self.date_of_birth:
            return None
        
        today = date.today()
        age = today.year - self.date_of_birth.year
        
        # Check if birthday hasn't occurred this year
        if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
            age -= 1
            
        return age
    
    @property
    def age(self):
        """Calculate age from date of birth"""
        if not self.date_of_birth:
            return None
        
        today = date.today()
        age = today.year - self.date_of_birth.year
        
        # Check if birthday hasn't occurred this year
        if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
            age -= 1
            
        return age
    
    def __str__(self):
        return self.username
    
    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')