# backend/roommates/utils.py
from typing import Dict, List, Tuple

class ProfileCompletionCalculator:
    """Single source of truth for profile completion calculation"""
    
    FIELD_WEIGHTS = {
        # User model fields (access via profile.user)
        'university': 4,
        'program': 4,  # This is 'major' in the UI
        'graduation_year': 4,
        'date_of_birth': 3, 
        
        # RoommateProfile basic info fields
        'sleep_schedule': 4,
        'cleanliness': 4,
        'noise_tolerance': 4,
        'guest_policy': 4,
        'bio': 4,
        'preferred_roommate_gender': 4,
        
        # Personal information (new)
        'gender': 3,
        'year': 3,  # Academic year
        
        # Housing preferences (new) - Essential
        'budget_min': 4,
        'budget_max': 4,
        
        # Housing preferences (new) - Important
        'move_in_date': 3,
        'lease_duration': 3,
        'preferred_locations': 3,
        'housing_type': 3,
        
        # Optional but important
        'study_habits': 3,
        'work_schedule': 2,  # New
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
            if field in ['university', 'program', 'graduation_year', 'date_of_birth']:
                value = getattr(profile.user, field, None)
            else:
                # RoommateProfile fields
                value = getattr(profile, field, None)
            
            # Check completion based on field type
            if field in ['pet_friendly', 'smoking_allowed']:
                is_complete = value is not None
            elif field in ['hobbies', 'social_activities', 'languages', 'preferred_locations']:
                # ArrayField - needs at least one item
                is_complete = value is not None and len(value) > 0
            elif field == 'dietary_restrictions':
                # Can be empty array
                is_complete = value is not None
            elif field in ['budget_min', 'budget_max']:
                # Numeric fields - consider 0 as valid
                is_complete = value is not None
            elif isinstance(value, str):
                is_complete = bool(value and value.strip())
            else:
                is_complete = value is not None
            
            if is_complete:
                completed_weight += weight
            elif weight >= 4:  # Required fields
                missing_required.append(field)
        
        # Only check for images if the profile has been saved (has a primary key)
        if profile.pk and hasattr(profile, 'images'):
            try:
                if profile.images.filter(is_approved=True).exists():
                    completed_weight += 5
                    total_weight += 5
            except ValueError:
                # Can't access related manager yet, skip image bonus
                pass
        
        percentage = int((completed_weight / total_weight) * 100)
        return percentage, missing_required