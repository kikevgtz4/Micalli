# backend/roommates/serializers.py
from rest_framework import serializers
from .models import RoommateProfile, RoommateRequest, RoommateMatch, ProfileCompletionCalculator, RoommateProfileImage, ImageReport
from universities.serializers import UniversitySerializer
from accounts.serializers import UserSerializer


class RoommateProfileImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()  # Add this
    
    def get_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None
    
    def get_thumbnail_url(self, obj):  # Add this method
        request = self.context.get('request')
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return None
    
    class Meta:
        model = RoommateProfileImage
        fields = ['id', 'image', 'url', 'thumbnail_url', 'is_primary', 'order', 'uploaded_at']

class RoommateProfileSerializer(serializers.ModelSerializer):
    # User-related fields as computed properties
    user = serializers.SerializerMethodField()
    university = serializers.SerializerMethodField()
    university_details = serializers.SerializerMethodField()
    major = serializers.SerializerMethodField()
    graduation_year = serializers.SerializerMethodField()
    images = RoommateProfileImageSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    image_count = serializers.SerializerMethodField()
    age = serializers.ReadOnlyField()  # Add this - it will use the @property

    # Add this field to accept existing image IDs
    existing_image_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    # Read from User model, write to User model
    first_name = serializers.CharField(
        source='user.first_name', 
        allow_blank=True,
        required=False
    )
    last_name = serializers.CharField(
        source='user.last_name', 
        allow_blank=True,
        required=False
    )
    
    # Include other user fields as read-only
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    # Computed fields
    display_name = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    def update(self, instance, validated_data):
        # Extract existing_image_ids if provided
        existing_image_ids = validated_data.pop('existing_image_ids', None)
        
        # Update other fields
        instance = super().update(instance, validated_data)
        
        # Handle image deletion if existing_image_ids is provided
        if existing_image_ids is not None:
            # Delete images that are not in the existing_image_ids list
            instance.images.exclude(id__in=existing_image_ids).delete()
        
        return instance
    
    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True, is_approved=True).first()
        if primary:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary.image.url)
        # Fallback to user's profile picture
        if obj.user.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.profile_picture.url)
        return None
    
    def get_image_count(self, obj):
        return obj.images.filter(is_approved=True).count()
    
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
            'profilePicture': obj.user.profile_picture.url if obj.user.profile_picture else None,
            'dateOfBirth': obj.user.date_of_birth.isoformat() if obj.user.date_of_birth else None,  
            'gender': obj.user.gender,
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
            # Identity & Core Info
            'id', 'user', 'first_name', 'last_name', 'nickname',
            'display_name', 'full_name', 'email', 'username', 'age',
            
            # Core 5 Compatibility Fields
            'sleep_schedule', 'cleanliness', 'noise_tolerance',
            'guest_policy', 'study_habits',
            
            # Identity & Bio
            'bio', 'gender', 'year',
            
            # Housing Preferences
            'budget_min', 'budget_max', 'move_in_date',
            'lease_duration', 'housing_type',
            
            # Lifestyle
            'hobbies', 'social_activities', 'pet_friendly', 
            'smoking_allowed', 'dietary_restrictions', 'languages',
            
            # Deal Breakers & Preferences
            'deal_breakers', 'personality', 'shared_interests',
            
            # Matching Parameters
            'preferred_roommate_gender', 'age_range_min', 'age_range_max',
            'preferred_roommate_count',
            
            # Academic (from User model)
            'university', 'university_details', 'major', 'graduation_year',
            
            # Media
            'images', 'primary_image', 'image_count', 'existing_image_ids',
            
            # Privacy Settings
            'profile_visible_to', 'contact_visible_to', 'images_visible_to',
            
            # Status & Metadata
            'onboarding_completed', 'profile_completion_percentage', 
            'missing_fields', 'completion_percentage', 'last_match_calculation',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'completion_percentage', 
                           'last_match_calculation', 'university', 'university_details', 
                           'major', 'graduation_year', 'age', 'gender']
    
    def create(self, validated_data):
        # Extract user data from validated_data
        user_data = validated_data.pop('user', {})
        user = self.context['request'].user
        user_updated = False  # Track if user needs saving
        
        # Update user fields if provided
        if user_data:
            first_name = user_data.get('first_name')
            last_name = user_data.get('last_name')
            
            if first_name is not None:
                user.first_name = first_name
                user_updated = True
            if last_name is not None:
                user.last_name = last_name
                user_updated = True
            if self.user_fields.get('gender'):
                user.gender = self.user_fields['gender']
                user_updated = True
        
        # Also handle the fields from to_internal_value if available
        if hasattr(self, 'user_fields'):
            if self.user_fields.get('university_id'):
                user.university_id = self.user_fields['university_id']
                user_updated = True
            if self.user_fields.get('program'):
                user.program = self.user_fields['program']
                user_updated = True
            if self.user_fields.get('graduation_year'):
                user.graduation_year = self.user_fields['graduation_year']
                user_updated = True
            if self.user_fields.get('date_of_birth'):
                user.date_of_birth = self.user_fields['date_of_birth']
                user_updated = True
        
        # Save user only once if updated
        if user_updated:
            user.save()
        
        # Create profile with the user
        validated_data['user'] = user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Extract user data
        user_data = validated_data.pop('user', {})
        
        # Extract existing_image_ids if provided
        existing_image_ids = validated_data.pop('existing_image_ids', None)
        
        user = instance.user
        user_updated = False  # Track if user needs saving
        
        # Update user fields if provided
        if user_data:
            first_name = user_data.get('first_name')
            last_name = user_data.get('last_name')
            
            if first_name is not None:
                user.first_name = first_name
                user_updated = True
            if last_name is not None:
                user.last_name = last_name
                user_updated = True
            if self.user_fields.get('gender') is not None:
                user.gender = self.user_fields['gender']
                user_updated = True
        
        # Also handle the fields from to_internal_value if available
        if hasattr(self, 'user_fields'):
            if self.user_fields.get('university_id'):
                user.university_id = self.user_fields['university_id']
                user_updated = True
            if self.user_fields.get('program'):
                user.program = self.user_fields['program']
                user_updated = True
            if self.user_fields.get('graduation_year'):
                user.graduation_year = self.user_fields['graduation_year']
                user_updated = True
            if self.user_fields.get('date_of_birth'):
                user.date_of_birth = self.user_fields['date_of_birth']
                user_updated = True
        
        # Save user only once if updated
        if user_updated:
            user.save()
        
        # Update profile fields
        instance = super().update(instance, validated_data)
        
        # Handle image deletion if existing_image_ids is provided
        if existing_image_ids is not None:
            # Delete images that are not in the existing_image_ids list
            instance.images.exclude(id__in=existing_image_ids).delete()
        
        return instance
    
    def get_display_name(self, obj):
        return obj.display_name
    
    def get_full_name(self, obj):
        return obj.full_name
    
    def to_internal_value(self, data):
        """Override to handle university, major, and graduation_year separately"""
        # Extract fields that belong to User model
        university_id = data.pop('university', None)
        major = data.pop('major', None)
        program = data.pop('program', None)  # Handle both 'major' and 'program'
        graduation_year = data.pop('graduation_year', None)
        date_of_birth = data.pop('date_of_birth', None)  # Add this
        gender = data.pop('gender', None)  # ADD THIS LINE
        
        # Store them for later use in create/update
        self.user_fields = {
            'university_id': university_id,
            'program': program or major,  # Use program if provided, otherwise major
            'graduation_year': graduation_year, 
            'date_of_birth': date_of_birth, 
            'gender': gender,  # ADD THIS LINE
        }
        
        return super().to_internal_value(data)
    
    def validate(self, data):
        """Add validation for the new fields"""
        # Validate budget range
        if 'budget_min' in data and 'budget_max' in data:
            if data.get('budget_min') and data.get('budget_max'):
                if data['budget_min'] > data['budget_max']:
                    raise serializers.ValidationError({
                        'budget_max': 'Maximum budget must be greater than minimum budget'
                    })
        
        # Validate arrays have reasonable limits
        if 'personality' in data and len(data['personality']) > 10:
            raise serializers.ValidationError({
                'personality': 'Cannot have more than 10 personality traits'
            })
            
        if 'deal_breakers' in data and len(data['deal_breakers']) > 10:
            raise serializers.ValidationError({
                'deal_breakers': 'Cannot have more than 10 deal breakers'
            })
            
        if 'shared_interests' in data and len(data['shared_interests']) > 15:
            raise serializers.ValidationError({
                'shared_interests': 'Cannot have more than 15 shared interests'
            })
        
        return data
    
    def to_representation(self, instance):
        """Ensure arrays are always returned as lists"""
        data = super().to_representation(instance)
        
        # Ensure array fields are lists
        array_fields = ['personality', 'deal_breakers', 'shared_interests', 
                       'preferred_locations', 'hobbies', 'social_activities',
                       'dietary_restrictions', 'languages']
        
        for field in array_fields:
            if field in data and data[field] is None:
                data[field] = []
        
        return data


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
    university_name = serializers.SerializerMethodField()
    
    def get_user_name(self, obj):
        # Only show first name and last initial
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name[0]}."
        return obj.user.username
    
    def get_university_name(self, obj):
        # Access university through user
        return obj.user.university.name if obj.user.university else None
    
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

