// frontend/src/components/roommates/RoommateProfileForm.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/api';
import { toast } from 'react-hot-toast';
import { RoommateProfileFormData } from '@/types/roommates';

// Import all step components
import { BasicInfoStep } from './steps/BasicInfoStep';
import { LifestyleStep } from './steps/LifestyleStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { SocialStep } from './steps/SocialStep';
import { RoommatePreferencesStep } from './steps/RoommatePreferencesStep';

interface RoommateProfileFormProps {
  initialData?: Partial<RoommateProfileFormData>;
  onComplete?: () => void;  // Optional
  onSkip?: () => void;      // Optional
  isEditing?: boolean;
  profileId?: number;
}

const STEPS = [
  { id: 'basic', title: 'Basic Info', component: BasicInfoStep },
  { id: 'lifestyle', title: 'Lifestyle', component: LifestyleStep },
  { id: 'preferences', title: 'Preferences', component: PreferencesStep },
  { id: 'social', title: 'Social', component: SocialStep },
  { id: 'roommate', title: 'Ideal Roommate', component: RoommatePreferencesStep },
];

export default function RoommateProfileForm({
  initialData,
  onComplete,
  onSkip,
  isEditing = false,
  profileId
}: RoommateProfileFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<RoommateProfileFormData>>(
    initialData || {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateCompletion = (): number => {
    const fields = [
      'sleepSchedule',
      'cleanliness', 
      'noiseTolerance',
      'guestPolicy',
      'studyHabits',
      'major',
      'year',
      'bio',
      'petFriendly',
      'smokingAllowed',
      'hobbies',
      'socialActivities',
      'dietaryRestrictions',
      'languages',
      'preferredRoommateGender',
      'ageRangeMin',
      'ageRangeMax'
    ];
    
    const completed = fields.filter(field => {
      const value = formData[field as keyof RoommateProfileFormData];
      
      if (field === 'petFriendly' || field === 'smokingAllowed') {
        return value !== null && value !== undefined;
      }
      
      if (Array.isArray(value)) {
        return value.length > 0 || field === 'dietaryRestrictions';
      }
      
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      
      return value !== null && value !== undefined;
    }).length;
    
    return Math.round((completed / fields.length) * 100);
  };


  const CurrentStepComponent = STEPS[currentStep].component;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 0: // Basic Info
        if (!formData.sleepSchedule) {
          newErrors.sleepSchedule = 'Please select your sleep schedule';
        }
        if (!formData.major || formData.major.trim().length < 2) {
          newErrors.major = 'Please enter your field of study (at least 2 characters)';
        }
        if (!formData.year) {
          newErrors.year = 'Please select your year of study';
        }
        if (formData.bio && formData.bio.length > 500) {
          newErrors.bio = 'Bio must be 500 characters or less';
        }
        break;
        
      case 1: // Lifestyle
        if (!formData.cleanliness) {
          newErrors.cleanliness = 'Please rate your cleanliness level';
        }
        if (!formData.noiseTolerance) {
          newErrors.noiseTolerance = 'Please rate your noise tolerance';
        }
        if (!formData.guestPolicy) {
          newErrors.guestPolicy = 'Please select your guest policy';
        }
        break;
        
      case 2: // Preferences
        // These are all optional, but validate formats
        if (formData.dietaryRestrictions && formData.dietaryRestrictions.length > 10) {
          newErrors.dietaryRestrictions = 'Maximum 10 dietary restrictions allowed';
        }
        if (formData.languages && formData.languages.length > 10) {
          newErrors.languages = 'Maximum 10 languages allowed';
        }
        break;
        
      case 3: // Social
        // Optional fields, but validate if provided
        if (formData.hobbies && formData.hobbies.length > 20) {
          newErrors.hobbies = 'Maximum 20 hobbies allowed';
        }
        if (formData.socialActivities && formData.socialActivities.length > 20) {
          newErrors.socialActivities = 'Maximum 20 activities allowed';
        }
        break;
        
      case 4: // Roommate Preferences
        if (!formData.preferredRoommateGender) {
          newErrors.preferredRoommateGender = 'Please select your roommate gender preference';
        }
        
        // Validate age range if provided
        if (formData.ageRangeMin && formData.ageRangeMax) {
          if (formData.ageRangeMin < 18) {
            newErrors.ageRangeMin = 'Minimum age must be at least 18';
          }
          if (formData.ageRangeMax > 99) {
            newErrors.ageRangeMax = 'Maximum age cannot exceed 99';
          }
          if (formData.ageRangeMin > formData.ageRangeMax) {
            newErrors.ageRangeMax = 'Maximum age must be greater than minimum age';
          }
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      let response;
      if (isEditing && profileId) {
        response = await apiService.roommates.updateProfile({
          ...formData,
          id: profileId
        });
      } else {
        response = await apiService.roommates.createOrUpdateProfile(formData);
      }
      
      // Use the profile completion percentage from the response if available
      // Otherwise calculate it locally
      const completion = response.data.profileCompletionPercentage || 
        calculateLocalCompletion(response.data);
      
      // Show appropriate success message
      if (completion >= 80) {
        toast.success('🎉 Profile completed! You now have full access to all features.');
      } else if (completion >= 50) {
        toast.success(`Profile updated! ${Math.round(completion)}% complete. Complete 80% for full access.`);
      } else {
        toast.success(`Profile saved! ${Math.round(completion)}% complete. Keep adding details for better matches.`);
      }
      
      // Check if onComplete is defined before calling
      if (onComplete) {
        // Small delay before redirect for toast to show
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
      
    } catch (error) {
      console.error('Profile submission error:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this helper function to calculate completion locally
  const calculateLocalCompletion = (profile: any): number => {
    const fields = [
      'sleepSchedule',
      'cleanliness', 
      'noiseTolerance',
      'guestPolicy',
      'studyHabits',
      'major',
      'year',
      'bio',
      'petFriendly',
      'smokingAllowed',
      'hobbies',
      'socialActivities',
      'dietaryRestrictions',
      'languages',
      'preferredRoommateGender',
      'ageRangeMin',
      'ageRangeMax'
    ];
    
    const completed = fields.filter(field => {
      const value = profile[field];
      
      // Handle boolean fields - check if not null/undefined
      if (field === 'petFriendly' || field === 'smokingAllowed') {
        return value !== null && value !== undefined;
      }
      
      // Handle array fields
      if (Array.isArray(value)) {
        return value.length > 0 || field === 'dietaryRestrictions'; // dietary can be empty
      }
      
      // Handle text fields
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      
      // Handle numeric/other fields
      return value !== null && value !== undefined;
    }).length;
    
    return Math.round((completed / fields.length) * 100);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-stone-900">
            {isEditing ? 'Edit Your Profile' : 'Complete Your Profile'}
          </h2>
          <span className="text-sm text-stone-600">
            {calculateCompletion()}% Complete
          </span>
        </div>
        
        <div className="relative">
          <div className="flex justify-between mb-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  index <= currentStep ? 'text-primary-600' : 'text-stone-400'
                }`}
              >
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                    index < currentStep
                      ? 'bg-primary-600 text-white'
                      : index === currentStep
                      ? 'bg-primary-100 text-primary-600 border-2 border-primary-600'
                      : 'bg-stone-200 text-stone-400'
                  }`}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <p className="text-xs mt-1">{step.title}</p>
              </div>
            ))}
          </div>
          
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-stone-200 -z-10">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
        <CurrentStepComponent
          data={formData}
          onChange={handleChange}
          errors={errors}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-6">
        <button
          type="button"
          onClick={currentStep === 0 ? handleSkip : handlePrevious}
          className="px-6 py-2 text-stone-600 hover:text-stone-800 font-medium"
        >
          {currentStep === 0 ? 'Skip for now' : 'Previous'}
        </button>

        <div className="flex gap-3">
          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Profile' : 'Complete Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}