from rest_framework import serializers
from .models import University, TransportationOption, UniversityPropertyProximity

class UniversityPropertyProximitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UniversityPropertyProximity
        fields = [
            'id', 
            'university', 
            'property', 
            'distance_in_meters', 
            'walking_time_minutes', 
            'public_transport_time_minutes'
        ]

class TransportationOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportationOption
        fields = '__all__'

class UniversitySerializer(serializers.ModelSerializer):
    transportation_options = TransportationOptionSerializer(many=True, read_only=True)
    logo_url = serializers.SerializerMethodField()  # Add this
    logo_thumbnail_url = serializers.SerializerMethodField()  # Add this
    banner_url = serializers.SerializerMethodField()  # Add this
    
    def get_logo_url(self, obj):
        if obj.logo:
            return obj.logo.url
        return None
    
    def get_logo_thumbnail_url(self, obj):
        if obj.logo and hasattr(obj, 'logo_thumbnail'):
            return obj.logo_thumbnail.url
        return None
    
    def get_banner_url(self, obj):
        if obj.banner_image:
            return obj.banner_image.url
        return None
    
    class Meta:
        model = University
        fields = '__all__'
