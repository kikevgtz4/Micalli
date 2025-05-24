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

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'user_type']
        read_only_fields = ['id']

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
            try:
                user = User.objects.get(email_verification_token=value)
                
                # Check if token is expired (24 hours)
                if user.email_verification_sent_at:
                    expiry_time = user.email_verification_sent_at + timedelta(hours=24)
                    if timezone.now() > expiry_time:
                        raise serializers.ValidationError("Verification link has expired.")
                
                return value
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid verification token.")
        
        def save(self):
            token = self.validated_data['token']
            user = User.objects.get(email_verification_token=token)
            user.email_verified = True
            user.email_verification_token = None
            user.email_verification_sent_at = None
            user.save()
            return user

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