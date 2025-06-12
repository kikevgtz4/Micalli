# backend/accounts/views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import (
    UserRegistrationSerializer, 
    UserSerializer, 
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer, 
    PasswordResetConfirmSerializer,
    EmailVerificationSerializer,
    ResendVerificationSerializer,
    ProfileUpdateSerializer,
    PasswordChangeSerializer,
    ProfilePictureSerializer,
    EmailChangeRequestSerializer,
    AccountSettingsSerializer,
)
from .models import User
from django.conf import settings

class TestView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({'message': 'UniHousing API is working!'})

class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that allows login with either username or email"""
    serializer_class = CustomTokenObtainPairSerializer

# Profile Management Views
class ProfileUpdateView(APIView):
    """Update user profile information"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current profile information"""
        serializer = ProfileUpdateSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        """Update profile information"""
        serializer = ProfileUpdateSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            # Handle academic fields that might come from roommate form
            if 'program' in request.data or 'university' in request.data or 'graduation_year' in request.data:
                # These updates will trigger signals to sync with roommate profile
                pass
            
            serializer.save()
            
            # Return updated user data
            user_serializer = UserSerializer(request.user)
            return Response({
                'message': 'Profile updated successfully',
                'user': user_serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordChangeView(APIView):
    """Change user password"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        print(f"Password change request from user: {request.user}")
        print(f"Request data: {request.data}")
        print(f"Request headers: {dict(request.headers)}")
        
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            print("Serializer is valid, saving...")
            serializer.save()
            return Response({
                'message': 'Password changed successfully'
            })
        else:
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfilePictureView(APIView):
    """Handle profile picture uploads"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Upload new profile picture"""
        serializer = ProfilePictureSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            # Delete old profile picture if exists
            if request.user.profile_picture:
                try:
                    request.user.profile_picture.delete(save=False)
                except Exception:
                    pass  # Continue even if old file deletion fails
            
            serializer.save()
            
            return Response({
                'message': 'Profile picture updated successfully',
                'profile_picture': request.user.profile_picture.url if request.user.profile_picture else None
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        """Remove profile picture"""
        if request.user.profile_picture:
            try:
                request.user.profile_picture.delete()
                request.user.profile_picture = None
                request.user.save()
                return Response({'message': 'Profile picture removed successfully'})
            except Exception as e:
                return Response(
                    {'error': 'Failed to remove profile picture'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(
            {'error': 'No profile picture to remove'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

class EmailChangeRequestView(APIView):
    """Request email address change"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = EmailChangeRequestSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Email change verification sent to your new email address'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AccountSettingsView(APIView):
    """Get account settings and verification status"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current account settings"""
        serializer = AccountSettingsSerializer(request.user)
        
        # Add additional account info
        data = serializer.data
        data.update({
            'account_created': request.user.date_joined,
            'last_login': request.user.last_login,
            'user_type': request.user.user_type,
            'username': request.user.username,
            'email': request.user.email,
        })
        
        return Response(data)

class AccountDeactivationView(APIView):
    """Handle account deactivation (soft delete)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Deactivate user account"""
        password = request.data.get('password')
        
        if not password:
            return Response(
                {'error': 'Password is required to deactivate account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not request.user.check_password(password):
            return Response(
                {'error': 'Incorrect password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Deactivate account
        request.user.is_active = False
        request.user.save()
        
        # Send confirmation email
        try:
            from django.core.mail import send_mail
            send_mail(
                subject='Account Deactivated',
                message='Your UniHousing account has been deactivated.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[request.user.email],
                fail_silently=True,
            )
        except Exception:
            pass
        
        return Response({
            'message': 'Account deactivated successfully'
        })

class DeleteAccountView(APIView):
    """Handle permanent account deletion"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Permanently delete user account"""
        password = request.data.get('password')
        confirmation = request.data.get('confirmation')
        
        if not password:
            return Response(
                {'error': 'Password is required to delete account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if confirmation != 'DELETE':
            return Response(
                {'error': 'Please type DELETE to confirm account deletion'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not request.user.check_password(password):
            return Response(
                {'error': 'Incorrect password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store email for confirmation
        user_email = request.user.email
        
        # Delete user account (this will cascade to related objects)
        request.user.delete()
        
        # Send confirmation email
        try:
            from django.core.mail import send_mail
            send_mail(
                subject='Account Deleted',
                message='Your UniHousing account has been permanently deleted.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user_email],
                fail_silently=True,
            )
        except Exception:
            pass
        
        return Response({
            'message': 'Account deleted permanently'
        })

# Password Reset Views
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'If an account with that email exists, a password reset link has been sent.'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {'message': 'Password has been reset successfully.'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetValidateTokenView(APIView):
    """Validate reset token without actually resetting password"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        
        if not uid or not token:
            return Response(
                {'error': 'Both uid and token are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.utils.http import urlsafe_base64_decode
            from django.contrib.auth.tokens import default_token_generator
            
            # Decode user ID
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
            
            # Validate token
            if default_token_generator.check_token(user, token):
                return Response(
                    {'valid': True, 'message': 'Token is valid.'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'valid': False, 'error': 'Invalid or expired token.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'valid': False, 'error': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST
            )

# Email Verification Views
class EmailVerificationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {'message': 'Email verified successfully!'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Verification email sent successfully!'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)