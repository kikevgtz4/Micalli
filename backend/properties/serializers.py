from rest_framework import serializers
from .models import Property, PropertyImage, PropertyReview, Room
from universities.serializers import UniversityPropertyProximitySerializer

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'property', 'image', 'is_main', 'caption', 'order']
        read_only_fields = ['id']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class PropertyReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.ReadOnlyField(source='reviewer.username')
    
    class Meta:
        model = PropertyReview
        fields = [
            'id', 'reviewer', 'reviewer_name', 'rating', 'cleanliness', 
            'value', 'location', 'accuracy', 'communication', 'review_text', 
            'pros', 'cons', 'stay_period', 'created_at'
        ]
        read_only_fields = ['reviewer']
    
    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data)
    
class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    rooms = RoomSerializer(many=True, read_only=True)
    reviews = PropertyReviewSerializer(many=True, read_only=True)
    university_proximities = UniversityPropertyProximitySerializer(many=True, read_only=True)
    owner_name = serializers.ReadOnlyField(source='owner.get_full_name')
    
    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at', 'is_verified']
    
    def validate(self, attrs):
        """Additional validation for property data."""
        # Log incoming data
        print(f"Validating property data: {attrs}")
        
        # Validate numeric fields
        if 'rent_amount' in attrs and attrs['rent_amount'] <= 0:
            raise serializers.ValidationError({"rent_amount": "Rent amount must be greater than zero"})
            
        if 'deposit_amount' in attrs and attrs['deposit_amount'] <= 0:
            raise serializers.ValidationError({"deposit_amount": "Deposit amount must be greater than zero"})
            
        if 'total_area' in attrs and attrs['total_area'] <= 0:
            raise serializers.ValidationError({"total_area": "Area must be greater than zero"})
        
        # ADD COORDINATE VALIDATION HERE
        # Validate coordinates if provided
        if 'latitude' in attrs and 'longitude' in attrs:
            lat = attrs.get('latitude')
            lng = attrs.get('longitude')
            
            # Validate coordinate ranges
            if lat and (lat < -90 or lat > 90):
                raise serializers.ValidationError({
                    'latitude': 'Latitude must be between -90 and 90'
                })
            
            if lng and (lng < -180 or lng > 180):
                raise serializers.ValidationError({
                    'longitude': 'Longitude must be between -180 and 180'
                })
            
            # Validate Monterrey area (optional)
            if lat and lng:
                # Rough bounds for Monterrey metropolitan area
                if not (25.5 <= lat <= 25.9 and -100.5 <= lng <= -100.1):
                    raise serializers.ValidationError({
                        'address': 'Location appears to be outside Monterrey area. Please verify.'
                    })
        
        # Validate date fields
        if 'available_from' in attrs:
            from django.utils import timezone
            import datetime
            
            # If available_from is a string, try to parse it
            if isinstance(attrs['available_from'], str):
                try:
                    # Try to parse the date
                    attrs['available_from'] = datetime.datetime.strptime(
                        attrs['available_from'], '%Y-%m-%d'
                    ).date()
                except ValueError:
                    raise serializers.ValidationError(
                        {"available_from": "Invalid date format. Use YYYY-MM-DD."}
                    )
            
        # Validate ArrayFields
        for field_name in ['amenities', 'included_utilities', 'rules']:
            if field_name in attrs and attrs[field_name] is not None:
                # Ensure it's a list
                if not isinstance(attrs[field_name], list):
                    try:
                        # Try to convert from JSON string
                        import json
                        attrs[field_name] = json.loads(attrs[field_name])
                        if not isinstance(attrs[field_name], list):
                            raise serializers.ValidationError({field_name: "Must be a list"})
                    except (json.JSONDecodeError, TypeError):
                        raise serializers.ValidationError({field_name: "Invalid JSON format"})
        
        return attrs
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)