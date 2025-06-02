from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from .utils import ProfileCompletionCalculator

class RoommateProfile(models.Model):
    """Student roommate profile with preferences and matching data"""
    
    SLEEP_SCHEDULE_CHOICES = [
        ('early_bird', _('Early Bird')),
        ('night_owl', _('Night Owl')),
        ('average', _('Average'))
    ]
    
    CLEANLINESS_CHOICES = [
        (1, _('Very Messy')),
        (2, _('Somewhat Messy')),
        (3, _('Average')),
        (4, _('Clean')),
        (5, _('Very Clean'))
    ]
    
    NOISE_TOLERANCE_CHOICES = [
        (1, _('Very Low')),
        (2, _('Low')),
        (3, _('Medium')),
        (4, _('High')),
        (5, _('Very High'))
    ]
    
    GUEST_POLICY_CHOICES = [
        ('rarely', _('Rarely')),
        ('occasionally', _('Occasionally')),
        ('frequently', _('Frequently'))
    ]
    
    GENDER_CHOICES = [
        ('male', _('Male')),
        ('female', _('Female')),
        ('other', _('Other')),
        ('no_preference', _('No Preference'))
    ]
    
    # User association
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='roommate_profile')
    
    # Personal preferences
    sleep_schedule = models.CharField(max_length=20, choices=SLEEP_SCHEDULE_CHOICES, blank=True, null=True)
    cleanliness = models.IntegerField(choices=CLEANLINESS_CHOICES, blank=True, null=True)
    noise_tolerance = models.IntegerField(choices=NOISE_TOLERANCE_CHOICES, blank=True, null=True)
    guest_policy = models.CharField(max_length=20, choices=GUEST_POLICY_CHOICES, blank=True, null=True)
    
    # Academic info
    study_habits = models.TextField(blank=True)
    major = models.CharField(max_length=100, blank=True)
    year = models.PositiveSmallIntegerField(blank=True, null=True, help_text=_("Year of study (1st, 2nd, etc.)"))
    
    # Lifestyle
    hobbies = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    social_activities = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    pet_friendly = models.BooleanField(default=False)
    smoking_allowed = models.BooleanField(default=False)
    dietary_restrictions = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    
    # Matching parameters
    preferred_roommate_gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='no_preference')
    age_range_min = models.PositiveSmallIntegerField(blank=True, null=True)
    age_range_max = models.PositiveSmallIntegerField(blank=True, null=True)
    preferred_roommate_count = models.PositiveSmallIntegerField(default=1)
    
    # Additional information
    bio = models.TextField(blank=True)
    languages = ArrayField(models.CharField(max_length=50), blank=True, default=list)
    
    # University association (optional)
    university = models.ForeignKey('universities.University', on_delete=models.SET_NULL, null=True, blank=True, related_name='student_profiles')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    completion_percentage = models.IntegerField(default=0, db_index=True)
    last_match_calculation = models.DateTimeField(null=True, blank=True)
    
    def calculate_completion(self):
        """Use centralized calculator"""
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
            models.Index(fields=['university', '-created_at']),
            models.Index(fields=['sleep_schedule', 'cleanliness']),
            models.Index(fields=['user', 'university']),
            models.Index(fields=['-updated_at']),
            models.Index(fields=['completion_percentage', '-updated_at']),  # New index
        ]

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