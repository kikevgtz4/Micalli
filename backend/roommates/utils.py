# backend/roommates/utils.py
from typing import Dict, List, Tuple

class ProfileCompletionCalculator:
    """Single source of truth for profile completion calculation"""
    
    FIELD_WEIGHTS = {
        # User model fields (access via profile.user)
        'university': 4,
        'program': 4,  # This is 'major' in the UI
        'graduation_year': 4,
        
        # RoommateProfile fields
        'sleep_schedule': 4,
        'cleanliness': 4,
        'noise_tolerance': 4,
        'guest_policy': 4,
        'bio': 4,
        'preferred_roommate_gender': 4,
        
        # Optional but important
        'study_habits': 3,
        'pet_friendly': 2,
        'smoking_allowed': 2,
        'age_range_min': 2,
        'age_range_max': 2,
        'preferred_roommate_count': 2,
        
        # Nice to have
        'hobbies': 1,
        'social_activities': 1,
        'dietary_restrictions': 1,
        'languages': 1,
    }
    
    @classmethod
    def calculate_completion(cls, profile) -> Tuple[int, List[str]]:
        """
        Calculate profile completion percentage and missing fields
        Returns: (percentage, list_of_missing_required_fields)
        """
        total_weight = sum(cls.FIELD_WEIGHTS.values())
        completed_weight = 0
        missing_required = []
        
        for field, weight in cls.FIELD_WEIGHTS.items():
            value = None
            is_complete = False
            
            # Handle User model fields
            if field in ['university', 'program', 'graduation_year']:
                value = getattr(profile.user, field, None)
            else:
                # RoommateProfile fields
                value = getattr(profile, field, None)
            
            # Check completion based on field type
            if field in ['pet_friendly', 'smoking_allowed']:
                is_complete = value is not None
            elif field in ['hobbies', 'social_activities', 'languages']:
                is_complete = value is not None and len(value) > 0
            elif field == 'dietary_restrictions':
                is_complete = value is not None  # Can be empty array
            elif isinstance(value, str):
                is_complete = bool(value and value.strip())
            else:
                is_complete = value is not None
            
            if is_complete:
                completed_weight += weight
            elif weight >= 4:  # Required fields
                missing_required.append(field)
        
        percentage = int((completed_weight / total_weight) * 100)
        return percentage, missing_required