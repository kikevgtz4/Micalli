# backend/accounts/admin.py:

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PropertyOwner

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'user_type', 'is_staff', 'is_active', 'email_verified')
    list_filter = ('is_staff', 'is_active', 'user_type', 'email_verified', 'student_id_verified')
    search_fields = ('email', 'first_name', 'last_name')  # Removed username from search
    ordering = ('email',)  # Order by email instead of username
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'username', 'gender', 'phone')}),  # ✅ Add gender, phone

        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('User Type', {'fields': ('user_type',)}),
        ('Profile', {'fields': ('date_of_birth', 'profile_picture')}),
        ('Student Information', {
            'fields': ('university', 'student_id_verified', 'graduation_year', 'program'),
            'description': 'Only applicable for student users'
        }),
        ('Verification', {'fields': ('email_verified', 'email_verification_token', 'email_verification_sent_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'user_type'),
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset to include related data"""
        qs = super().get_queryset(request)
        return qs.select_related('university')

@admin.register(PropertyOwner)
class PropertyOwnerAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_name', 'verification_status', 'property_count', 'created_at')
    list_filter = ('verification_status', 'created_at')
    search_fields = ('user__email', 'business_name', 'tax_id')  # Changed from user__username
    readonly_fields = ('created_at', 'updated_at', 'verified_at', 'property_count')
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Business Information', {
            'fields': ('business_name', 'business_registration', 'tax_id', 'established_year')
        }),
        ('Contact', {
            'fields': ('business_phone', 'business_address')
        }),
        ('Verification', {
            'fields': ('verification_status', 'verified_at', 'verified_by')
        }),
        ('Statistics', {
            'fields': ('property_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Include user data in queryset"""
        qs = super().get_queryset(request)
        return qs.select_related('user', 'verified_by')
