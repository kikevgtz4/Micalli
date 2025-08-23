# backend/roommates/models.py
from django.utils import timezone
from django.db import IntegrityError
from datetime import timedelta
from imagekit.models import ProcessedImageField, ImageSpecField
from imagekit.processors import ResizeToFit, SmartResize, Transpose
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
    
    # Add this property to access gender from user
    @property
    def gender(self):
        """Get gender from user model"""
        return self.user.gender
    
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
    
    # Change to ProcessedImageField
    image = ProcessedImageField(
        upload_to='roommate_images/%Y/%m/',
        processors=[
            Transpose(),  # Auto-rotate based on EXIF
            ResizeToFit(1200, 1200)  # Max dimensions
        ],
        format='JPEG',
        options={'quality': 90, 'optimize': True, 'progressive': True},
        help_text='Recommended size: 800x800px, Max file size: 5MB'
    )
    
    # Add ImageSpecFields for thumbnails
    thumbnail = ImageSpecField(
        source='image',
        processors=[SmartResize(400, 400)],
        format='JPEG',
        options={'quality': 85}
    )
    
    profile_thumbnail = ImageSpecField(
        source='image',
        processors=[SmartResize(150, 150)],
        format='JPEG',
        options={'quality': 80}
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

# backend/roommates/models.py - ADD this

class MatchRequest(models.Model):
    """
    Match request between students (like LinkedIn connection)
    Silent rejection - sender won't know if rejected
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),  # Silent - sender won't be notified
        ('cancelled', 'Cancelled'),  # If sender cancels their own request
    ]
    
    # Who sent the match request
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_match_requests'
    )
    
    # Who receives the match request
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_match_requests'
    )
    
    # Link to the AI match recommendation (if applicable)
    match_recommendation = models.ForeignKey(
        'RoommateMatch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="The AI recommendation that prompted this request"
    )
    
    # Messages
    initial_message = models.TextField(
        max_length=500,
        blank=True,
        help_text="Optional message sent with match request"
    )
    
    response_message = models.TextField(
        max_length=500,
        blank=True,
        help_text="Optional response message when accepting"
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True  # Important for performance
    )
    
    # Linked conversation (created when accepted)
    conversation = models.ForeignKey(
        'messaging.Conversation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='match_request'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    # Internal tracking
    rejection_reason = models.TextField(blank=True)  # Internal only
    sender_ip = models.GenericIPAddressField(null=True, blank=True)  # Anti-spam
    
    class Meta:
        # Only prevent duplicate PENDING requests between same users
        constraints = [
            models.UniqueConstraint(
                fields=['sender', 'receiver'],
                condition=models.Q(status='pending'),
                name='unique_pending_match_request'
            )
        ]
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['receiver', 'status', '-created_at']),
            models.Index(fields=['sender', 'status', '-created_at']),
            models.Index(fields=['status', 'created_at']),  # For admin/analytics
        ]
    
    def __str__(self):
        return f"Match Request: {self.sender} to {self.receiver} ({self.status})" 
    
    def clean(self):
        """Validate the match request"""
        from django.core.exceptions import ValidationError
        
        # Prevent self-matching
        if self.sender_id and self.receiver_id and self.sender_id == self.receiver_id:
            raise ValidationError("Cannot send match request to yourself")
        
        # Add any other model-level validations here
        super().clean()
    
    def save(self, *args, **kwargs):
        """Override save to call full_clean"""
        if not self.pk:  # Only validate on creation
            self.full_clean()
        super().save(*args, **kwargs)
    
    def accept(self, response_message=''):
        """Accept match request and create conversation"""
        from messaging.models import Conversation, Message
        from django.utils import timezone
        
        if self.status != 'pending':
            raise ValueError(f"Cannot accept {self.status} request")
        
        # Update status
        self.status = 'accepted'
        self.responded_at = timezone.now()
        self.response_message = response_message
        
        # Create conversation with proper type
        conversation = Conversation.objects.create(
            conversation_type='roommate_match',
            status='active',
            initial_message_template='match_accepted'
        )
        conversation.participants.add(self.sender, self.receiver)
        
        # Create initial message if provided
        if self.initial_message:
            Message.objects.create(
                conversation=conversation,
                sender=self.sender,
                content=self.initial_message,
                message_type='text',
                metadata={
                    'is_initial_match_message': True,
                    'match_request_id': self.id
                }
            )
        
        # System message for match acceptance
        Message.objects.create(
            conversation=conversation,
            sender=self.receiver,
            content="¡Match aceptado! Ahora pueden chatear.",
            message_type='system',
            metadata={
                'type': 'match_accepted',
                'match_request_id': self.id
            }
        )
        
        # Add response message if provided
        if response_message:
            Message.objects.create(
                conversation=conversation,
                sender=self.receiver,
                content=response_message,
                message_type='text',
                metadata={'is_match_acceptance_message': True}
            )
        
        self.conversation = conversation
        self.save()
        
        # Send notification to sender
        from messaging.tasks import send_match_accepted_email
        send_match_accepted_email.delay(self.id)
        
        return conversation
    
    def reject(self, rejection_reason=''):
        """Silently reject match request - NO notification to sender"""
        from django.utils import timezone
        
        if self.status != 'pending':
            raise ValueError(f"Cannot reject {self.status} request")
        
        self.status = 'rejected'
        self.responded_at = timezone.now()
        self.rejection_reason = rejection_reason  # Internal tracking only
        self.save()
        
        # NO email notification - silent rejection as requested
    
    def cancel(self):
        """Sender cancels their own request"""
        if self.status != 'pending':
            raise ValueError(f"Cannot cancel {self.status} request")
        
        self.status = 'cancelled'
        self.save()


class MatchRequestDailyLimit(models.Model):
    """Track daily match request limits per user"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    count = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['user', 'date']
        indexes = [
            models.Index(fields=['user', 'date']),
        ]
    
    @classmethod
    def can_send_request(cls, user):
        """Check if user can send more requests today"""
        today = timezone.now().date()
        limit_obj, created = cls.objects.get_or_create(
            user=user,
            date=today,
            defaults={'count': 0}
        )
        return limit_obj.count < 25  # Daily limit
    
    @classmethod
    def increment(cls, user):
        """Increment user's daily count"""
        today = timezone.now().date()
        limit_obj, created = cls.objects.get_or_create(
            user=user,
            date=today,
            defaults={'count': 0}
        )
        limit_obj.count += 1
        limit_obj.save()
        return limit_obj.count

    @classmethod
    def get_count(cls, user):
        """Get today's request count for user"""
        today = timezone.now().date()
        try:
            limit_obj = cls.objects.get(user=user, date=today)
            return limit_obj.count
        except cls.DoesNotExist:
            return 0
        
class UserBlock(models.Model):
    """
    Allow users to block other users from contacting them.
    Blocking is one-way and private (blocked user won't know).
    """
    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='users_blocked'
    )
    blocked = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='blocked_by_users'
    )
    
    BLOCK_REASONS = [
        ('harassment', 'Harassment or inappropriate behavior'),
        ('spam', 'Spam or excessive messages'),
        ('fake_profile', 'Fake or misleading profile'),
        ('uncomfortable', 'Makes me uncomfortable'),
        ('other', 'Other reason'),
    ]
    
    reason = models.CharField(
        max_length=20,
        choices=BLOCK_REASONS,
        default='other'
    )
    notes = models.TextField(
        blank=True,
        help_text="Private notes about why this user was blocked"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('blocker', 'blocked')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['blocker', 'blocked']),
            models.Index(fields=['blocked', 'blocker']),  # For reverse lookups
        ]
    
    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"
    
    @classmethod
    def is_blocked(cls, user1, user2):
        """Check if either user has blocked the other"""
        return cls.objects.filter(
            models.Q(blocker=user1, blocked=user2) |
            models.Q(blocker=user2, blocked=user1)
        ).exists()
    
    @classmethod
    def get_blocked_users(cls, user):
        """Get list of user IDs that this user has blocked"""
        return cls.objects.filter(blocker=user).values_list('blocked_id', flat=True)
    
    @classmethod
    def get_blocking_users(cls, user):
        """Get list of user IDs that have blocked this user"""
        return cls.objects.filter(blocked=user).values_list('blocker_id', flat=True)

