from django.contrib import admin
from .models import University, TransportationOption, UniversityPropertyProximity

@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'website', 'student_population')
    search_fields = ('name', 'address', 'city')
    list_filter = ('city', 'state', 'country')

@admin.register(TransportationOption)
class TransportationOptionAdmin(admin.ModelAdmin):
    list_display = ('name', 'university', 'transportation_type', 'frequency_minutes')
    list_filter = ('transportation_type', 'university')
    search_fields = ('name', 'description', 'university__name')

@admin.register(UniversityPropertyProximity)
class UniversityPropertyProximityAdmin(admin.ModelAdmin):
    list_display = ('university', 'property', 'distance_in_meters', 'walking_time_minutes')
    list_filter = ('university',)
    search_fields = ('university__name', 'property__title')