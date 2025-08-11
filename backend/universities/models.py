# backend/universities/models.py
from imagekit.models import ProcessedImageField, ImageSpecField
from imagekit.processors import ResizeToFit, Transpose
from django.db import models
from django.utils.translation import gettext_lazy as _
import math

class University(models.Model):
    """University model"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    website = models.URLField()
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100, default="Monterrey")
    state = models.CharField(max_length=100, default="Nuevo León")
    country = models.CharField(max_length=100, default="Mexico")
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    # Additional details
    programs = models.JSONField(blank=True, null=True, help_text="JSON field with program details")
    student_population = models.PositiveIntegerField(blank=True, null=True)
    academic_calendar = models.JSONField(blank=True, null=True, help_text="JSON field with academic calendar")
    
    # Media
    # Update to ProcessedImageField
    logo = ProcessedImageField(
        upload_to='university_logos/',
        processors=[
            Transpose(),
            ResizeToFit(500, 500)
        ],
        format='PNG',  # Keep PNG for transparency
        options={'quality': 95},
        blank=True,
        null=True
    )
    
    # Logo thumbnail
    logo_thumbnail = ImageSpecField(
        source='logo',
        processors=[ResizeToFit(100, 100)],
        format='PNG',
        options={'quality': 90}
    )
    
    banner_image = ProcessedImageField(
        upload_to='university_banners/',
        processors=[
            Transpose(),
            ResizeToFit(1920, 600)
        ],
        format='JPEG',
        options={'quality': 90, 'optimize': True, 'progressive': True},
        blank=True,
        null=True
    )
    
    # Banner thumbnail
    banner_thumbnail = ImageSpecField(
        source='banner_image',
        processors=[ResizeToFit(600, 200)],
        format='JPEG',
        options={'quality': 85}
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def distance_to(self, lat, lng):
        """Calculate distance between university and given coordinates in kilometers"""
        # Haversine formula for calculating distance between two points on Earth
        R = 6371  # Earth radius in kilometers
        
        lat1 = float(self.latitude)
        lon1 = float(self.longitude)
        lat2 = float(lat)
        lon2 = float(lng)
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
            * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return distance
    
    def __str__(self):
        return self.name
        
    class Meta:
        verbose_name = _('University')
        verbose_name_plural = _('Universities')


class UniversityPropertyProximity(models.Model):
    """Model to store the proximity between properties and universities"""
    property = models.ForeignKey('properties.Property', on_delete=models.CASCADE, related_name='university_proximities')
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='property_proximities')
    distance_in_meters = models.PositiveIntegerField(help_text="Distance in meters")
    walking_time_minutes = models.PositiveIntegerField(help_text="Estimated walking time in minutes")
    public_transport_time_minutes = models.PositiveIntegerField(blank=True, null=True, help_text="Estimated public transport time in minutes")
    
    def __str__(self):
        return f"{self.property.title} to {self.university.name}: {self.distance_in_meters}m"
        
    class Meta:
        verbose_name = _('University Property Proximity')
        verbose_name_plural = _('University Property Proximities')
        unique_together = ('property', 'university')


class TransportationOption(models.Model):
    """Public transportation options near universities"""
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='transportation_options')
    name = models.CharField(max_length=100, help_text="E.g., 'Metro Line 1', 'Bus Route 42'")
    transportation_type = models.CharField(
        max_length=20,
        choices=[
            ('metro', _('Metro')),
            ('bus', _('Bus')),
            ('tram', _('Tram')),
            ('other', _('Other')),
        ]
    )
    description = models.TextField(blank=True, null=True)
    frequency_minutes = models.PositiveSmallIntegerField(blank=True, null=True, help_text="Average frequency in minutes")
    route_information = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.name} at {self.university.name}"