class ProfileView(models.Model):
    """
    Track who viewed whose profile for analytics and premium features.
    Anonymous views after 30 days for privacy.
    """
    viewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile_views_made',
        null=True,  # Null for anonymous views
        blank=True
    )
    viewed_profile = models.ForeignKey(
        RoommateProfile,
        on_delete=models.CASCADE,
        related_name='profile_views'
    )
    
    # View context
    VIEW_SOURCES = [
        ('search', 'Search Results'),
        ('match', 'Match Suggestions'),
        ('direct', 'Direct Link'),
        ('conversation', 'From Conversation'),
        ('unknown', 'Unknown'),
    ]
    
    source = models.CharField(
        max_length=20,
        choices=VIEW_SOURCES,
        default='unknown'
    )
    
    # For tracking view duration (optional)
    duration_seconds = models.IntegerField(
        null=True,
        blank=True,
        help_text="How long the profile was viewed"
    )
    
    # Privacy
    is_anonymous = models.BooleanField(
        default=False,
        help_text="Hide viewer identity from viewed user"
    )
    
    # Metadata
    viewer_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    
    # Timestamps
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['viewed_profile', '-viewed_at']),
            models.Index(fields=['viewer', '-viewed_at']),
            models.Index(fields=['viewed_at']),  # For cleanup queries
            models.Index(
                fields=['viewed_profile', 'viewer'],
                name='unique_daily_view'
            ),
        ]
    
    def __str__(self):
        if self.viewer:
            return f"{self.viewer.username} viewed {self.viewed_profile.user.username}'s profile"
        return f"Anonymous viewed {self.viewed_profile.user.username}'s profile"
    
    @classmethod
    def log_view(cls, viewer, profile, source='unknown', request=None):
        """
        Log a profile view with deduplication (one per day per viewer).
        Returns (view_instance, created)
        """
        from django.utils import timezone
        from datetime import timedelta
        
        # Check if user has viewed this profile today
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        existing_view = cls.objects.filter(
            viewer=viewer,
            viewed_profile=profile,
            viewed_at__gte=today_start
        ).first()
        
        if existing_view:
            # Update the timestamp of existing view
            existing_view.viewed_at = timezone.now()
            existing_view.save(update_fields=['viewed_at'])
            return existing_view, False
        
        # Create new view
        view_data = {
            'viewer': viewer,
            'viewed_profile': profile,
            'source': source,
        }
        
        # Add request metadata if available
        if request:
            view_data['viewer_ip'] = cls._get_client_ip(request)
            view_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')[:255]
        
        view = cls.objects.create(**view_data)
        return view, True
    
    @staticmethod
    def _get_client_ip(request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
    
    @classmethod
    def get_recent_viewers(cls, profile, days=30, exclude_anonymous=True):
        """Get recent profile viewers"""
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff = timezone.now() - timedelta(days=days)
        query = cls.objects.filter(
            viewed_profile=profile,
            viewed_at__gte=cutoff
        )
        
        if exclude_anonymous:
            query = query.filter(is_anonymous=False, viewer__isnull=False)
        
        return query.select_related('viewer').distinct('viewer')
    
    @classmethod
    def anonymize_old_views(cls, days=30):
        """Anonymize views older than X days for privacy"""
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff = timezone.now() - timedelta(days=days)
        updated = cls.objects.filter(
            viewed_at__lt=cutoff,
            is_anonymous=False
        ).update(
            viewer=None,
            is_anonymous=True,
            viewer_ip=None,
            user_agent=''
        )
        return updated
    
class MatchSuggestion(models.Model):
    """
    AI-powered match suggestions with explanations.
    Generated periodically or on-demand.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='match_suggestions_received'
    )
    suggested_profile = models.ForeignKey(
        RoommateProfile,
        on_delete=models.CASCADE,
        related_name='suggested_to_users'
    )
    
    # Scoring
    compatibility_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="AI-calculated compatibility percentage"
    )
    factor_scores = models.JSONField(
        default=dict,
        help_text="Breakdown of individual compatibility factors"
    )
    
    # AI Explanation
    explanation = models.TextField(
        help_text="AI-generated explanation of why this is a good match"
    )
    key_compatibilities = models.JSONField(
        default=list,
        help_text="Top 3 reasons for compatibility"
    )
    potential_conflicts = models.JSONField(
        default=list,
        help_text="Potential areas of incompatibility"
    )
    
    # User interaction
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('viewed', 'Viewed'),
        ('contacted', 'Contacted'),
        ('dismissed', 'Dismissed'),
        ('matched', 'Matched'),
    ]
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    viewed_at = models.DateTimeField(null=True, blank=True)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    dismiss_reason = models.CharField(max_length=100, blank=True)
    
    # Metadata
    generation_method = models.CharField(
        max_length=50,
        default='algorithm_v1',
        help_text="Which algorithm version generated this"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        help_text="When this suggestion expires"
    )
    
    class Meta:
        ordering = ['-compatibility_score', '-created_at']
        indexes = [
            models.Index(fields=['user', 'status', '-compatibility_score']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['expires_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'suggested_profile'],
                condition=models.Q(status='pending'),
                name='unique_pending_suggestion'
            )
        ]
    
    def __str__(self):
        return f"Suggestion for {self.user.username}: {self.suggested_profile.user.username} ({self.compatibility_score}%)"
    
    def mark_viewed(self):
        """Mark suggestion as viewed"""
        from django.utils import timezone
        if self.status == 'pending':
            self.status = 'viewed'
            self.viewed_at = timezone.now()
            self.save(update_fields=['status', 'viewed_at'])
    
    def dismiss(self, reason=''):
        """Dismiss this suggestion"""
        from django.utils import timezone
        self.status = 'dismissed'
        self.dismissed_at = timezone.now()
        self.dismiss_reason = reason
        self.save(update_fields=['status', 'dismissed_at', 'dismiss_reason'])