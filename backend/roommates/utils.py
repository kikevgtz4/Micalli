# backend/roommates/utils.py (NEW FILE)
from typing import Dict, List, Tuple

class ProfileCompletionCalculator:
    """Single source of truth for profile completion calculation"""
    
    FIELD_WEIGHTS = {
        # Required fields (60% weight)
        'sleep_schedule': 4,
        'cleanliness': 4,
        'noise_tolerance': 4,
        'guest_policy': 4,
        'major': 4,
        'year': 4,
        'bio': 4,
        'university': 4,
        'preferred_roommate_gender': 4,
        
        # Optional but important (30% weight)
        'study_habits': 3,
        'pet_friendly': 2,
        'smoking_allowed': 2,
        'age_range_min': 2,
        'age_range_max': 2,
        'preferred_roommate_count': 2,
        
        # Nice to have (10% weight)
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
            value = getattr(profile, field, None)
            is_complete = False
            
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