from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    UserRegistrationSerializer, 
    UserSerializer, 
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer,  # New
    PasswordResetConfirmSerializer   # New
)
from .models import User  # or from django.contrib.auth import get_user_model

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
    """
    Custom token view that allows login with either username or email
    """
    serializer_class = CustomTokenObtainPairSerializer

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