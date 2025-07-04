// frontend/src/utils/profileCompletion.ts
import { RoommateProfile, User } from "@/types/api";
import { RoommateProfileFormData } from "@/types/roommates";

export const PROFILE_FIELD_WEIGHTS = {
  // Core 5 Fields (60% weight total - 12% each)
  sleepSchedule: 12,
  cleanliness: 12,
  noiseTolerance: 12,
  studyHabits: 12,
  guestPolicy: 12,
  
  // Important Identity (20% weight)
  bio: 8,
  university: 6,
  major: 6,
  
  // Deal Breakers (10% weight)
  dealBreakers: 10,
  
  // Nice to have (10% weight)
  hobbies: 2,
  socialActivities: 2,
  languages: 2,
  hasImages: 4,
  
  // Optional fields (removed or minimal weight)
  // Removed: emergencyContact, workSchedule, additionalInfo, preferredLocations
};

export function calculateProfileCompletion(
  formData: any, 
  user?: User | null
): number {
  const totalWeight = Object.values(PROFILE_FIELD_WEIGHTS).reduce((a, b) => a + b, 0);
  let completedWeight = 0;
  
  Object.entries(PROFILE_FIELD_WEIGHTS).forEach(([field, weight]) => {
    let value;
    let isComplete = false;
    
    // Special handling for images
    if (field === 'hasImages') {
      value = formData.images || formData.imageCount;
      isComplete = (Array.isArray(value) && value.length > 0) || 
                  (typeof value === 'number' && value > 0);
    }
    // Get value from user object for academic fields
    else if (['university', 'major'].includes(field)) {
      if (field === 'university') {
        value = formData.university || user?.university?.id;
      } else if (field === 'major') {
        // Handle both 'major' and 'program' field names
        value = formData.major || formData.program || user?.program;
      }
    } else {
      value = formData[field];
    }
    
    // Check completion logic
    if (field === 'hasImages') {
      // Already handled above
    } else if (['hobbies', 'socialActivities', 'languages', 'dealBreakers'].includes(field)) {
      isComplete = Array.isArray(value) && value.length > 0;
    } else if (typeof value === 'string') {
      isComplete = !!value && value.trim().length > 0;
    } else if (typeof value === 'number') {
      isComplete = value !== null && value !== undefined && value > 0;
    } else {
      isComplete = value !== null && value !== undefined;
    }
    
    if (isComplete) {
      completedWeight += weight;
    }
  });
  
  return Math.round((completedWeight / totalWeight) * 100);
}

export function getMissingCoreFields(
  formData: any,
  user?: User | null
): string[] {
  const coreFields = ['sleepSchedule', 'cleanliness', 'noiseTolerance', 'studyHabits', 'guestPolicy'];
  const missing: string[] = [];
  
  coreFields.forEach(field => {
    const value = formData[field];
    const isEmpty = 
      value === null || 
      value === undefined || 
      (typeof value === 'string' && !value.trim());
    
    if (isEmpty) {
      missing.push(field);
    }
  });
  
  return missing;
}

export function getCompletionLevel(percentage: number): string {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 70) return 'good';
  if (percentage >= 60) return 'basic'; // Has core 5
  if (percentage >= 40) return 'minimal';
  return 'incomplete';
}

export function getNextMilestone(percentage: number): { target: number; reward: string } | null {
  if (percentage < 60) {
    return {
      target: 60,
      reward: 'Unlock basic matching - complete the core 5 fields'
    };
  }
  if (percentage < 70) {
    return {
      target: 70,
      reward: 'Unlock full profiles - add your bio and university'
    };
  }
  if (percentage < 90) {
    return {
      target: 90,
      reward: 'Unlock priority matching - add deal breakers'
    };
  }
  if (percentage < 100) {
    return {
      target: 100,
      reward: 'Perfect profile - maximum visibility'
    };
  }
  return null;
}

// Helper to convert profile to form data (removing deleted fields)
export function convertProfileToFormData(
  profile: RoommateProfile,
  user?: User | null
): Partial<RoommateProfileFormData> {
  return {
    // Core 5
    sleepSchedule: profile.sleepSchedule,
    cleanliness: profile.cleanliness,
    noiseTolerance: profile.noiseTolerance,
    studyHabits: profile.studyHabits,
    guestPolicy: profile.guestPolicy,
    
    // Identity
    bio: profile.bio,
    nickname: profile.nickname,
    gender: profile.gender,
    
    // Academic (from user or profile)
    university: profile.university?.id || user?.university?.id,
    major: profile.major || user?.program,
    year: profile.year,
    
    // Housing preferences
    budgetMin: profile.budgetMin,
    budgetMax: profile.budgetMax,
    moveInDate: profile.moveInDate,
    housingType: profile.housingType,
    
    // Deal breakers (now predefined choices)
    dealBreakers: profile.dealBreakers,
    
    // Lifestyle
    petFriendly: profile.petFriendly,
    smokingAllowed: profile.smokingAllowed,
    hobbies: profile.hobbies || [],
    socialActivities: profile.socialActivities || [],
    dietaryRestrictions: profile.dietaryRestrictions || [],
    languages: profile.languages || [],
    
    // Preferences
    preferredRoommateGender: profile.preferredRoommateGender,
    ageRangeMin: profile.ageRangeMin,
    ageRangeMax: profile.ageRangeMax || undefined,
    preferredRoommateCount: profile.preferredRoommateCount,
    
    // Privacy settings
    profileVisibleTo: profile.profileVisibleTo,
    contactVisibleTo: profile.contactVisibleTo,
    imagesVisibleTo: profile.imagesVisibleTo,
  };
}

// Helper to get user-friendly field names
export function getFieldDisplayName(field: string): string {
  const displayNames: Record<string, string> = {
    // Core 5
    sleepSchedule: 'Sleep Schedule',
    cleanliness: 'Cleanliness Level',
    noiseTolerance: 'Noise Tolerance',
    studyHabits: 'Study Habits',
    guestPolicy: 'Guest Policy',
    
    // Identity
    bio: 'About You',
    university: 'University',
    major: 'Field of Study',
    
    // Other
    dealBreakers: 'Deal Breakers',
    hasImages: 'Profile Photos',
    hobbies: 'Hobbies',
    socialActivities: 'Social Activities',
    languages: 'Languages',
    
    // Preferences
    preferredRoommateGender: 'Roommate Gender Preference',
    ageRangeMin: 'Minimum Age',
    ageRangeMax: 'Maximum Age',
    budgetMin: 'Minimum Budget',
    budgetMax: 'Maximum Budget',
    moveInDate: 'Move-in Date',
  };
  
  return displayNames[field] || field;
}