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

    # Email verification fields
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    email_verification_sent_at = models.DateTimeField(blank=True, null=True)
    
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
    def is_property_owner(self):
        """Check if user is a property owner"""
        return self.user_type == self.UserType.PROPERTY_OWNER
    
    @property
    def is_student(self):
        """Check if user is a student"""
        return self.user_type == self.UserType.STUDENT
    
    def __str__(self):
        return self.username
    
    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')

class PropertyOwner(models.Model):
    """Property owner specific information"""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='property_owner_profile'
    )
    business_name = models.CharField(max_length=100, blank=True)
    business_registration = models.CharField(max_length=100, blank=True)
    verification_status = models.BooleanField(default=False)
    tax_id = models.CharField(max_length=50, blank=True, help_text="RFC or tax identification")
    business_phone = models.CharField(max_length=20, blank=True)
    business_address = models.TextField(blank=True)
    
    # Additional business fields
    established_year = models.IntegerField(blank=True, null=True)
    property_count = models.IntegerField(default=0)
    verified_at = models.DateTimeField(blank=True, null=True)
    verified_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='verifications_done'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.business_name or self.user.username}'s Business Profile"
    
    class Meta:
        verbose_name = _('Property Owner Profile')
        verbose_name_plural = _('Property Owner Profiles')