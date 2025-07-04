from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from .utils import ProfileCompletionCalculator

class RoommateProfile(models.Model):
    """Student roommate profile with preferences and matching data"""
    
    # Updated choices based on research
    SLEEP_SCHEDULE_CHOICES = [
        ('early_bird', _('Early Bird (Before 10 PM)')),
        ('night_owl', _('Night Owl (After midnight)')),
        ('average', _('Average (10PM - Midnight)'))
    ]
    
    CLEANLINESS_CHOICES = [
        (1, _('Very Messy')),
        (2, _('Somewhat Messy')),
        (3, _('Average')),
        (4, _('Clean')),
        (5, _('Very Clean'))
    ]
    
    NOISE_TOLERANCE_CHOICES = [
        (1, _('Very Low - Need complete silence')),
        (2, _('Low - Prefer quiet')),
        (3, _('Medium - Some noise is OK')),
        (4, _('High - Don\'t mind noise')),
        (5, _('Very High - Love activity'))
    ]
    
    GUEST_POLICY_CHOICES = [
        ('rarely', _('Rarely have guests')),
        ('occasionally', _('Occasionally have guests')),
        ('frequently', _('Frequently have guests'))
    ]
    
    STUDY_HABITS_CHOICES = [
        ('at_home', _('Study at Home')),
        ('library', _('Library/Campus')),
        ('flexible', _('Flexible - Either works for me')),
    ]
    
    GENDER_CHOICES = [
        ('male', _('Male')),
        ('female', _('Female')),
        ('other', _('Other')),
        ('no_preference', _('No Preference'))
    ]
    
    DEAL_BREAKER_CHOICES = [
        ('no_smoking', 'No smoking'),
        ('no_pets', 'No pets'),
        ('same_gender_only', 'Same gender only'),
        ('quiet_study_required', 'Quiet study environment required'),
        ('no_overnight_guests', 'No overnight guests'),
        ('no_late_rent', 'No late rent'),
        ('no_messy_common_areas', 'No messy common areas'),
        ('no_loud_music', 'No loud music'),
        ('no_different_sleep_schedules', 'No different sleep schedules'),
        ('cleaning_schedule_required', 'Cleaning schedule required'),
        ('no_substance_use', 'No substance use'),
        ('compatible_diets_required', 'Compatible diets required'),
    ]
    
    VISIBILITY_CHOICES = [
        ('everyone', 'Everyone'),
        ('matches_only', 'Matches Only'),
        ('nobody', 'Nobody'),
    ]
    
    # User association
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='roommate_profile')
    
    # Core 5 Compatibility Fields (Essential)
    sleep_schedule = models.CharField(max_length=20, choices=SLEEP_SCHEDULE_CHOICES, blank=True, null=True)
    cleanliness = models.IntegerField(choices=CLEANLINESS_CHOICES, blank=True, null=True)
    noise_tolerance = models.IntegerField(choices=NOISE_TOLERANCE_CHOICES, blank=True, null=True)
    guest_policy = models.CharField(max_length=20, choices=GUEST_POLICY_CHOICES, blank=True, null=True)
    study_habits = models.CharField(max_length=20, choices=STUDY_HABITS_CHOICES, blank=True, null=True)
    
    # Identity & Bio
    nickname = models.CharField(max_length=30, blank=True)
    bio = models.TextField(blank=True, max_length=500)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    year = models.PositiveIntegerField(blank=True, null=True, help_text="Academic year (1-5)")
    
    # Housing Preferences
    budget_min = models.PositiveIntegerField(default=0, help_text="Minimum monthly budget in MXN")
    budget_max = models.PositiveIntegerField(default=10000, help_text="Maximum monthly budget in MXN")
    move_in_date = models.DateField(blank=True, null=True, help_text="Preferred move-in date")
    lease_duration = models.CharField(
        max_length=20,
        choices=[
            ('1_month', '1 Month'),
            ('3_months', '3 Months'),
            ('6_months', '6 Months'),
            ('12_months', '12 Months'),
            ('flexible', 'Flexible'),
        ],
        blank=True,
        default='12_months'
    )
    housing_type = models.CharField(
        max_length=20,
        choices=[
            ('apartment', 'Apartment'),
            ('house', 'House'),
            ('studio', 'Studio'),
            ('dorm', 'Dorm'),
            ('shared', 'Shared Room'),
        ],
        blank=True,
        default='apartment'
    )
    
    # Lifestyle
    hobbies = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    social_activities = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    pet_friendly = models.BooleanField(default=False)
    smoking_allowed = models.BooleanField(default=False)
    dietary_restrictions = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    languages = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    
    # Deal Breakers and Preferences
    deal_breakers = ArrayField(
        models.CharField(max_length=50, choices=DEAL_BREAKER_CHOICES),
        blank=True,
        default=list,
        help_text="Non-negotiable requirements"
    )
    personality = ArrayField(
        models.CharField(max_length=100),
        blank=True,
        default=list,
        help_text="Personality traits"
    )
    shared_interests = ArrayField(
        models.CharField(max_length=200),
        blank=True,
        default=list,
        help_text="Interests to share with roommates"
    )
    
    # Matching parameters
    preferred_roommate_gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='no_preference')
    age_range_min = models.PositiveSmallIntegerField(blank=True, null=True)
    age_range_max = models.PositiveSmallIntegerField(blank=True, null=True)
    preferred_roommate_count = models.PositiveSmallIntegerField(default=1)
    
    # Privacy Settings
    profile_visible_to = models.CharField(
        max_length=20,
        choices=[
            ('everyone', 'Everyone'),
            ('verified_only', 'Verified Users Only'),
            ('university_only', 'Same University Only'),
        ],
        default='everyone',
        help_text='Who can see your full profile'
    )
    contact_visible_to = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default='matches_only'
    )
    images_visible_to = models.CharField(
        max_length=20,
        choices=[
            ('everyone', 'Everyone'),
            ('matches_only', 'Matches Only'),
            ('connected_only', 'Connected Users Only'),
        ],
        default='everyone',
        help_text='Who can see your profile images'
    )
    
    # Profile Status
    onboarding_completed = models.BooleanField(
        default=False, 
        help_text='Has user completed initial profile setup'
    )
    completion_percentage = models.IntegerField(default=0, db_index=True)
    last_match_calculation = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Properties to access user's academic info
    @property
    def university(self):
        return self.user.university
    
    @property
    def major(self):
        return self.user.program
    
    @property
    def graduation_year(self):
        return self.user.graduation_year
    
    @property
    def age(self):
        """Get age from user's date of birth"""
        return self.user.age
    
    @property
    def display_name(self):
        """Return nickname if set, otherwise first name, otherwise username"""
        return self.nickname or self.user.first_name or self.user.username
    
    @property
    def full_name(self):
        """Return full name from user model"""
        return f"{self.user.first_name} {self.user.last_name}".strip()
    
    @property
    def first_name(self):
        """Proxy to user first_name for backwards compatibility"""
        return self.user.first_name
    
    @property
    def last_name(self):
        """Proxy to user last_name for backwards compatibility"""
        return self.user.last_name
    
    def calculate_completion(self):
        """Use centralized calculator that considers User fields too"""
        percentage, _ = ProfileCompletionCalculator.calculate_completion(self)
        return percentage
    
    def get_missing_required_fields(self):
        """Get list of missing required fields"""
        _, missing = ProfileCompletionCalculator.calculate_completion(self)
        return missing
    
    def save(self, *args, **kwargs):
        self.completion_percentage = self.calculate_completion()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Roommate Profile: {self.user.get_full_name() or self.user.username}"
    
    class Meta:
        verbose_name = _('Roommate Profile')
        verbose_name_plural = _('Roommate Profiles')
        indexes = [
            models.Index(fields=['sleep_schedule', 'cleanliness']),
            models.Index(fields=['user']),
            models.Index(fields=['-updated_at']),
            models.Index(fields=['completion_percentage', '-updated_at']),
            models.Index(fields=['-created_at']),
        ]


