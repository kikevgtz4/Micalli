from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import RoommateProfile, RoommateRequest, RoommateMatch
from .serializers import RoommateProfileSerializer, RoommateRequestSerializer, RoommateMatchSerializer
from django.db.models import Q

class RoommateProfileViewSet(viewsets.ModelViewSet):
    queryset = RoommateProfile.objects.all()
    serializer_class = RoommateProfileSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['user__first_name', 'user__last_name', 'university__name', 'major']
    
    def get_permissions(self):
        if self.action in ['retrieve', 'list']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]  # Add owner permission
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = RoommateProfile.objects.all()
        # Add filtering options
        university = self.request.query_params.get('university')
        if university:
            queryset = queryset.filter(university__id=university)
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get the current user's roommate profile"""
        profile, created = RoommateProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def compatibility(self, request, pk=None):
        """Calculate compatibility with another user's profile"""
        target_profile = self.get_object()
        my_profile, created = RoommateProfile.objects.get_or_create(user=request.user)
        
        # Here you would implement a compatibility algorithm
        # based on the profile preferences
        compatibility_score = 70  # Placeholder value
        
        return Response({
            'compatibility_score': compatibility_score,
            'compatible_traits': ['study_habits', 'cleanliness'],  # Example
            'incompatible_traits': ['noise_tolerance']  # Example
        })


class RoommateRequestViewSet(viewsets.ModelViewSet):
    queryset = RoommateRequest.objects.filter(status='active')
    serializer_class = RoommateRequestSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'university__name', 'preferred_areas']
    
    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]  # Add owner permission
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = RoommateRequest.objects.filter(status='active')
        # Add filtering options
        university = self.request.query_params.get('university')
        if university:
            queryset = queryset.filter(university__id=university)
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Get the current user's roommate requests"""
        requests = RoommateRequest.objects.filter(user=request.user)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)


class RoommateMatchViewSet(viewsets.ModelViewSet):
    queryset = RoommateMatch.objects.all()
    serializer_class = RoommateMatchSerializer
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        """Only show matches related to the current user"""
        return RoommateMatch.objects.filter(
            Q(user_from=self.request.user) | Q(user_to=self.request.user)
        )
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a roommate match request"""
        match = self.get_object()
        if match.user_to != request.user:
            return Response(
                {"detail": "You can only accept matches sent to you."},
                status=status.HTTP_403_FORBIDDEN
            )
        match.status = 'accepted'
        match.save()
        serializer = self.get_serializer(match)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline a roommate match request"""
        match = self.get_object()
        if match.user_to != request.user:
            return Response(
                {"detail": "You can only decline matches sent to you."},
                status=status.HTTP_403_FORBIDDEN
            )
        match.status = 'declined'
        match.save()
        serializer = self.get_serializer(match)
        return Response(serializer.data)