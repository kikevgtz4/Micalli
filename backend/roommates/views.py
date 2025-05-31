from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import RoommateProfile, RoommateRequest, RoommateMatch
from .serializers import RoommateProfileSerializer, RoommateRequestSerializer, RoommateMatchSerializer
from django.db.models import Q
from .matching import RoommateMatchingEngine
from decimal import Decimal
from typing import List, Dict, Tuple, Optional
from rest_framework.permissions import AllowAny, IsAuthenticated


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
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.matching_engine = RoommateMatchingEngine()
    
    @action(detail=True, methods=['get'])
    def compatibility(self, request, pk=None):
        """Calculate compatibility with another user's profile"""
        target_profile = self.get_object()
        
        # Get or create the current user's profile
        my_profile, created = RoommateProfile.objects.get_or_create(user=request.user)
        
        if created:
            return Response({
                'error': 'Please complete your roommate profile first',
                'profile_completion': 0
            }, status=400)
        
        # Check profile completion
        my_completion = self.matching_engine._calculate_profile_completion(my_profile)
        if my_completion < 0.5:  # Require at least 50% completion
            return Response({
                'error': 'Your profile is only {:.0%} complete. Please add more information for better matches.'.format(my_completion),
                'profile_completion': my_completion
            }, status=400)
        
        # Calculate compatibility
        score, factor_scores, incompatible_factors = self.matching_engine.calculate_compatibility(
            my_profile, 
            target_profile
        )
        
        # Get top matching factors and areas for improvement
        sorted_factors = sorted(factor_scores.items(), key=lambda x: x[1], reverse=True)
        compatible_traits = [k for k, v in sorted_factors[:3] if v >= 0.7]
        incompatible_traits = [k for k, v in sorted_factors if v < 0.3]
        
        return Response({
            'compatibility_score': float(score),
            'factor_scores': factor_scores,
            'compatible_traits': compatible_traits,
            'incompatible_traits': incompatible_traits,
            'incompatible_factors': incompatible_factors,
            'profile_completion': {
                'yours': my_completion,
                'theirs': self.matching_engine._calculate_profile_completion(target_profile)
            },
            'recommendation': self._get_match_recommendation(score)
        })
    
    @action(detail=False, methods=['get'])
    def find_matches(self, request):
        """Find top roommate matches for the current user"""
        try:
            profile = RoommateProfile.objects.get(user=request.user)
        except RoommateProfile.DoesNotExist:
            return Response({
                'error': 'Please create your roommate profile first'
            }, status=400)
        
        # Check profile completion
        completion = self.matching_engine._calculate_profile_completion(profile)
        if completion < 0.5:
            return Response({
                'error': 'Your profile is only {:.0%} complete. Please add more information for better matches.'.format(completion),
                'profile_completion': completion,
                'required_fields': self._get_missing_required_fields(profile)
            }, status=400)
        
        # Get filter parameters
        min_score = request.query_params.get('min_score', 60)
        limit = int(request.query_params.get('limit', 10))
        
        # Find matches
        matches = self.matching_engine.find_matches(
            profile, 
            limit=limit,
            min_score=Decimal(str(min_score))
        )
        
        # Serialize results
        results = []
        for match_profile, score, details in matches:
            serializer = self.get_serializer(match_profile)
            match_data = serializer.data
            match_data['match_details'] = {
                'score': float(score),
                'factor_breakdown': details['factor_scores'],
                'profile_completion': details['profile_completion'],
                'recommendation': self._get_match_recommendation(score)
            }
            results.append(match_data)
        
        return Response({
            'matches': results,
            'total_count': len(results),
            'your_profile_completion': completion
        })
    
    def _get_match_recommendation(self, score: Decimal) -> str:
        """Get a human-readable recommendation based on score"""
        if score >= 90:
            return "Excellent match! You two would likely be great roommates."
        elif score >= 80:
            return "Very good match! You have many compatible traits."
        elif score >= 70:
            return "Good match! You share several important preferences."
        elif score >= 60:
            return "Decent match. Some differences but could work well."
        else:
            return "Low compatibility. Significant lifestyle differences."
    
    def _get_missing_required_fields(self, profile: RoommateProfile) -> List[str]:
        """Get list of missing required fields for matching"""
        required = ['sleep_schedule', 'cleanliness', 'noise_tolerance', 'guest_policy']
        missing = [field for field in required if not getattr(profile, field, None)]
        return missing
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_profiles(self, request):
        """Get limited public profiles for preview"""
        limit = int(request.query_params.get('limit', 10))
        
        # Get profiles with high completion
        profiles = RoommateProfile.objects.filter(
            user__is_active=True
        ).select_related('user', 'university').prefetch_related('hobbies', 'languages')
        
        # Calculate completion and filter
        complete_profiles = []
        for profile in profiles:
            completion = self.matching_engine._calculate_profile_completion(profile)
            if completion >= 0.8:  # Only show well-completed profiles
                complete_profiles.append(profile)
        
        # Sort by completion and return top profiles
        complete_profiles.sort(
            key=lambda p: self.matching_engine._calculate_profile_completion(p), 
            reverse=True
        )
        
        serializer = self.get_serializer(complete_profiles[:limit], many=True)
        return Response(serializer.data)


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