# backend/roommates/admin.py
from django.contrib import admin
from .models import RoommateProfile, RoommateRequest, RoommateMatch

@admin.register(RoommateProfile)
class RoommateProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'sleep_schedule', 'cleanliness', 'get_university', 'completion_percentage', 'created_at')
    list_filter = (
        'sleep_schedule', 
        'cleanliness', 
        'noise_tolerance', 
        'guest_policy',
        'user__university',
        # Add new filters
        'user__gender',
        'housing_type',
        'lease_duration',
        'pet_friendly',
        'smoking_allowed',
    )
    search_fields = ('user__username', 'user__email', 'user__program', 'bio')
    
    # Keep all your existing methods
    def get_university(self, obj):
        return obj.user.university.name if obj.user.university else 'No University'
    get_university.short_description = 'University'
    get_university.admin_order_field = 'user__university__name'
    
    def display_dietary_restrictions(self, obj):
        if obj.dietary_restrictions:
            return ', '.join(obj.dietary_restrictions)
        return 'No dietary restrictions'
    display_dietary_restrictions.short_description = 'Dietary Restrictions'
    
    def display_hobbies(self, obj):
        if obj.hobbies:
            return ', '.join(obj.hobbies)
        return 'No hobbies listed'
    display_hobbies.short_description = 'Hobbies'
    
    def display_languages(self, obj):
        if obj.languages:
            return ', '.join(obj.languages)
        return 'No languages specified'
    display_languages.short_description = 'Languages'

    def display_age_preference(self, obj):
        if obj.age_range_min and obj.age_range_max:
            return f"{obj.age_range_min} - {obj.age_range_max} years"
        elif obj.age_range_min:
            return f"{obj.age_range_min}+ years"
        else:
            return "No age preference"
    display_age_preference.short_description = 'Age Preference'
    
    def display_budget_range(self, obj):
        return f"${obj.budget_min:,} - ${obj.budget_max:,} MXN"
    display_budget_range.short_description = 'Budget Range'
    
    def get_major(self, obj):
        return obj.user.program or 'Not specified'
    get_major.short_description = 'Major/Program'
    get_major.admin_order_field = 'user__program'
    
    def get_graduation_year(self, obj):
        return obj.user.graduation_year or 'Not specified'
    get_graduation_year.short_description = 'Graduation Year'
    get_graduation_year.admin_order_field = 'user__graduation_year'
    
    # Updated fieldsets with new fields
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'bio', 'nickname'),
            'description': 'Academic info (University, Major, Graduation Year) is managed in the User profile'
        }),
        ('Personal Information', {
            'fields': ('age', 'user__gender', 'year'),
            'description': 'Basic personal details'
        }),
        ('Core Compatibility (Required)', {
            'fields': ('sleep_schedule', 'cleanliness', 'noise_tolerance', 'guest_policy', 'study_habits'),
            'description': 'These 5 fields are essential for matching'
        }),
        ('Housing Preferences', {
            'fields': (
                'display_budget_range', 
                'budget_min', 
                'budget_max', 
                'move_in_date', 
                'lease_duration',
                'housing_type'
            ),
            'description': 'Housing preferences'
        }),
        ('Lifestyle', {
            'fields': (
                'display_hobbies',
                'hobbies', 
                'display_social_activities',
                'social_activities', 
                'pet_friendly', 
                'smoking_allowed', 
                'display_dietary_restrictions',
                'dietary_restrictions'
            )
        }),
        ('Deal Breakers', {
            'fields': (
                'deal_breakers',
                'personality',
                'shared_interests',
            ),
            'description': 'Non-negotiable requirements and additional preferences'
        }),
        ('Matching Preferences', {
            'fields': (
                'preferred_roommate_gender', 
                'display_age_preference',
                'age_range_min', 
                'age_range_max', 
                'preferred_roommate_count', 
                'display_languages',
                'languages'
            )
        }),
        ('Privacy Settings', {
            'fields': (
                'profile_visible_to',
                'contact_visible_to',
                'images_visible_to',
            )
        }),
        ('Profile Status', {
            'fields': ('onboarding_completed', 'completion_percentage'),
            'description': 'Profile completion tracking'
        }),
        ('Metadata', {
            'fields': ('last_match_calculation', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    # Add new display method for social activities
    def display_social_activities(self, obj):
        if obj.social_activities:
            return ', '.join(obj.social_activities)
        return 'No social activities listed'
    display_social_activities.short_description = 'Social Activities'
    
    # Updated readonly fields
    readonly_fields = (
        'display_dietary_restrictions', 
        'display_hobbies', 
        'display_languages',
        'display_social_activities',
        'display_budget_range',
        'display_age_preference',
        'get_university',
        'get_major',
        'get_graduation_year',
        'completion_percentage',
        'created_at',
        'updated_at',
        'age',
        'onboarding_completed',  # Add this
    )

# Keep your existing admin classes
@admin.register(RoommateRequest)
class RoommateRequestAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'university', 'status', 'move_in_date', 'created_at')
    list_filter = ('status', 'university')
    search_fields = ('title', 'description', 'user__username', 'preferred_areas')

@admin.register(RoommateMatch)
class RoommateMatchAdmin(admin.ModelAdmin):
    list_display = ('user_from', 'user_to', 'compatibility_score', 'status', 'created_at')
    list_filter = ('status', 'compatibility_score')
    search_fields = ('user_from__username', 'user_to__username', 'message')
