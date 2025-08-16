from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from .models import (
    Sublease, SubleaseImage, SubleaseApplication, 
    SubleaseVerification, SubleaseUniversityProximity, SubleaseSave
)
from decimal import Decimal
from accounts.serializers import UserSerializer
from universities.models import University 
from universities.serializers import UniversitySerializer


class SubleaseImageSerializer(serializers.ModelSerializer):
    """Serializer for sublease images"""
    # ADD these methods like PropertyImage has:
    thumbnail_url = serializers.SerializerMethodField()
    card_display_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SubleaseImage
        fields = [
            'id', 'image', 'thumbnail_url', 'card_display_url',
            'is_main', 'caption', 'order', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at']  # Remove 'thumbnail' - it's not a DB field!
    
    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            return obj.thumbnail.url
        return None
    
    def get_card_display_url(self, obj):
        if obj.card_display:
            return obj.card_display.url
        return None


class SubleaseUniversityProximitySerializer(serializers.ModelSerializer):
    """Serializer for university proximity information"""
    university = UniversitySerializer(read_only=True)
    university_id = serializers.PrimaryKeyRelatedField(
        queryset=University.objects.all(),
        source='university',
        write_only=True
    )
    
    class Meta:
        model = SubleaseUniversityProximity
        fields = [
            'id', 'university', 'university_id',
            'distance_in_meters', 'walking_time_minutes',
            'public_transport_time_minutes'
        ]


class SubleaseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing subleases"""
    user = serializers.SerializerMethodField()
    main_image = serializers.SerializerMethodField()
    discount_percentage = serializers.ReadOnlyField()
    duration_months = serializers.ReadOnlyField()
    is_urgent = serializers.ReadOnlyField()
    is_saved = serializers.SerializerMethodField()
    
    class Meta:
        model = Sublease
        fields = [
            'id', 'title', 'sublease_type', 'listing_type',
            'display_neighborhood', 'display_area', 'city',
            'approx_latitude', 'approx_longitude', 
            'sublease_rent', 'original_rent', 'discount_percentage',
            'start_date', 'end_date', 'duration_months',
            'bedrooms', 'bathrooms', 'furnished',
            'urgency_level', 'is_urgent', 'status',
            'user', 'main_image', 'is_saved',
            'created_at', 'views_count'
        ]
    
    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'first_name': obj.user.first_name,
            'profile_picture': obj.user.profile_picture.url if obj.user.profile_picture else None,
            'university': {
                'id': obj.user.university.id,
                'name': obj.user.university.name
            } if obj.user.university else None
        }
    
    def get_main_image(self, obj):
        main_image = obj.images.filter(is_main=True).first()
        if not main_image:
            main_image = obj.images.first()
        if main_image:
            return SubleaseImageSerializer(main_image).data
        return None
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saves.filter(user=request.user).exists()
        return False


class SubleaseDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single sublease view"""
    user = UserSerializer(read_only=True)
    images = SubleaseImageSerializer(many=True, read_only=True)
    university_proximities = SubleaseUniversityProximitySerializer(many=True, read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    duration_months = serializers.ReadOnlyField()
    is_urgent = serializers.ReadOnlyField()
    is_saved = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    application_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Sublease
        fields = '__all__'
        read_only_fields = [
            'id', 'user', 'approx_latitude', 'approx_longitude',
            'views_count', 'saved_count', 'inquiry_count',
            'is_verified', 'verified_at', 'verified_by',
            'created_at', 'updated_at', 'published_at', 'expires_at',
            'disclaimers_accepted_at'
        ]
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saves.filter(user=request.user).exists()
        return False
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user == request.user
        return False
    
    def get_application_count(self, obj):
        return obj.applications.count()
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        # Only show exact coordinates to the owner
        if not (request and request.user == instance.user):
            data.pop('latitude', None)
            data.pop('longitude', None)
        
        return data

class SubleaseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a sublease"""
    
    class Meta:
        model = Sublease
        exclude = [
            'user', 'approx_latitude', 'approx_longitude',
            'views_count', 'saved_count', 'inquiry_count',
            'is_verified', 'verified_at', 'verified_by',
            'published_at', 'expires_at', 'disclaimers_accepted_at'
        ]
    
    def validate(self, attrs):
        # Validate dates
        if attrs.get('end_date') and attrs.get('start_date'):
            if attrs['end_date'] <= attrs['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date'
                })
        
        # Validate rent - FIX: Use Decimal for financial calculations
        if attrs.get('sublease_rent') and attrs.get('original_rent'):
            # Convert to Decimal for precise financial calculations
            sublease_rent = Decimal(str(attrs['sublease_rent']))
            original_rent = Decimal(str(attrs['original_rent']))
            max_allowed = original_rent * Decimal('1.5')
            
            if sublease_rent > max_allowed:
                raise serializers.ValidationError({
                    'sublease_rent': 'Sublease rent seems unusually high compared to original rent'
                })
        
        # Require deposit amount if deposit is required
        if attrs.get('deposit_required') and not attrs.get('deposit_amount'):
            raise serializers.ValidationError({
                'deposit_amount': 'Deposit amount is required when deposit is required'
            })
        
        # Validate sublease type specific fields
        sublease_type = attrs.get('sublease_type')
        if sublease_type in ['entire_place', 'private_room']:
            if not attrs.get('bedrooms'):
                raise serializers.ValidationError({
                    'bedrooms': 'Number of bedrooms is required for entire place or private room'
                })
        
        if sublease_type == 'shared_room':
            if not attrs.get('total_roommates'):
                raise serializers.ValidationError({
                    'total_roommates': 'Total roommates is required for shared room'
                })
        
        # Validate disclaimer acceptance
        if attrs.get('status') == 'active' and not attrs.get('disclaimers_accepted'):
            raise serializers.ValidationError({
                'disclaimers_accepted': 'You must accept the legal disclaimers before publishing'
            })
        
        return attrs
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SubleaseUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a sublease"""
    
    class Meta:
        model = Sublease
        exclude = [
            'user', 'approx_latitude', 'approx_longitude',
            'views_count', 'saved_count', 'inquiry_count',
            'is_verified', 'verified_at', 'verified_by',
            'created_at', 'published_at', 'disclaimers_accepted_at'
        ]
        read_only_fields = ['user', 'created_at']
    
    def validate(self, attrs):
        instance = self.instance
        
        # Don't allow changing certain fields after publishing
        if instance.status == 'active' and instance.published_at:
            restricted_fields = ['listing_type', 'sublease_type', 'property_type']
            for field in restricted_fields:
                if field in attrs and attrs[field] != getattr(instance, field):
                    raise serializers.ValidationError({
                        field: f'Cannot change {field} after publishing'
                    })
        
        # Validate dates
        if attrs.get('end_date') and attrs.get('start_date'):
            if attrs['end_date'] <= attrs['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date'
                })
        
        # Validate rent - Use Decimal for financial calculations
        if attrs.get('sublease_rent') and attrs.get('original_rent'):
            sublease_rent = Decimal(str(attrs['sublease_rent']))
            original_rent = Decimal(str(attrs['original_rent']))
            max_allowed = original_rent * Decimal('1.5')
            
            if sublease_rent > max_allowed:
                raise serializers.ValidationError({
                    'sublease_rent': 'Sublease rent seems unusually high compared to original rent'
                })
        
        # Require deposit amount if deposit is required
        if attrs.get('deposit_required') and not attrs.get('deposit_amount'):
            raise serializers.ValidationError({
                'deposit_amount': 'Deposit amount is required when deposit is required'
            })
        
        # Validate sublease type specific fields
        sublease_type = attrs.get('sublease_type')
        if sublease_type in ['entire_place', 'private_room']:
            if not attrs.get('bedrooms'):
                raise serializers.ValidationError({
                    'bedrooms': 'Number of bedrooms is required for entire place or private room'
                })
        
        if sublease_type == 'shared_room':
            if not attrs.get('total_roommates'):
                raise serializers.ValidationError({
                    'total_roommates': 'Total roommates is required for shared room'
                })
        
        return attrs


class SubleaseApplicationSerializer(serializers.ModelSerializer):
    """Serializer for sublease applications"""
    applicant = UserSerializer(read_only=True)
    sublease_title = serializers.CharField(source='sublease.title', read_only=True)
    
    class Meta:
        model = SubleaseApplication
        fields = [
            'id', 'sublease', 'sublease_title', 'applicant',
            'move_in_date', 'message', 'phone', 'email',
            'occupation', 'references_available', 
            'has_pets', 'pet_details', 'status',
            'created_at', 'updated_at', 'reviewed_at'
        ]
        read_only_fields = [
            'id', 'applicant', 'sublease_title',
            'created_at', 'updated_at', 'reviewed_at'
        ]
    
    def validate_move_in_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Move-in date cannot be in the past")
        return value
    
    def validate(self, attrs):
        sublease = attrs.get('sublease')
        move_in_date = attrs.get('move_in_date')
        
        # Check if move-in date is within sublease period
        if move_in_date:
            if move_in_date < sublease.start_date:
                raise serializers.ValidationError({
                    'move_in_date': f'Move-in date cannot be before sublease start date ({sublease.start_date})'
                })
            if move_in_date > sublease.end_date:
                raise serializers.ValidationError({
                    'move_in_date': f'Move-in date cannot be after sublease end date ({sublease.end_date})'
                })
        
        return attrs
    
    def create(self, validated_data):
        validated_data['applicant'] = self.context['request'].user
        
        # Check if user has already applied
        if SubleaseApplication.objects.filter(
            sublease=validated_data['sublease'],
            applicant=validated_data['applicant']
        ).exists():
            raise serializers.ValidationError("You have already applied to this sublease")
        
        # Increment inquiry count on the sublease
        sublease = validated_data['sublease']
        sublease.inquiry_count += 1
        sublease.save(update_fields=['inquiry_count'])
        
        return super().create(validated_data)


class SubleaseSaveSerializer(serializers.ModelSerializer):
    """Serializer for saving/bookmarking subleases"""
    sublease = SubleaseListSerializer(read_only=True)
    
    class Meta:
        model = SubleaseSave
        fields = ['id', 'sublease', 'saved_at']
        read_only_fields = ['id', 'saved_at']
