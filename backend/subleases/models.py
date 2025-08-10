from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import User
from universities.models import University
import random
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

class Sublease(models.Model):
    """Main sublease listing model - independent of Property model"""
    
    # Listing Types
    class ListingType(models.TextChoices):
        SUMMER = 'summer', _('Summer Sublease')
        SEMESTER = 'semester', _('Semester Sublease')
        TEMPORARY = 'temporary', _('Temporary Sublease')
        TAKEOVER = 'takeover', _('Lease Takeover')
    
    # Sublease Types (what's being offered)
    class SubleaseType(models.TextChoices):
        ENTIRE_PLACE = 'entire_place', _('Entire Place')
        PRIVATE_ROOM = 'private_room', _('Private Room')
        SHARED_ROOM = 'shared_room', _('Shared Room')
    
    # Status
    class Status(models.TextChoices):
        DRAFT = 'draft', _('Draft')
        ACTIVE = 'active', _('Active')
        PENDING = 'pending', _('Pending')
        FILLED = 'filled', _('Filled')
        EXPIRED = 'expired', _('Expired')
        CANCELLED = 'cancelled', _('Cancelled')
    
    # Urgency Levels
    class UrgencyLevel(models.TextChoices):
        LOW = 'low', _('Low - Flexible Timeline')
        MEDIUM = 'medium', _('Medium - Within 30 days')
        HIGH = 'high', _('High - Within 2 weeks')
        URGENT = 'urgent', _('Urgent - ASAP')
    
    # Landlord Consent Status - Tiered approach
    class ConsentStatus(models.TextChoices):
        NOT_REQUIRED = 'not_required', _('Not Required')
        CONFIRMED = 'confirmed', _('Confirmed by User')
        DOCUMENTED = 'documented', _('Documentation Uploaded')
        VERIFIED = 'verified', _('Verified by Admin')
    
    # Property Types (for places not in our system)
    class PropertyType(models.TextChoices):
        APARTMENT = 'apartment', _('Apartment')
        HOUSE = 'house', _('House')
        STUDIO = 'studio', _('Studio')
        DORM = 'dorm', _('Dormitory')
        CONDO = 'condo', _('Condominium')
    
    # Identity & Ownership
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subleases')
    listing_type = models.CharField(max_length=20, choices=ListingType.choices)
    sublease_type = models.CharField(max_length=20, choices=SubleaseType.choices)
    
    # Property Type (since not linked to Property model)
    property_type = models.CharField(
        max_length=20, 
        choices=PropertyType.choices,
        default=PropertyType.APARTMENT
    )
    
    # Temporal Fields
    start_date = models.DateField()
    end_date = models.DateField()
    is_flexible = models.BooleanField(default=False)
    flexibility_range_days = models.PositiveIntegerField(
        default=7,
        validators=[MaxValueValidator(30)],
        help_text="How many days flexible on start/end dates"
    )
    available_immediately = models.BooleanField(default=False)
    
    # Location (with privacy offset like Property model)
    address = models.CharField(max_length=255)
    display_neighborhood = models.CharField(max_length=100)
    display_area = models.CharField(max_length=100)
    city = models.CharField(max_length=100, default="Monterrey")
    state = models.CharField(max_length=100, default="Nuevo León")
    
    # Exact coordinates (private)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Approximate coordinates for privacy (public)
    approx_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    approx_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    privacy_radius = models.IntegerField(default=250)
    
    # Financial
    original_rent = models.DecimalField(max_digits=10, decimal_places=2)
    sublease_rent = models.DecimalField(max_digits=10, decimal_places=2)
    deposit_required = models.BooleanField(default=True)
    deposit_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True
    )
    utilities_included = ArrayField(
        models.CharField(max_length=50),
        blank=True,
        default=list,
        help_text="e.g., water, electricity, internet, gas"
    )
    additional_fees = models.JSONField(
        default=dict,
        blank=True,
        help_text="Any additional fees like parking, maintenance, etc."
    )
    
    # Property Details
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # For entire place / private room
    bedrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    bathrooms = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    total_area = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Area in square meters"
    )
    furnished = models.BooleanField(default=False)
    amenities = ArrayField(
        models.CharField(max_length=100),
        blank=True,
        default=list,
        help_text="e.g., parking, gym, pool, laundry"
    )
    
    # For shared room / roommate situations
    total_roommates = models.PositiveSmallIntegerField(
        null=True, 
        blank=True,
        help_text="Total number of people living in the space"
    )
    current_roommates = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Number of current roommates"
    )
    roommate_genders = models.CharField(
        max_length=20,
        choices=[
            ('all_male', _('All Male')),
            ('all_female', _('All Female')),
            ('mixed', _('Mixed')),
            ('prefer_not_say', _('Prefer Not to Say'))
        ],
        default='prefer_not_say'
    )
    roommate_description = models.TextField(
        blank=True,
        help_text="Description of current roommates, their schedules, habits, etc."
    )
    shared_spaces = ArrayField(
        models.CharField(max_length=100),
        blank=True,
        default=list,
        help_text="e.g., kitchen, living room, bathroom"
    )
    
    # Legal & Verification
    landlord_consent_status = models.CharField(
        max_length=20,
        choices=ConsentStatus.choices,
        default=ConsentStatus.NOT_REQUIRED
    )
    landlord_consent_document = models.FileField(
        upload_to='sublease_consent/',
        null=True,
        blank=True,
        help_text="Optional: Upload landlord consent documentation"
    )
    lease_transfer_allowed = models.BooleanField(
        default=False,
        help_text="Can the lease be transferred to subletter's name?"
    )
    sublease_agreement_required = models.BooleanField(
        default=True,
        help_text="Will you require a sublease agreement?"
    )
    
    # Legal Disclaimer
    disclaimers_accepted = models.BooleanField(default=False)
    disclaimers_accepted_at = models.DateTimeField(null=True, blank=True)
    
    # Status & Metadata
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    urgency_level = models.CharField(
        max_length=20, 
        choices=UrgencyLevel.choices,
        default=UrgencyLevel.MEDIUM
    )
    
    # Engagement metrics
    views_count = models.PositiveIntegerField(default=0)
    saved_count = models.PositiveIntegerField(default=0)
    inquiry_count = models.PositiveIntegerField(default=0)
    
    # Rules & Requirements
    pet_friendly = models.BooleanField(default=False)
    smoking_allowed = models.BooleanField(default=False)
    requirements = ArrayField(
        models.CharField(max_length=200),
        blank=True,
        default=list,
        help_text="e.g., 'No parties', 'Quiet after 10pm', 'Clean shared spaces'"
    )
    preferred_tenant = models.TextField(
        blank=True,
        help_text="Describe your ideal subletter"
    )
    
    # Verification status
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subleases_verified'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    def generate_privacy_offset(self):
        """Generate approximate coordinates with privacy offset"""
        if not self.latitude or not self.longitude:
            return None, None
        
        offset_range = self.privacy_radius / 111000
        lat_offset = random.uniform(-offset_range, offset_range)
        lng_offset = random.uniform(-offset_range, offset_range)
        
        return (
            Decimal(str(float(self.latitude) + lat_offset)),
            Decimal(str(float(self.longitude) + lng_offset))
        )
    
    def save(self, *args, **kwargs):
        if self.status == self.Status.ACTIVE and not self.published_at:
            self.published_at = timezone.now()
        
        if self.disclaimers_accepted and not self.disclaimers_accepted_at:
            self.disclaimers_accepted_at = timezone.now()
        
        if self.latitude and self.longitude and not self.approx_latitude:
            self.approx_latitude, self.approx_longitude = self.generate_privacy_offset()
        
        if not self.expires_at and self.end_date:
            self.expires_at = datetime.combine(self.end_date, datetime.min.time())
        
        super().save(*args, **kwargs)
    
    @property
    def duration_months(self):
        """Calculate duration in months"""
        if self.start_date and self.end_date:
            delta = self.end_date - self.start_date
            return round(delta.days / 30, 1)
        return 0
    
    @property
    def discount_percentage(self):
        """Calculate discount from original rent"""
        if self.original_rent and self.sublease_rent:
            discount = ((self.original_rent - self.sublease_rent) / self.original_rent) * 100
            return round(max(0, discount), 1)
        return 0
    
    @property
    def is_urgent(self):
        """Check if listing should be marked as urgent"""
        if self.urgency_level == self.UrgencyLevel.URGENT:
            return True
        if self.start_date:
            days_until = (self.start_date - timezone.now().date()).days
            return days_until <= 14
        return False
    
    def __str__(self):
        return f"{self.title} - {self.get_sublease_type_display()}"
    
    class Meta:
        verbose_name = _('Sublease')
        verbose_name_plural = _('Subleases')
        ordering = ['-urgency_level', '-created_at']
        indexes = [
            models.Index(fields=['status', 'urgency_level']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['sublease_type', 'status']),
        ]


