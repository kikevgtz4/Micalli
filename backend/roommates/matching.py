# backend/roommates/matching.py

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from decimal import Decimal
import math
from django.db.models import Q
from roommates.models import RoommateProfile

@dataclass
class MatchFactor:
    """Represents a single matching factor with its weight and comparison method"""
    name: str
    weight: float
    comparison_type: str  # 'exact', 'range', 'similarity', 'inverse'
    deal_breaker: bool = False

class RoommateMatchingEngine:
    """
    Advanced roommate matching algorithm that considers multiple factors
    with weighted scoring and deal-breaker criteria
    """
    
    # Factor weights (sum to 1.0 for main factors)
    FACTORS = {
        # Core lifestyle factors (60% weight)
        'sleep_schedule': MatchFactor('sleep_schedule', 0.20, 'exact'),
        'cleanliness': MatchFactor('cleanliness', 0.15, 'range'),
        'noise_tolerance': MatchFactor('noise_tolerance', 0.15, 'range'),
        'guest_policy': MatchFactor('guest_policy', 0.10, 'similarity'),
        
        # Academic factors (15% weight)
        'study_habits': MatchFactor('study_habits', 0.10, 'similarity'),
        'major_similarity': MatchFactor('major', 0.05, 'similarity'),
        
        # Social factors (15% weight)
        'hobbies': MatchFactor('hobbies', 0.10, 'similarity'),
        'social_activities': MatchFactor('social_activities', 0.05, 'similarity'),
        
        # Practical factors (10% weight)
        'budget_compatibility': MatchFactor('budget', 0.05, 'range'),
        'move_in_date': MatchFactor('move_in_date', 0.05, 'range'),
        
        # Deal breakers (veto power, no weight)
        'smoking': MatchFactor('smoking_allowed', 0, 'exact', True),
        'pets': MatchFactor('pet_friendly', 0, 'exact', True),
        'gender_preference': MatchFactor('preferred_roommate_gender', 0, 'exact', True),
    }
    
    def __init__(self):
        self.compatibility_cache = {}
    
    def calculate_compatibility(
        self, 
        profile1: RoommateProfile, 
        profile2: RoommateProfile
    ) -> Tuple[Decimal, Dict[str, float], List[str]]:
        """
        Calculate compatibility between two profiles
        Returns: (overall_score, factor_scores, incompatible_factors)
        """
        
        # Check deal breakers first
        incompatible_factors = self._check_deal_breakers(profile1, profile2)
        if incompatible_factors:
            return Decimal('0.00'), {}, incompatible_factors
        
        # Calculate factor scores
        factor_scores = {}
        weighted_sum = 0.0
        total_weight = 0.0
        
        for factor_key, factor in self.FACTORS.items():
            if factor.deal_breaker:
                continue
                
            score = self._calculate_factor_score(profile1, profile2, factor)
            if score is not None:
                factor_scores[factor_key] = score
                weighted_sum += score * factor.weight
                total_weight += factor.weight
        
        # Calculate overall score
        if total_weight > 0:
            overall_score = Decimal(str(round((weighted_sum / total_weight) * 100, 2)))
        else:
            overall_score = Decimal('50.00')  # Default if no factors available
        
        return overall_score, factor_scores, []
    
    def _check_deal_breakers(
        self, 
        profile1: RoommateProfile, 
        profile2: RoommateProfile
    ) -> List[str]:
        """Check for any deal-breaker incompatibilities"""
        incompatible = []
        
        # Smoking preferences
        if (profile1.smoking_allowed != profile2.smoking_allowed and 
            (profile1.smoking_allowed is not None and profile2.smoking_allowed is not None)):
            incompatible.append('smoking_preferences')
        
        # Pet preferences
        if (profile1.pet_friendly != profile2.pet_friendly and
            (profile1.pet_friendly is not None and profile2.pet_friendly is not None)):
            incompatible.append('pet_preferences')
        
        # Gender preferences
        if not self._check_gender_compatibility(profile1, profile2):
            incompatible.append('gender_preferences')
        
        # Age range preferences
        if not self._check_age_compatibility(profile1, profile2):
            incompatible.append('age_preferences')
        
        return incompatible
    
    def _calculate_factor_score(
        self, 
        profile1: RoommateProfile, 
        profile2: RoommateProfile, 
        factor: MatchFactor
    ) -> Optional[float]:
        """Calculate score for a single factor (0.0 to 1.0)"""
        
        if factor.comparison_type == 'exact':
            return self._exact_match_score(profile1, profile2, factor.name)
        elif factor.comparison_type == 'range':
            return self._range_match_score(profile1, profile2, factor.name)
        elif factor.comparison_type == 'similarity':
            return self._similarity_score(profile1, profile2, factor.name)
        elif factor.comparison_type == 'inverse':
            return self._inverse_match_score(profile1, profile2, factor.name)
        
        return None
    
    def _exact_match_score(
        self, 
        profile1: RoommateProfile, 
        profile2: RoommateProfile, 
        field: str
    ) -> float:
        """Score for exact match fields (1.0 if match, 0.0 if not)"""
        val1 = getattr(profile1, field, None)
        val2 = getattr(profile2, field, None)
        
        if val1 is None or val2 is None:
            return 0.5  # Neutral if data missing
        
        return 1.0 if val1 == val2 else 0.0
    
    def _range_match_score(
        self, 
        profile1: RoommateProfile, 
        profile2: RoommateProfile, 
        field: str
    ) -> float:
        """Score based on how close values are (for numeric fields)"""
        val1 = getattr(profile1, field, None)
        val2 = getattr(profile2, field, None)
        
        if val1 is None or val2 is None:
            return 0.5  # Neutral if data missing
        
        # Special handling for different fields
        if field == 'cleanliness' or field == 'noise_tolerance':
            # These are on a 1-5 scale
            diff = abs(val1 - val2)
            return max(0, 1.0 - (diff * 0.25))  # 25% penalty per level difference
        
        elif field == 'budget':
            # Budget compatibility within 20% range
            avg_budget = (val1 + val2) / 2
            diff_percent = abs(val1 - val2) / avg_budget
            return max(0, 1.0 - diff_percent)
        
        elif field == 'move_in_date':
            # Date compatibility (within 30 days = perfect)
            if hasattr(val1, 'days') and hasattr(val2, 'days'):
                days_diff = abs((val1 - val2).days)
                return max(0, 1.0 - (days_diff / 30.0))
        
        return 0.5
    
    def _similarity_score(
        self, 
        profile1: RoommateProfile, 
        profile2: RoommateProfile, 
        field: str
    ) -> float:
        """Score based on similarity of arrays or text fields"""
        val1 = getattr(profile1, field, None)
        val2 = getattr(profile2, field, None)
        
        if val1 is None or val2 is None:
            return 0.5  # Neutral if data missing
        
        # Array fields (hobbies, social_activities, languages, dietary_restrictions)
        if isinstance(val1, list) and isinstance(val2, list):
            if not val1 and not val2:
                return 1.0  # Both empty = match
            if not val1 or not val2:
                return 0.3  # One empty = low match
            
            # Jaccard similarity coefficient
            set1, set2 = set(val1), set(val2)
            intersection = len(set1 & set2)
            union = len(set1 | set2)
            
            return intersection / union if union > 0 else 0.0
        
        # Text fields (study_habits, major)
        elif isinstance(val1, str) and isinstance(val2, str):
            # Simple keyword matching for now
            # TODO: Implement more sophisticated NLP similarity
            words1 = set(val1.lower().split())
            words2 = set(val2.lower().split())
            
            if not words1 and not words2:
                return 1.0
            if not words1 or not words2:
                return 0.3
            
            intersection = len(words1 & words2)
            union = len(words1 | words2)
            
            return intersection / union if union > 0 else 0.0
        
        return 0.5
    
    def _check_gender_compatibility(
        self, 
        profile1: RoommateProfile, 
        profile2: RoommateProfile
    ) -> bool:
        """Check if gender preferences are compatible"""
        # Get actual genders from user profiles
        gender1 = profile1.user.profile.gender if hasattr(profile1.user, 'profile') else None
        gender2 = profile2.user.profile.gender if hasattr(profile2.user, 'profile') else None
        
        pref1 = profile1.preferred_roommate_gender
        pref2 = profile2.preferred_roommate_gender
        
        # If either has no preference, it's compatible
        if pref1 == 'no_preference' or pref2 == 'no_preference':
            return True
        
        # Check mutual compatibility
        return (pref1 == gender2 or pref1 is None) and (pref2 == gender1 or pref2 is None)
    
    def _check_age_compatibility(
        self, 
        profile1: RoommateProfile, 
        profile2: RoommateProfile
    ) -> bool:
        """Check if age preferences are compatible"""
        # Get actual ages from user profiles
        age1 = profile1.user.profile.age if hasattr(profile1.user, 'profile') else None
        age2 = profile2.user.profile.age if hasattr(profile2.user, 'profile') else None
        
        if age1 is None or age2 is None:
            return True  # Can't check without age data
        
        # Check if each person fits in the other's age range
        fits1 = True
        if profile2.age_range_min and profile2.age_range_max:
            fits1 = profile2.age_range_min <= age1 <= profile2.age_range_max
        
        fits2 = True
        if profile1.age_range_min and profile1.age_range_max:
            fits2 = profile1.age_range_min <= age2 <= profile1.age_range_max
        
        return fits1 and fits2
    
    def find_matches(
        self, 
        profile: RoommateProfile, 
        limit: int = 10,
        min_score: Decimal = Decimal('60.00')
    ) -> List[Tuple[RoommateProfile, Decimal, Dict]]:
        """
        Find top matches for a given profile
        Returns list of (profile, score, details) tuples
        """
        # Get potential matches
        potential_matches = RoommateProfile.objects.exclude(
            user=profile.user
        ).select_related('user').prefetch_related('languages', 'hobbies')
        
        # Apply basic filters
        if profile.university:
            potential_matches = potential_matches.filter(university=profile.university)
        
        # Calculate compatibility for each potential match
        matches = []
        for candidate in potential_matches:
            score, factors, incompatible = self.calculate_compatibility(profile, candidate)
            
            if score >= min_score:
                matches.append((
                    candidate,
                    score,
                    {
                        'factor_scores': factors,
                        'overall_score': score,
                        'profile_completion': self._calculate_profile_completion(candidate)
                    }
                ))
        
        # Sort by score descending
        matches.sort(key=lambda x: x[1], reverse=True)
        
        return matches[:limit]
    
    def _calculate_profile_completion(self, profile: RoommateProfile) -> float:
        """Calculate how complete a profile is (0.0 to 1.0)"""
        fields = [
            'sleep_schedule', 'cleanliness', 'noise_tolerance', 'guest_policy',
            'study_habits', 'major', 'year', 'hobbies', 'social_activities',
            'pet_friendly', 'smoking_allowed', 'dietary_restrictions',
            'preferred_roommate_gender', 'age_range_min', 'age_range_max',
            'bio', 'languages'
        ]
        
        completed = sum(1 for field in fields if getattr(profile, field, None))
        return completed / len(fields)