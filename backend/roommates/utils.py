# Replace the entire backend/roommates/utils.py file with this:

from typing import Dict, List, Tuple

class ProfileCompletionCalculator:
    """
    Calculate profile completion percentage with weighted importance
    Based on research showing core lifestyle factors matter most
    """
    
    # Core 5 fields - 60% total weight (12% each)
    CORE_FIELDS = {
        'sleep_schedule': 12,
        'cleanliness': 12,
        'noise_tolerance': 12,
        'study_habits': 12,
        'guest_policy': 12,
    }
    
    # Important but optional - 25% total weight
    IMPORTANT_FIELDS = {
        'bio': 8,
        'budget_min': 4,
        'budget_max': 4,
        'move_in_date': 4,
        'deal_breakers': 5,
    }
    
    # Nice to have - 15% total weight
    OPTIONAL_FIELDS = {
        # User model fields
        'university': 3,
        'program': 3,
        'graduation_year': 2,
        'date_of_birth': 2,
        
        # Profile fields
        'hobbies': 1,
        'languages': 1,
        'gender': 1,
        'preferred_roommate_gender': 1,
        'age_range_min': 0.5,
        'age_range_max': 0.5,
    }
    
    @classmethod
    def calculate_completion(cls, profile) -> Tuple[int, List[str]]:
        """
        Calculate the completion percentage and return missing core fields
        Returns: (percentage, list_of_missing_core_fields)
        """
        all_fields = {**cls.CORE_FIELDS, **cls.IMPORTANT_FIELDS, **cls.OPTIONAL_FIELDS}
        total_weight = sum(all_fields.values())
        completed_weight = 0
        missing_core = []
        
        for field, weight in all_fields.items():
            value = None
            is_complete = False
            
            # Handle User model fields
            if field in ['university', 'program', 'graduation_year', 'date_of_birth', 'gender']:
                value = getattr(profile.user, field, None)
            else:
                # RoommateProfile fields
                value = getattr(profile, field, None)
            
            # Check completion based on field type
            if field in ['pet_friendly', 'smoking_allowed']:
                is_complete = value is not None
            elif field in ['hobbies', 'social_activities', 'languages', 'deal_breakers',
                          'personality', 'shared_interests']:
                # ArrayField - for deal_breakers we accept empty as valid
                if field == 'deal_breakers':
                    is_complete = value is not None
                else:
                    is_complete = value is not None and len(value) > 0
            elif field in ['budget_min', 'budget_max']:
                # Numeric fields - consider 0 as valid
                is_complete = value is not None
            elif isinstance(value, str):
                is_complete = bool(value and value.strip())
            else:
                is_complete = value is not None
            
            if is_complete:
                completed_weight += weight
            elif field in cls.CORE_FIELDS:
                missing_core.append(field)
        
        # Add bonus for profile images
        if profile.pk and hasattr(profile, 'images'):
            try:
                if profile.images.filter(is_approved=True).exists():
                    completed_weight += 5
                    total_weight += 5
            except ValueError:
                # Can't access related manager yet, skip image bonus
                pass
        
        percentage = int((completed_weight / total_weight) * 100)
        return percentage, missing_core
    
    @classmethod
    def is_ready_for_matching(cls, profile):
        """
        Check if profile has minimum required fields for matching
        Requires all 5 core fields to be complete
        """
        for field in cls.CORE_FIELDS:
            value = getattr(profile, field, None)
            if not value:
                return False
        return True
    
    @classmethod
    def get_completion_status(cls, profile):
        """
        Get detailed completion status for UI display
        """
        percentage, missing_core = cls.calculate_completion(profile)
        
        status = {
            'percentage': percentage,
            'is_complete': percentage == 100,
            'is_ready_for_matching': cls.is_ready_for_matching(profile),
            'missing_core_fields': missing_core,
            'level': cls._get_completion_level(percentage),
            'next_milestone': cls._get_next_milestone(percentage)
        }
        
        return status
    
    @classmethod
    def _get_completion_level(cls, percentage):
        """Categorize completion into levels"""
        if percentage >= 90:
            return 'excellent'
        elif percentage >= 70:
            return 'good'
        elif percentage >= 60:
            return 'basic'  # Has core fields
        elif percentage >= 40:
            return 'minimal'
        else:
            return 'incomplete'
    
    @classmethod
    def _get_next_milestone(cls, percentage):
        """Get next completion milestone for gamification"""
        if percentage < 60:
            return {'target': 60, 'reward': 'Unlock basic matching'}
        elif percentage < 70:
            return {'target': 70, 'reward': 'Unlock advanced filters'}
        elif percentage < 90:
            return {'target': 90, 'reward': 'Get priority in search results'}
        elif percentage < 100:
            return {'target': 100, 'reward': 'Complete profile badge'}
        else:
            return None
