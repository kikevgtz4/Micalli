// frontend/src/utils/profileCompletion.ts
import { RoommateProfile, User } from "@/types/api";
import { RoommateProfileFormData } from "@/types/roommates";

export const PROFILE_FIELD_WEIGHTS = {
  // User model fields (these come from User, not RoommateProfile)
  university: 4,
  program: 4,  // Changed from 'major' to match User model
  graduationYear: 4,  // Changed from 'year'
  
  // RoommateProfile fields
  sleepSchedule: 4,
  cleanliness: 4,
  noiseTolerance: 4,
  guestPolicy: 4,
  bio: 4,
  preferredRoommateGender: 4,
  
  // Optional but important
  studyHabits: 3,
  petFriendly: 2,
  smokingAllowed: 2,
  ageRangeMin: 2,
  ageRangeMax: 2,
  preferredRoommateCount: 2,
  
  // Nice to have
  hobbies: 1,
  socialActivities: 1,
  dietaryRestrictions: 1,
  languages: 1,
  
  // New fields - Additional Preferences
  personality: 2,
  dealBreakers: 3,  // More important
  sharedInterests: 2,
  additionalInfo: 1,
  
  // Housing preferences
  budgetMin: 3,
  budgetMax: 3,
  moveInDate: 2,
  preferredLocations: 2,
  
  // Emergency contact (optional but good to have)
  emergencyContactName: 1,
  emergencyContactPhone: 1,
  
  // Images
  hasImages: 3,  // Having at least one image
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
    else if (['university', 'program', 'graduationYear'].includes(field)) {
      // Check both formData and user object
      if (field === 'university') {
        value = formData.university || user?.university?.id;
      } else {
        value = formData[field] || (user as any)?.[field];
      }
    } else {
      // RoommateProfile fields come from formData
      value = formData[field];
    }
    
    // Check completion logic
    if (field === 'hasImages') {
      // Already handled above
    } else if (field === 'petFriendly' || field === 'smokingAllowed') {
      isComplete = value !== null && value !== undefined;
    } else if (['hobbies', 'socialActivities', 'languages', 'personality', 
                'dealBreakers', 'sharedInterests', 'preferredLocations'].includes(field)) {
      isComplete = Array.isArray(value) && value.length > 0;
    } else if (field === 'dietaryRestrictions') {
      isComplete = value !== null && value !== undefined;
    } else if (typeof value === 'string') {
      isComplete = !!(value && value.trim());
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

export function convertProfileToFormData(
  profile: RoommateProfile,
  user?: User | null
): Partial<RoommateProfileFormData> {
  const formData: Partial<RoommateProfileFormData> = {
    // Academic fields from user or profile's user reference
    university: user?.university?.id || profile.university?.id,
    program: user?.program || profile.major,
    graduationYear: profile.graduationYear || user?.graduationYear,
    
    // RoommateProfile fields
    sleepSchedule: profile.sleepSchedule,
    bio: profile.bio,
    gender: profile.gender,
    dateOfBirth: profile.user?.dateOfBirth || user?.dateOfBirth,
    cleanliness: profile.cleanliness,
    noiseTolerance: profile.noiseTolerance,
    guestPolicy: profile.guestPolicy,
    studyHabits: profile.studyHabits,
    workSchedule: profile.workSchedule,
    petFriendly: profile.petFriendly,
    smokingAllowed: profile.smokingAllowed,
    hobbies: profile.hobbies,
    socialActivities: profile.socialActivities,
    dietaryRestrictions: profile.dietaryRestrictions,
    languages: profile.languages,
    preferredRoommateGender: profile.preferredRoommateGender,
    ageRangeMin: profile.ageRangeMin,
    ageRangeMax: profile.ageRangeMax,
    preferredRoommateCount: profile.preferredRoommateCount,
    
    // Housing preferences
    budgetMin: profile.budgetMin,
    budgetMax: profile.budgetMax,
    moveInDate: profile.moveInDate,
    leaseDuration: profile.leaseDuration,
    preferredLocations: profile.preferredLocations || [],
    housingType: profile.housingType,
    
    // New fields
    personality: profile.personality || [],
    dealBreakers: profile.dealBreakers || [],
    sharedInterests: profile.sharedInterests || [],
    additionalInfo: profile.additionalInfo,
    emergencyContactName: profile.emergencyContactName,
    emergencyContactPhone: profile.emergencyContactPhone,
    emergencyContactRelation: profile.emergencyContactRelation,
    
    // Privacy settings
    profileVisibleTo: profile.profileVisibleTo,
    contactVisibleTo: profile.contactVisibleTo,
    imagesVisibleTo: profile.imagesVisibleTo,
  };
  
  return formData;
}

// Helper function to get missing required fields (useful for UI)
export function getMissingRequiredFields(
  formData: any,
  user?: User | null
): string[] {
  const missing: string[] = [];
  const requiredFields = Object.entries(PROFILE_FIELD_WEIGHTS)
    .filter(([_, weight]) => weight >= 4) // Fields with weight 4 are required
    .map(([field]) => field);
  
  requiredFields.forEach(field => {
    let value;
    
    // Get value from appropriate source
    if (['university', 'program', 'graduationYear'].includes(field)) {
      if (field === 'university') {
        value = formData.university || user?.university?.id;
      } else {
        value = formData[field] || (user as any)?.[field];
      }
    } else {
      value = formData[field];
    }
    
    // Check if missing
    const isEmpty = 
      value === null || 
      value === undefined || 
      (typeof value === 'string' && !value.trim()) ||
      (Array.isArray(value) && value.length === 0);
    
    if (isEmpty) {
      missing.push(field);
    }
  });
  
  return missing;
}

// Helper to get user-friendly field names
export function getFieldDisplayName(field: string): string {
  const displayNames: Record<string, string> = {
    university: 'University',
    program: 'Major/Program',
    graduationYear: 'Graduation Year',
    sleepSchedule: 'Sleep Schedule',
    cleanliness: 'Cleanliness Level',
    noiseTolerance: 'Noise Tolerance',
    guestPolicy: 'Guest Policy',
    bio: 'About You',
    preferredRoommateGender: 'Roommate Gender Preference',
    studyHabits: 'Study Habits',
    petFriendly: 'Pet Preferences',
    smokingAllowed: 'Smoking Preferences',
    ageRangeMin: 'Minimum Age',
    ageRangeMax: 'Maximum Age',
    preferredRoommateCount: 'Number of Roommates',
    hobbies: 'Hobbies',
    socialActivities: 'Social Activities',
    dietaryRestrictions: 'Dietary Restrictions',
    languages: 'Languages',
    // New fields
    personality: 'Personality Traits',
    dealBreakers: 'Deal Breakers',
    sharedInterests: 'Shared Interests',
    additionalInfo: 'Additional Information',
    budgetMin: 'Minimum Budget',
    budgetMax: 'Maximum Budget',
    moveInDate: 'Move-in Date',
    preferredLocations: 'Preferred Locations',
    emergencyContactName: 'Emergency Contact Name',
    emergencyContactPhone: 'Emergency Contact Phone',
    hasImages: 'Profile Photos',
  };
  
  return displayNames[field] || field;
}