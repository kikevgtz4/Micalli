# backend/properties/serializers.py
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

# SERIALIZER FOR PUBLIC VIEW
class PropertyPublicSerializer(serializers.ModelSerializer):
    """Serializer for public property views - hides exact location"""
    images = PropertyImageSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    university_proximities = UniversityPropertyProximitySerializer(many=True, read_only=True)

    owner = serializers.SerializerMethodField()

    def get_owner(self, obj):
        """Return basic owner information"""
        return {
            'id': obj.owner.id,
            'firstName': obj.owner.first_name or '',
            'lastName': obj.owner.last_name or '',
            'username': obj.owner.username,
            'userType': obj.owner.user_type,
        }
    
    # Use approximate coordinates for public view
    latitude = serializers.DecimalField(
        source='approx_latitude', 
        max_digits=9, 
        decimal_places=6, 
        read_only=True
    )
    longitude = serializers.DecimalField(
        source='approx_longitude', 
        max_digits=9, 
        decimal_places=6, 
        read_only=True
    )
    
    # Show only area/neighborhood
    address = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'property_type',
            'address', 'latitude', 'longitude',  # These are now approximate
            'display_neighborhood', 'display_area',
            'bedrooms', 'bathrooms', 'total_area', 'furnished',
            'amenities', 'rules', 'rent_amount', 'deposit_amount',
            'payment_frequency', 'included_utilities', 'available_from',
            'minimum_stay', 'maximum_stay', 'owner', 'owner_name',
            'is_active', 'is_verified', 'is_featured',
            'created_at', 'updated_at', 'images', 'university_proximities'
        ]
    
    def get_address(self, obj):
        """Return only neighborhood and area for privacy"""
        parts = []
        if obj.display_neighborhood:
            parts.append(obj.display_neighborhood)
        if obj.display_area:
            parts.append(obj.display_area)
        parts.append("Monterrey, N.L.")
        return ", ".join(parts)

# KEEP YOUR EXISTING PropertySerializer AS IS
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

#  SERIALIZER FOR OWNER VIEW
class PropertyOwnerSerializer(PropertySerializer):
    """Full serializer for property owners - shows exact location"""
    # Include both exact and approximate coordinates
    exact_latitude = serializers.DecimalField(
        source='latitude',
        max_digits=9,
        decimal_places=6,
        read_only=True
    )
    exact_longitude = serializers.DecimalField(
        source='longitude',
        max_digits=9,
        decimal_places=6,
        read_only=True
    )
    
    class Meta:
        model = Property
        # Option 1: Use __all__ and Django will include the extra fields automatically
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at', 'is_verified']