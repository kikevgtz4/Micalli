# backend/accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
import secrets
from datetime import datetime, timedelta
from django.utils import timezone
from roommates.models import RoommateProfile
from .models import PropertyOwner

class PropertyOwnerSerializer(serializers.ModelSerializer):
    """Serializer for property owner business information"""
    
    class Meta:
        model = PropertyOwner
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at', 'verified_at', 'verified_by']


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Complete user serializer for profile management"""

    has_complete_profile = serializers.SerializerMethodField()
    age = serializers.ReadOnlyField()
    property_owner_profile = PropertyOwnerSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'user_type',  # Removed username
            'first_name', 'last_name', 'profile_picture',
            'university', 'graduation_year', 'program',
            'email_verified', 'student_id_verified',
            'date_joined', 'last_login', 'has_complete_profile', 'date_of_birth',
            'age', 'property_owner_profile',
        ]
        read_only_fields = [
            'id', 'date_joined', 'last_login', 'email',
            'email_verified', 'student_id_verified'
        ]
    
    def to_representation(self, instance):
        """Convert to frontend camelCase format"""
        ret = super().to_representation(instance)
        
        # Add university details if available
        if instance.university:
            ret['university'] = {
                'id': instance.university.id,
                'name': instance.university.name,
            }
        
        # Only include property_owner_profile if user is a property owner
        if instance.user_type != 'property_owner':
            ret.pop('property_owner_profile', None)
        
        return ret
    
    def get_has_complete_profile(self, obj):
        if obj.user_type == 'student':
            try:
                profile = obj.roommate_profile
                # Check CORE 5 fields based on research
                core_fields = ['sleep_schedule', 'cleanliness', 'noise_tolerance', 'study_habits', 'guest_policy']
                return all(getattr(profile, field) is not None for field in core_fields)
            except RoommateProfile.DoesNotExist:
                return False
        return True  # Property owners don't need roommate profiles

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    first_name = serializers.CharField(required=True, max_length=30)
    last_name = serializers.CharField(required=True, max_length=150)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'user_type', 'first_name', 'last_name']
        
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
        
    def create(self, validated_data):
        try:
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                user_type=validated_data.get('user_type', 'student'),
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
            )
            
            # Generate email verification token
            user.email_verification_token = secrets.token_urlsafe(32)
            user.email_verification_sent_at = timezone.now()
            user.save()
            
            # Send verification email
            self.send_verification_email(user)
            
            return user
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create user: {str(e)}")
    
    def send_verification_email(self, user):
        # Check if FRONTEND_URL is configured
        if not hasattr(settings, 'FRONTEND_URL') or not settings.FRONTEND_URL:
            import logging
            logger = logging.getLogger(__name__)
            logger.error("FRONTEND_URL not configured in settings")
            return
        
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{user.email_verification_token}"
        
        context = {
            'user': user,
            'verification_url': verification_url,
            'site_name': 'UniHousing',
        }
        
        subject = 'Verify your UniHousing email address'
        
        try:
            # Try to use templates if they exist
            message = render_to_string('accounts/email_verification.txt', context)
            html_message = render_to_string('accounts/email_verification.html', context)
        except Exception as e:
            # Fallback to simple message if templates don't exist
            message = f"Hi {user.first_name},\n\nPlease verify your email by clicking: {verification_url}"
            html_message = None
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send verification email to {user.email}: {str(e)}")

class EmailTokenObtainSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email').lower()
        password = attrs.get('password')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials')
        
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid credentials')
        
        if not user.is_active:
            raise serializers.ValidationError('Account is deactivated')
        
        # You might want to check email verification here
        if not user.email_verified:
            raise serializers.ValidationError('Please verify your email first')
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

# Profile Management Serializers
class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile information"""
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'university', 'graduation_year', 
                  'program', 'date_of_birth', 'gender', 'phone']
        read_only_fields = ['email']  # Email changes require verification
    
    def validate_email(self, value):
        """Prevent email changes through this serializer"""
        if self.instance and self.instance.email != value:
            raise serializers.ValidationError(
                "Email changes are not allowed through this endpoint."
            )
        return value
    
    def validate(self, attrs):
        """Validate based on user type"""
        user = self.instance
        
        # Property owner validation - they can't set student fields
        if user.user_type == 'property_owner':
            if attrs.get('university') or attrs.get('graduation_year') or attrs.get('program'):
                raise serializers.ValidationError(
                    "Property owners cannot set student information."
                )
        
        return attrs
    
class PropertyOwnerUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating property owner business information"""
    
    class Meta:
        model = PropertyOwner
        fields = [
            'business_name', 'business_registration', 'tax_id',
            'business_phone', 'business_address', 'established_year'
        ]
        
    def update(self, instance, validated_data):
        """Update property owner profile"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Check if profile is complete enough for verification
        if all([instance.business_name, instance.business_registration, instance.tax_id]):
            # You could trigger a verification request here
            pass
            
        return instance

class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing password while authenticated"""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True, 
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True)
    
    def validate_current_password(self, value):
        """Verify current password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
    
    def validate(self, attrs):
        """Ensure new passwords match"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords do not match.")
        return attrs
    
    def save(self):
        """Update the user's password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        
        # Send confirmation email
        try:
            send_mail(
                subject='Password Changed Successfully',
                message=f'Your UniHousing password has been changed successfully.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass  # Don't fail if confirmation email fails
        
        return user

class ProfilePictureSerializer(serializers.ModelSerializer):
    """Serializer for profile picture uploads"""
    
    class Meta:
        model = User
        fields = ['profile_picture']
    
    def validate_profile_picture(self, value):
        """Validate uploaded image"""
        if value:
            # Check file size (5MB limit)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Profile picture must be smaller than 5MB."
                )
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Profile picture must be a JPEG, PNG, or GIF image."
                )
        
        return value

