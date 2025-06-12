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
    
    // Get value from user object for academic fields
    if (['university', 'program', 'graduationYear'].includes(field)) {
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
    
    // Check completion logic (same as before)
    if (field === 'petFriendly' || field === 'smokingAllowed') {
      isComplete = value !== null && value !== undefined;
    } else if (['hobbies', 'socialActivities', 'languages'].includes(field)) {
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
    program: user?.program || profile.major,  // profile.major is now a property that returns user.program
    graduationYear: user?.graduationYear || profile.year,
    
    // RoommateProfile fields
    sleepSchedule: profile.sleepSchedule,
    bio: profile.bio,
    cleanliness: profile.cleanliness,
    noiseTolerance: profile.noiseTolerance,
    guestPolicy: profile.guestPolicy,
    studyHabits: profile.studyHabits,
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
  };
  
  return displayNames[field] || field;
}