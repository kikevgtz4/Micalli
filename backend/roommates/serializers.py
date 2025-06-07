# backend/roommates/serializers.py
from rest_framework import serializers
from .models import RoommateProfile, RoommateRequest, RoommateMatch
from universities.serializers import UniversitySerializer

class RoommateProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.get_full_name')
    user_email = serializers.ReadOnlyField(source='user.email')
    university_details = UniversitySerializer(source='university', read_only=True)
    profile_completion_percentage = serializers.SerializerMethodField()
    missing_fields = serializers.SerializerMethodField()
    
    def get_profile_completion_percentage(self, obj):
        from .matching import RoommateMatchingEngine
        engine = RoommateMatchingEngine()
        return int(engine._calculate_profile_completion(obj) * 100)
    
    def get_missing_fields(self, obj):
        """Return list of fields that need to be filled for better completion"""
        missing = []
        
        # Check each field type appropriately
        if not obj.sleep_schedule:
            missing.append('sleep_schedule')
        if not obj.cleanliness:
            missing.append('cleanliness')
        if not obj.noise_tolerance:
            missing.append('noise_tolerance')
        if not obj.guest_policy:
            missing.append('guest_policy')
        if not obj.study_habits or not obj.study_habits.strip():
            missing.append('study_habits')
        if not obj.major or not obj.major.strip():
            missing.append('major')
        if obj.year is None:
            missing.append('year')
        if not obj.bio or not obj.bio.strip():
            missing.append('bio')
        if obj.pet_friendly is None:
            missing.append('pet_friendly')
        if obj.smoking_allowed is None:
            missing.append('smoking_allowed')
        if not obj.hobbies:
            missing.append('hobbies')
        if not obj.social_activities:
            missing.append('social_activities')
        if not obj.languages:
            missing.append('languages')
        if obj.age_range_min is None:
            missing.append('age_range_min')
        if obj.age_range_max is None:
            missing.append('age_range_max')
            
        return missing
    
    class Meta:
        model = RoommateProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Sync university from user if not provided
        if 'university' not in validated_data and self.context['request'].user.university:
            validated_data['university'] = self.context['request'].user.university
        
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Optionally sync university on updates too if needed
        if 'university' not in validated_data and self.context['request'].user.university:
            validated_data['university'] = self.context['request'].user.university
            
        return super().update(instance, validated_data)


class RoommateRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.get_full_name')
    university_name = serializers.ReadOnlyField(source='university.name')
    
    class Meta:
        model = RoommateRequest
        fields = '__all__'
        read_only_fields = ['user', 'status', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class RoommateMatchSerializer(serializers.ModelSerializer):
    user_from_name = serializers.ReadOnlyField(source='user_from.get_full_name')
    user_to_name = serializers.ReadOnlyField(source='user_to.get_full_name')
    
    class Meta:
        model = RoommateMatch
        fields = '__all__'
        read_only_fields = ['user_from', 'compatibility_score', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user_from'] = self.context['request'].user
        # Here you would add logic to calculate compatibility score
        # based on the two users' roommate profiles
        validated_data['compatibility_score'] = 0  # Placeholder
        return super().create(validated_data)


class RoommateProfilePublicSerializer(serializers.ModelSerializer):
    """Limited data for users with incomplete profiles"""
    user_name = serializers.SerializerMethodField()
    university_name = serializers.ReadOnlyField(source='university.name')
    
    def get_user_name(self, obj):
        # Only show first name and last initial
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name[0]}."
        return obj.user.username
    
    class Meta:
        model = RoommateProfile
        fields = ['id', 'user_name', 'major', 'year', 'university_name', 
                  'sleep_schedule', 'cleanliness']


class RoommateProfileMatchSerializer(RoommateProfileSerializer):
    """Enhanced data for matching results"""
    match_details = serializers.SerializerMethodField()
    
    def get_match_details(self, obj):
        # This will be populated by the view
        return getattr(obj, '_match_details', None)
    
    class Meta:
        model = RoommateProfile
        fields = '__all__'  # Since parent uses __all__, we use it too