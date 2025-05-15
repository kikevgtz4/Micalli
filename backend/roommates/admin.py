from django.contrib import admin
from .models import RoommateProfile, RoommateRequest, RoommateMatch

@admin.register(RoommateProfile)
class RoommateProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'sleep_schedule', 'cleanliness', 'university', 'created_at')
    list_filter = ('sleep_schedule', 'cleanliness', 'noise_tolerance', 'guest_policy', 'university')
    search_fields = ('user__username', 'user__email', 'major', 'bio')
    fieldsets = (
        ('User', {
            'fields': ('user', 'university', 'bio')
        }),
        ('Academic', {
            'fields': ('major', 'year', 'study_habits')
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