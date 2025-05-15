from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'user_type')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {'fields': (
            'user_type', 
            'phone', 
            'profile_picture',
            'university',
            'student_id_verified',
            'graduation_year',
            'program',
            'business_name',
            'business_registration',
            'verification_status',
        )}),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')