class RoommateProfileImage(models.Model):
    """Images for roommate profiles"""
    profile = models.ForeignKey(
        RoommateProfile, 
        on_delete=models.CASCADE, 
        related_name='images'
    )
    image = models.ImageField(
        upload_to='roommate_images/%Y/%m/',
        help_text='Recommended size: 800x800px, Max file size: 5MB'
    )
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    is_approved = models.BooleanField(
        default=True,
        help_text='Set to False if reported/under review'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', '-uploaded_at']
        verbose_name = 'Roommate Profile Image'
        verbose_name_plural = 'Roommate Profile Images'
        indexes = [
            models.Index(fields=['profile', 'is_primary']),
            models.Index(fields=['profile', 'order']),
        ]
        
    def save(self, *args, **kwargs):
        # Ensure only one primary image per profile
        if self.is_primary:
            RoommateProfileImage.objects.filter(
                profile=self.profile, 
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        
        # If this is the first image, make it primary
        if not self.pk and not RoommateProfileImage.objects.filter(profile=self.profile).exists():
            self.is_primary = True
            
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"Image {self.order} for {self.profile.user.username}"


class ImageReport(models.Model):
    """Reports for inappropriate images"""
    REASON_CHOICES = [
        ('inappropriate', 'Inappropriate content'),
        ('fake', 'Fake or misleading'),
        ('offensive', 'Offensive content'),
        ('spam', 'Spam or advertisement'),
        ('other', 'Other'),
    ]
    
    image = models.ForeignKey(RoommateProfileImage, on_delete=models.CASCADE, related_name='reports')
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='resolved_reports'
    )
    
    class Meta:
        unique_together = ('image', 'reported_by')
        ordering = ['-created_at']


class RoommateRequest(models.Model):
    """Posts for roommate requests in the feed"""
    
    STATUS_CHOICES = [
        ('active', _('Active')),
        ('fulfilled', _('Fulfilled')),
        ('closed', _('Closed'))
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='roommate_requests')
    title = models.CharField(max_length=200)
    description = models.TextField()
    university = models.ForeignKey('universities.University', on_delete=models.SET_NULL, null=True, blank=True)
    preferred_areas = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    budget_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    move_in_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Roommate Request: {self.title} by {self.user.username}"
    
    class Meta:
        verbose_name = _('Roommate Request')
        verbose_name_plural = _('Roommate Requests')
        ordering = ['-created_at']


class RoommateMatch(models.Model):
    """Matches between potential roommates"""
    
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('accepted', _('Accepted')),
        ('declined', _('Declined'))
    ]
    
    user_from = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='roommate_matches_sent')
    user_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='roommate_matches_received')
    compatibility_score = models.DecimalField(max_digits=5, decimal_places=2, help_text=_("Percentage of compatibility"))
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Match: {self.user_from.username} -> {self.user_to.username} ({self.compatibility_score}%)"
    
    class Meta:
        verbose_name = _('Roommate Match')
        verbose_name_plural = _('Roommate Matches')
        unique_together = ('user_from', 'user_to')


class MatchAnalytics(models.Model):
    """Track matching algorithm performance"""
    
    match = models.ForeignKey(RoommateMatch, on_delete=models.CASCADE)
    compatibility_score = models.DecimalField(max_digits=5, decimal_places=2)
    factor_scores = models.JSONField()
    user_feedback = models.IntegerField(
        choices=[(1, 'Poor'), (2, 'Fair'), (3, 'Good'), (4, 'Great'), (5, 'Perfect')],
        null=True, blank=True
    )
    match_outcome = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('accepted', 'Accepted'),
            ('declined', 'Declined'),
            ('successful', 'Living Together'),
            ('unsuccessful', 'Did Not Work Out')
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Match Analytics'
        verbose_name_plural = 'Match Analytics'