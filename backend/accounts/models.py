# backend/accounts/models.py
from datetime import date
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from imagekit.models import ProcessedImageField, ImageSpecField
from imagekit.processors import ResizeToFill, Transpose
import re

class CustomUserManager(BaseUserManager):
    """Custom user manager that uses email instead of username"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        # Set required fields for superuser
        extra_fields.setdefault('first_name', 'Admin')
        extra_fields.setdefault('last_name', 'User')
        
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    """Custom user model for Micalli"""
    
    class UserType(models.TextChoices):
        STUDENT = 'student', _('Student')
        PROPERTY_OWNER = 'property_owner', _('Property Owner')
        ADMIN = 'admin', _('Admin')
    
    # Make email unique and required
    email = models.EmailField(unique=True, db_index=True)
    
    # Override username to be auto-generated
    username = models.CharField(
        max_length=150,
        unique=True,
        help_text='Auto-generated from email',
        validators=[],  # Remove username validators
    )
    
    # Make first_name and last_name required
    first_name = models.CharField(max_length=30, blank=False)
    last_name = models.CharField(max_length=150, blank=False)
    
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.STUDENT,
    )
    date_of_birth = models.DateField(blank=True, null=True, help_text="User's date of birth")

    gender = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        choices=[
            ('male', 'Male'),
            ('female', 'Female'),
            ('other', 'Other'),
        ]
    )
    phone = models.CharField(max_length=20, blank=True, null=True)

    profile_picture = ProcessedImageField(
        upload_to='profile_pictures/',
        processors=[
            Transpose(),
            ResizeToFill(800, 800)  # Square for profiles
        ],
        format='JPEG',
        options={'quality': 90},
        blank=True,
        null=True
    )
    
    profile_thumbnail = ImageSpecField(
        source='profile_picture',
        processors=[ResizeToFill(150, 150)],
        format='JPEG',
        options={'quality': 80}
    )
    
    profile_small = ImageSpecField(
        source='profile_picture',
        processors=[ResizeToFill(50, 50)],
        format='JPEG',
        options={'quality': 75}
    )
    
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
    
    # Use custom manager
    objects = CustomUserManager()
    
    # Use email for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']  # Remove username from required fields
    
    def save(self, *args, **kwargs):
        # Auto-generate username if not provided
        if not self.username:
            base_username = self.email.split('@')[0]
            # Remove special characters and make lowercase
            base_username = re.sub(r'[^a-zA-Z0-9]', '', base_username).lower()
            
            # Ensure uniqueness
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exclude(pk=self.pk).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            self.username = username
        
        super().save(*args, **kwargs)
    
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
        return self.email  # Changed from username to email
    
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
        return f"{self.business_name or self.user.email}'s Business Profile"  # Changed from username to email
    
    class Meta:
        verbose_name = _('Property Owner Profile')
        verbose_name_plural = _('Property Owner Profiles')
