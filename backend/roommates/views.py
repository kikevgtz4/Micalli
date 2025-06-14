from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from roommates.permissions import IsProfileOwnerOrReadOnly
from .models import RoommateProfile, RoommateRequest, RoommateMatch
from .serializers import (
    RoommateProfileSerializer, 
    RoommateRequestSerializer, 
    RoommateMatchSerializer, 
    RoommateProfilePublicSerializer,
    RoommateProfileMatchSerializer  
)
from django.db.models import Q
from .matching import RoommateMatchingEngine
from decimal import Decimal
from typing import List, Dict, Tuple, Optional
from rest_framework.permissions import AllowAny, IsAuthenticated

class RoommateProfilePagination(PageNumberPagination):
        page_size = 20
        page_size_query_param = 'page_size'
        max_page_size = 100


class RoommateProfileViewSet(viewsets.ModelViewSet):
    queryset = RoommateProfile.objects.all()
    serializer_class = RoommateProfileSerializer
    permission_classes = [IsProfileOwnerOrReadOnly]
    pagination_class = RoommateProfilePagination 
    filter_backends = [filters.SearchFilter]
    search_fields = ['user__first_name', 'user__last_name', 'university__name', 'major']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.matching_engine = RoommateMatchingEngine()
    
    def get_serializer_class(self):
        """Use different serializers based on user's profile completion"""
        if self.action in ['list', 'retrieve']:
            if self.request.user.is_authenticated:
                try:
                    profile = RoommateProfile.objects.get(user=self.request.user)
                    if profile.completion_percentage < 50:
                        return RoommateProfilePublicSerializer
                except RoommateProfile.DoesNotExist:
                    return RoommateProfilePublicSerializer
        
        return RoommateProfileSerializer
    
    def get_queryset(self):
        """Optimize query with proper filtering based on completion"""
        queryset = RoommateProfile.objects.select_related(
            'user',  # Only select_related on direct relationships
            'user__university'  # Access university through user
        ).prefetch_related(
            'hobbies', 'social_activities', 'dietary_restrictions', 'languages'
        ).filter(
            user__is_active=True
        )
        
        # Filter by completion percentage for better performance
        if self.action == 'list' and self.request.user.is_authenticated:
            try:
                requester_profile = RoommateProfile.objects.get(user=self.request.user)
                
                if requester_profile.completion_percentage < 50:
                    # Only show highly complete profiles as teasers
                    queryset = queryset.filter(completion_percentage__gte=80)[:5]
                elif requester_profile.completion_percentage < 80:
                    queryset = queryset.filter(completion_percentage__gte=60)[:20]
                # else: full access with pagination
                
            except RoommateProfile.DoesNotExist:
                queryset = queryset.filter(completion_percentage__gte=80)[:5]
        
        # Apply filters
        university = self.request.query_params.get('university')
        if university:
            queryset = queryset.filter(user__university__id=university)  # Changed from university__id
            
        return queryset.order_by('-completion_percentage', '-updated_at')
    
    def get_permissions(self):
        if self.action in ['retrieve', 'list']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]  # Add owner permission
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get the current user's roommate profile"""
        try:
            profile = RoommateProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except RoommateProfile.DoesNotExist:
            # Return 404 with a consistent error structure
            return Response(
                {
                    "detail": "No roommate profile found",
                    "code": "profile_not_found"
                },
                status=status.HTTP_404_NOT_FOUND
            )
    
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

    def create(self, request, *args, **kwargs):
        """Override create to update if profile already exists"""
        try:
            instance = RoommateProfile.objects.get(user=request.user)
            # Update existing profile
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            # Update User fields if provided
            if hasattr(serializer, 'user_fields'):
                user = request.user
                updated = False
                
                if serializer.user_fields.get('university_id'):
                    user.university_id = serializer.user_fields['university_id']
                    updated = True
                
                if serializer.user_fields.get('program'):
                    user.program = serializer.user_fields['program']
                    updated = True
                    
                if serializer.user_fields.get('graduation_year'):
                    # Just save the graduation year directly, no conversion
                    user.graduation_year = serializer.user_fields['graduation_year']
                    updated = True
                    
                if updated:
                    user.save()
            
            self.perform_update(serializer)
            return Response(serializer.data)

            
        except RoommateProfile.DoesNotExist:
            # Create new profile
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Update User fields if provided
            if hasattr(serializer, 'user_fields'):
                user = request.user
                updated = False
                
                if serializer.user_fields.get('university_id'):
                    user.university_id = serializer.user_fields['university_id']
                    updated = True
                
                if serializer.user_fields.get('program'):
                    user.program = serializer.user_fields['program']
                    updated = True
                    
                if serializer.user_fields.get('graduation_year'):
                    user.graduation_year = serializer.user_fields['graduation_year']
                    updated = True
                    
                if updated:
                    user.save()
            
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
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
            profile = RoommateProfile.objects.select_related('user', 'user__university').get(user=request.user)
            completion = profile.completion_percentage
        except RoommateProfile.DoesNotExist:
            # Return limited preview for users without profile
            preview_profiles = RoommateProfile.objects.filter(
                completion_percentage__gte=80,
                user__is_active=True
            ).select_related('user', 'user__university').exclude(
                user=request.user
            ).order_by('-completion_percentage')[:5]
            
            serializer = RoommateProfilePublicSerializer(preview_profiles, many=True)
            return Response({
                'matches': serializer.data,
                'total_count': 5,
                'your_profile_completion': 0,
                'is_limited': True,
                'message': 'Create a profile to see more matches and unlock all features',
                'limits': {  # Add this
                    'current_limit': 5,
                    'next_threshold': 50,
                    'max_available': None
                }
            })
        
        # Rest of the method with try-except wrapper
        try:
            # Determine match limit based on completion
            if completion < 50:
                limit = 5
                min_score = 70
                message = f'Complete at least 50% of your profile to see more matches ({50 - completion}% more needed)'
            elif completion < 80:
                limit = 20
                min_score = 60
                message = f'Complete 80% of your profile to see all matches ({80 - completion}% more needed)'
            else:
                limit = int(request.query_params.get('limit', 50))
                min_score = int(request.query_params.get('min_score', 50))
                message = None
            
            # Get matches
            matches = self.matching_engine.find_matches(
                profile, 
                limit=limit,
                min_score=Decimal(str(min_score))
            )
            
            # When serializing results, ensure we don't include current user
            results = []
            for match_profile, score, details in matches:
                # Skip if this is the current user's own profile
                if match_profile.user.id == request.user.id:
                    continue
                    
                serializer = RoommateProfileMatchSerializer(match_profile)
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
                'your_profile_completion': completion,
                'is_limited': completion < 80,
                'message': message,
                'limits': {
                    'current_limit': limit,
                    'next_threshold': 50 if completion < 50 else (80 if completion < 80 else None),
                    'max_available': len(matches) if completion >= 80 else None
                }
            })
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in find_matches: {str(e)}", exc_info=True)
            
            return Response(
                {"error": "An error occurred while finding matches. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
    
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_profiles(self, request):
        """Get limited public profiles for preview"""
        limit = int(request.query_params.get('limit', 10))
        
        # Get profiles with high completion
        profiles = RoommateProfile.objects.filter(
            user__is_active=True
        ).select_related('user', 'university')
        
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