class SubleaseImage(models.Model):
    """Images for sublease listings"""
    sublease = models.ForeignKey(Sublease, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='sublease_images/')
    thumbnail = models.ImageField(upload_to='sublease_thumbnails/', blank=True, null=True)
    is_main = models.BooleanField(default=False)
    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'uploaded_at']
        verbose_name = _('Sublease Image')
        verbose_name_plural = _('Sublease Images')
    
    def save(self, *args, **kwargs):
        # Process main image before saving
        if self.image and not self.pk:  # Only on creation
            from .utils import process_sublease_image, create_thumbnail
            process_sublease_image(self.image)
            
            # Create thumbnail
            if self.image:
                thumbnail_content = create_thumbnail(self.image)
                if thumbnail_content:
                    self.thumbnail.save(
                        f"thumb_{self.image.name}",
                        thumbnail_content,
                        save=False
                    )
        
        # Ensure only one main image per sublease
        if self.is_main:
            SubleaseImage.objects.filter(
                sublease=self.sublease,
                is_main=True
            ).exclude(pk=self.pk).update(is_main=False)
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Image for {self.sublease.title}"


class SubleaseApplication(models.Model):
    """Applications for subleases"""
    
    class ApplicationStatus(models.TextChoices):
        PENDING = 'pending', _('Pending Review')
        REVIEWING = 'reviewing', _('Under Review')
        ACCEPTED = 'accepted', _('Accepted')
        REJECTED = 'rejected', _('Rejected')
        WITHDRAWN = 'withdrawn', _('Withdrawn')
    
    sublease = models.ForeignKey(Sublease, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sublease_applications')
    
    # Application details
    move_in_date = models.DateField()
    message = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    
    # Optional fields
    occupation = models.CharField(max_length=100, blank=True)
    references_available = models.BooleanField(default=False)
    has_pets = models.BooleanField(default=False)
    pet_details = models.CharField(max_length=200, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.PENDING
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = [('sublease', 'applicant')]
        ordering = ['-created_at']
        verbose_name = _('Sublease Application')
        verbose_name_plural = _('Sublease Applications')
    
    def __str__(self):
        return f"Application by {self.applicant.email} for {self.sublease.title}"


class SubleaseVerification(models.Model):
    """Document verification for subleases"""
    
    class DocumentType(models.TextChoices):
        LEASE = 'lease', _('Original Lease Agreement')
        CONSENT = 'consent', _('Landlord Consent Form')
        ID = 'id', _('Photo ID')
        UTILITY = 'utility', _('Utility Bill')
        OTHER = 'other', _('Other Document')
    
    sublease = models.ForeignKey(Sublease, on_delete=models.CASCADE, related_name='verifications')
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    document = models.FileField(upload_to='sublease_verifications/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sublease_verifications_reviewed'
    )
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = _('Sublease Verification')
        verbose_name_plural = _('Sublease Verifications')
    
    def __str__(self):
        return f"{self.get_document_type_display()} for {self.sublease.title}"


class SubleaseUniversityProximity(models.Model):
    """Track proximity to universities like PropertyUniversityProximity"""
    sublease = models.ForeignKey(
        Sublease, 
        on_delete=models.CASCADE, 
        related_name='university_proximities'
    )
    university = models.ForeignKey(
        University, 
        on_delete=models.CASCADE, 
        related_name='sublease_proximities'
    )
    distance_in_meters = models.PositiveIntegerField(help_text="Distance in meters")
    walking_time_minutes = models.PositiveIntegerField(
        help_text="Estimated walking time in minutes"
    )
    public_transport_time_minutes = models.PositiveIntegerField(
        blank=True, 
        null=True,
        help_text="Estimated public transport time in minutes"
    )
    
    class Meta:
        verbose_name = _('Sublease University Proximity')
        verbose_name_plural = _('Sublease University Proximities')
        unique_together = [('sublease', 'university')]
        ordering = ['distance_in_meters']
    
    def __str__(self):
        return f"{self.sublease.title} - {self.university.name} ({self.distance_in_meters}m)"


class SubleaseSave(models.Model):
    """Track saved subleases by users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_subleases')
    sublease = models.ForeignKey(Sublease, on_delete=models.CASCADE, related_name='saves')
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = [('user', 'sublease')]
        ordering = ['-saved_at']
        verbose_name = _('Saved Sublease')
        verbose_name_plural = _('Saved Subleases')
    
    def __str__(self):
        return f"{self.user.email} saved {self.sublease.title}"