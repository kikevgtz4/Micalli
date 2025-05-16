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
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)