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
    
    class Meta:
        model = University
        fields = '__all__'