# backend/accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
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


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Complete user serializer for profile management"""

    has_complete_profile = serializers.SerializerMethodField()
    age = serializers.ReadOnlyField()  # Add computed age field
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'user_type', 
            'first_name', 'last_name', 'phone', 'profile_picture',
            'university', 'graduation_year', 'program',
            'business_name', 'business_registration',
            'email_verified', 'student_id_verified', 'verification_status',
            'date_joined', 'last_login', 'has_complete_profile', 'date_of_birth',
            'age',  # Computed field
        ]
        read_only_fields = [
            'id', 'date_joined', 'last_login', 
            'email_verified', 'student_id_verified', 'verification_status'
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
        
        return ret
    
    def get_has_complete_profile(self, obj):
        if obj.user_type == 'student':
            try:
                profile = obj.roommate_profile
                # Check required fields
                required_fields = ['sleep_schedule', 'cleanliness', 'noise_tolerance', 'guest_policy']
                return all(getattr(profile, field) is not None for field in required_fields)
            except RoommateProfile.DoesNotExist:  # More explicit than bare except
                return False
        return True  # Property owners don't need roommate profiles

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'user_type']
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            user_type=validated_data.get('user_type', 'student'),
        )
        user.set_password(validated_data['password'])
        
        # Generate email verification token
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

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Check if username is an email
        username = attrs.get('username')
        if username and '@' in username:  # Simple check if it looks like an email
            try:
                user = User.objects.get(email=username)
                # Replace with actual username for authentication
                attrs['username'] = user.username
            except User.DoesNotExist:
                pass  # Will fail during standard validation
        
        return super().validate(attrs)

# Profile Management Serializers
class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile information"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone', 
            'university', 'graduation_year', 'program',
            'business_name', 'business_registration'
        ]
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
        
        # Student-specific validation
        if user.user_type == 'student':
            if attrs.get('business_name') or attrs.get('business_registration'):
                raise serializers.ValidationError(
                    "Students cannot set business information."
                )
        
        # Property owner validation
        elif user.user_type == 'property_owner':
            if attrs.get('university') or attrs.get('graduation_year') or attrs.get('program'):
                raise serializers.ValidationError(
                    "Property owners cannot set student information."
                )
        
        return attrs

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
        fields = ['email_verified', 'student_id_verified', 'verification_status']
        read_only_fields = ['email_verified', 'student_id_verified', 'verification_status']

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
    
    def validate_token(self, value):
        # Add timezone awareness
        from django.utils import timezone
        from datetime import timedelta
        
        try:
            # Try to find the user with this token
            user = User.objects.get(email_verification_token=value)
            
            # Check if token has expired (24 hours)
            if user.email_verification_sent_at:
                if timezone.now() > user.email_verification_sent_at + timedelta(hours=24):
                    raise serializers.ValidationError("Verification token has expired.")
            
            # Check if already verified
            if user.email_verified:
                raise serializers.ValidationError("Email is already verified.")
                
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token.")
    
    def save(self):
        token = self.validated_data['token']
        try:
            user = User.objects.get(email_verification_token=token)
            user.email_verified = True
            user.email_verification_token = None
            user.email_verification_sent_at = None
            user.save()
            return user
        except User.DoesNotExist:
            # This shouldn't happen due to validation, but just in case
            raise serializers.ValidationError("Invalid verification token.")

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