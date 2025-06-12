# backend/roommates/admin.py
from django.contrib import admin
from .models import RoommateProfile, RoommateRequest, RoommateMatch

@admin.register(RoommateProfile)
class RoommateProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'sleep_schedule', 'cleanliness', 'get_university', 'created_at')
    list_filter = (
        'sleep_schedule', 
        'cleanliness', 
        'noise_tolerance', 
        'guest_policy',
        # Remove 'university' from here
        'user__university',  # Filter by user's university instead
    )
    search_fields = ('user__username', 'user__email', 'user__program', 'bio')
    
    # Add a method to display university in list_display
    def get_university(self, obj):
        return obj.user.university.name if obj.user.university else 'No University'
    get_university.short_description = 'University'
    get_university.admin_order_field = 'user__university__name'
    
    # Add methods to display array fields better
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
    
    # Add methods to display User model fields
    def get_major(self, obj):
        return obj.user.program or 'Not specified'
    get_major.short_description = 'Major/Program'
    get_major.admin_order_field = 'user__program'
    
    def get_graduation_year(self, obj):
        return obj.user.graduation_year or 'Not specified'
    get_graduation_year.short_description = 'Graduation Year'
    get_graduation_year.admin_order_field = 'user__graduation_year'
    
    # Update fieldsets to remove direct references to removed fields
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'bio'),
            'description': 'Academic info (University, Major, Graduation Year) is managed in the User profile'
        }),
        ('Academic', {
            'fields': ('study_habits',),
            'description': 'Study-related preferences'
        }),
        ('Preferences', {
            'fields': ('sleep_schedule', 'cleanliness', 'noise_tolerance', 'guest_policy')
        }),
        ('Lifestyle', {
            'fields': ('hobbies', 'social_activities', 'pet_friendly', 'smoking_allowed', 'dietary_restrictions')
        }),
        ('Matching', {
            'fields': ('preferred_roommate_gender', 'age_range_min', 'age_range_max', 'preferred_roommate_count', 'languages')
        }),
        ('Metadata', {
            'fields': ('completion_percentage', 'last_match_calculation', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    # Override the display in the admin form
    readonly_fields = (
        'display_dietary_restrictions', 
        'display_hobbies', 
        'display_languages',
        'get_university',
        'get_major',
        'get_graduation_year',
        'completion_percentage',
        'created_at',
        'updated_at',
    )

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