class EmailChangeRequestSerializer(serializers.Serializer):
    """Serializer for requesting email change"""
    new_email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate_password(self, value):
        """Verify current password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Password is incorrect.")
        return value
    
    def validate_new_email(self, value):
        """Check if email is already taken"""
        user = self.context['request'].user
        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value
    
    def save(self):
        """Send email change verification"""
        user = self.context['request'].user
        new_email = self.validated_data['new_email']
        
        # Generate token for email change
        token = secrets.token_urlsafe(32)
        
        # Store pending email change (you might want to create a separate model for this)
        # For now, we'll use a simple approach with a temporary field
        user.email_verification_token = token
        user.email_verification_sent_at = timezone.now()
        user.save()
        
        # Send verification email to NEW email address
        verification_url = f"{settings.FRONTEND_URL}/verify-email-change/{token}"
        
        context = {
            'user': user,
            'new_email': new_email,
            'verification_url': verification_url,
        }
        
        send_mail(
            subject='Verify your new email address',
            message=f'Please verify your new email address: {verification_url}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[new_email],
            fail_silently=False,
        )
        
        return user

class AccountSettingsSerializer(serializers.ModelSerializer):
    """Serializer for account-wide settings"""
    
    class Meta:
        model = User
        fields = ['email_verified', 'student_id_verified']
        read_only_fields = ['email_verified', 'student_id_verified']

# Password Reset Serializers
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Check if user with this email exists"""
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            pass
        return value
    
    def save(self):
        email = self.validated_data['email']
        try:
            user = User.objects.get(email=email)
            
            # Generate password reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Create reset URL
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            
            # Send email
            context = {
                'user': user,
                'reset_url': reset_url,
                'site_name': 'UniHousing',
            }
            
            subject = 'Reset your UniHousing password'
            message = render_to_string('accounts/password_reset_email.txt', context)
            html_message = render_to_string('accounts/password_reset_email.html', context)
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            
        except User.DoesNotExist:
            # Still return success to prevent email enumeration
            pass
        except Exception as e:
            # Log the error but don't expose it to user
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Password reset email failed: {str(e)}")

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True, 
        validators=[validate_password]
    )
    
    def validate(self, attrs):
        try:
            # Decode user ID
            uid = urlsafe_base64_decode(attrs['uid']).decode()
            user = User.objects.get(pk=uid)
            
            # Validate token
            if not default_token_generator.check_token(user, attrs['token']):
                raise serializers.ValidationError("Invalid or expired reset token.")
            
            attrs['user'] = user
            return attrs
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid reset token.")
    
    def save(self):
        user = self.validated_data['user']
        new_password = self.validated_data['new_password']
        
        user.set_password(new_password)
        user.save()
        
        # Optional: Send confirmation email
        try:
            send_mail(
                subject='Password Changed Successfully',
                message=f'Your UniHousing password has been changed successfully.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass  # Don't fail if confirmation email fails
        
        return user

class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None  # Initialize user attribute
    
    def validate_token(self, value):
        from django.utils import timezone
        from datetime import timedelta
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Attempting to verify token: {value}")
        
        try:
            # Try to find the user with this token
            user = User.objects.get(email_verification_token=value)
            logger.info(f"Found user: {user.email}")
            
            # Store user instance for save method
            self.user = user
            
            # Check if already verified
            if user.email_verified:
                logger.info(f"Email already verified for user: {user.email}")
                # Instead of error, we'll return success since the goal is achieved
                return value
            
            # Check if token has expired (24 hours)
            if user.email_verification_sent_at:
                if timezone.now() > user.email_verification_sent_at + timedelta(hours=24):
                    logger.warning(f"Token expired for user: {user.email}")
                    raise serializers.ValidationError("Verification token has expired.")
                
            return value
        except User.DoesNotExist:
            logger.error(f"No user found with token: {value}")
            # Check if this might be an already-used token
            # Try to provide a more helpful error message
            raise serializers.ValidationError("Invalid or already used verification token.")
    
    def save(self):
        from django.db import transaction
        
        # If no user was found (shouldn't happen after validation), raise error
        if not self.user:
            raise serializers.ValidationError("Invalid verification token.")
        
        # If already verified, just return the user
        if self.user.email_verified:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Email already verified for {self.user.email}, returning success")
            return self.user
        
        # Use atomic transaction to prevent race conditions
        with transaction.atomic():
            try:
                # Re-fetch with lock to ensure we have the latest state
                user = User.objects.select_for_update().get(pk=self.user.pk)
                
                # Double-check if already verified (by another request)
                if user.email_verified:
                    return user
                
                # Verify the email
                user.email_verified = True
                user.email_verification_token = None
                user.email_verification_sent_at = None
                user.save()
                
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"Successfully verified email for {user.email}")
                
                return user
            except User.DoesNotExist:
                raise serializers.ValidationError("User not found.")

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            if user.email_verified:
                raise serializers.ValidationError("Email is already verified.")
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email.")
        return value
    
    def save(self):
        email = self.validated_data['email']
        user = User.objects.get(email=email)
        
        # Generate new token
        user.email_verification_token = secrets.token_urlsafe(32)
        user.email_verification_sent_at = timezone.now()
        user.save()
        
        # Send verification email
        self.send_verification_email(user)
        return user
    
    def send_verification_email(self, user):
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{user.email_verification_token}"
        
        context = {
            'user': user,
            'verification_url': verification_url,
            'site_name': 'UniHousing',
        }
        
        subject = 'Verify your UniHousing email address'
        message = render_to_string('accounts/email_verification.txt', context)
        html_message = render_to_string('accounts/email_verification.html', context)
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )