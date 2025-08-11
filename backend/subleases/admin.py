# backend/subleases/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone  # ✅ Fixed import
from .models import (
    Sublease, SubleaseImage, SubleaseApplication, 
    SubleaseVerification, SubleaseUniversityProximity
)


class SubleaseImageInline(admin.TabularInline):
    model = SubleaseImage
    extra = 1
    fields = ['image', 'is_main', 'caption', 'order']

class SubleaseUniversityProximityInline(admin.TabularInline):
    model = SubleaseUniversityProximity
    extra = 1
    fields = ['university', 'distance_in_meters', 'walking_time_minutes']

@admin.register(Sublease)
class SubleaseAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'user', 'sublease_type', 'status', 
        'urgency_level', 'start_date', 'end_date', 
        'sublease_rent', 'is_verified'
    ]
    list_filter = [
        'status', 'urgency_level', 'sublease_type', 
        'listing_type', 'is_verified', 'furnished',
        'landlord_consent_status'
    ]
    search_fields = [
        'title', 'description', 'user__email', 
        'display_neighborhood', 'display_area'
    ]
    readonly_fields = [
        'created_at', 'updated_at', 'published_at', 
        'approx_latitude', 'approx_longitude',
        'views_count', 'saved_count', 'inquiry_count'
    ]
    inlines = [SubleaseImageInline, SubleaseUniversityProximityInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'user', 'title', 'description', 
                'listing_type', 'sublease_type', 'property_type'
            )
        }),
        ('Location', {
            'fields': (
                'address', 'display_neighborhood', 'display_area',
                'city', 'state', 'latitude', 'longitude',
                'approx_latitude', 'approx_longitude', 'privacy_radius'
            )
        }),
        ('Dates & Availability', {
            'fields': (
                'start_date', 'end_date', 'is_flexible',
                'flexibility_range_days', 'available_immediately'
            )
        }),
        ('Financial', {
            'fields': (
                'original_rent', 'sublease_rent', 'deposit_required',
                'deposit_amount', 'utilities_included', 'additional_fees'
            )
        }),
        ('Property Details', {
            'fields': (
                'bedrooms', 'bathrooms', 'total_area', 'furnished',
                'amenities', 'pet_friendly', 'smoking_allowed'
            )
        }),
        ('Roommate Information', {
            'fields': (
                'total_roommates', 'current_roommates', 'roommate_genders',
                'roommate_description', 'shared_spaces'
            ),
            'classes': ('collapse',)
        }),
        ('Legal & Verification', {
            'fields': (
                'landlord_consent_status', 'landlord_consent_document',
                'lease_transfer_allowed', 'sublease_agreement_required',
                'disclaimers_accepted', 'disclaimers_accepted_at',
                'is_verified', 'verified_at', 'verified_by'
            )
        }),
        ('Status & Metrics', {
            'fields': (
                'status', 'urgency_level', 'views_count',
                'saved_count', 'inquiry_count', 'created_at',
                'updated_at', 'published_at', 'expires_at'
            )
        })
    )
    
    def save_model(self, request, obj, form, change):
        if obj.is_verified and not obj.verified_by:
            obj.verified_by = request.user
            obj.verified_at = timezone.now()  # This will now work correctly
        super().save_model(request, obj, form, change)

@admin.register(SubleaseApplication)
class SubleaseApplicationAdmin(admin.ModelAdmin):
    list_display = [
        'sublease', 'applicant', 'status', 
        'move_in_date', 'created_at'
    ]
    list_filter = ['status', 'created_at', 'references_available', 'has_pets']
    search_fields = ['sublease__title', 'applicant__email', 'message']
    readonly_fields = ['created_at', 'updated_at', 'reviewed_at']

@admin.register(SubleaseImage)
class SubleaseImageAdmin(admin.ModelAdmin):
    list_display = ['sublease', 'is_main', 'order', 'uploaded_at']
    list_filter = ['is_main', 'uploaded_at']
    search_fields = ['sublease__title', 'caption']

@admin.register(SubleaseVerification)
class SubleaseVerificationAdmin(admin.ModelAdmin):
    list_display = ['sublease', 'document_type', 'verified', 'uploaded_at']
    list_filter = ['document_type', 'verified']
    search_fields = ['sublease__title']

@admin.register(SubleaseUniversityProximity)
class SubleaseUniversityProximityAdmin(admin.ModelAdmin):
    list_display = ['sublease', 'university', 'distance_in_meters', 'walking_time_minutes']
    list_filter = ['university']
    search_fields = ['sublease__title', 'university__name']
