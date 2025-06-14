# backend/roommates/serializers.py
from rest_framework import serializers
from .models import RoommateProfile, RoommateRequest, RoommateMatch, ProfileCompletionCalculator
from universities.serializers import UniversitySerializer
from accounts.serializers import UserSerializer

class RoommateProfileSerializer(serializers.ModelSerializer):
    # User-related fields as computed properties
    user = serializers.SerializerMethodField()
    university = serializers.SerializerMethodField()
    university_details = serializers.SerializerMethodField()
    major = serializers.SerializerMethodField()
    graduation_year = serializers.SerializerMethodField()
    
    # Keep existing fields
    profile_completion_percentage = serializers.SerializerMethodField()
    missing_fields = serializers.SerializerMethodField()
    
    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'firstName': obj.user.first_name,
            'lastName': obj.user.last_name,
            'username': obj.user.username,
            'email': obj.user.email,
            'profilePicture': obj.user.profile_picture.url if obj.user.profile_picture else None
        }
    
    def get_university(self, obj):
        return obj.user.university.id if obj.user.university else None
    
    def get_university_details(self, obj):
        if obj.user.university:
            return UniversitySerializer(obj.user.university).data
        return None
    
    def get_major(self, obj):
        return obj.user.program
    
    def get_graduation_year(self, obj):
        return obj.user.graduation_year
    
    def get_profile_completion_percentage(self, obj):
        return obj.calculate_completion()
    
    def get_missing_fields(self, obj):
        _, missing = ProfileCompletionCalculator.calculate_completion(obj)
        return missing
    
    class Meta:
        model = RoommateProfile
        fields = [
            'id', 'user', 'sleep_schedule', 'cleanliness', 'noise_tolerance',
            'guest_policy', 'study_habits', 'hobbies', 'social_activities',
            'pet_friendly', 'smoking_allowed', 'dietary_restrictions',
            'preferred_roommate_gender', 'age_range_min', 'age_range_max',
            'preferred_roommate_count', 'bio', 'languages', 'created_at',
            'updated_at', 'completion_percentage', 'last_match_calculation',
            'university', 'university_details', 'major', 'graduation_year',
            'profile_completion_percentage', 'missing_fields'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'completion_percentage', 
                           'last_match_calculation', 'university', 'university_details', 
                           'major', 'graduation_year']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def to_internal_value(self, data):
        """Override to handle university, major, and graduation_year separately"""
        # Extract fields that belong to User model
        university_id = data.pop('university', None)
        major = data.pop('major', None)
        program = data.pop('program', None)  # Handle both 'major' and 'program'
        graduation_year = data.pop('graduation_year', None)
        
        # Store them for later use in create/update
        self.user_fields = {
            'university_id': university_id,
            'program': program or major,  # Use program if provided, otherwise major
            'graduation_year': graduation_year
        }
        
        return super().to_internal_value(data)


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