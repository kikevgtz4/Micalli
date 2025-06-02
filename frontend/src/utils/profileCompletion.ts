// frontend/src/utils/profileCompletion.ts (NEW FILE)
export const PROFILE_FIELD_WEIGHTS = {
  // Required fields (60% weight)
  sleepSchedule: 4,
  cleanliness: 4,
  noiseTolerance: 4,
  guestPolicy: 4,
  major: 4,
  year: 4,
  bio: 4,
  university: 4,
  preferredRoommateGender: 4,
  
  // Optional but important (30% weight)
  studyHabits: 3,
  petFriendly: 2,
  smokingAllowed: 2,
  ageRangeMin: 2,
  ageRangeMax: 2,
  preferredRoommateCount: 2,
  
  // Nice to have (10% weight)
  hobbies: 1,
  socialActivities: 1,
  dietaryRestrictions: 1,
  languages: 1,
};

export function calculateProfileCompletion(formData: any): number {
  const totalWeight = Object.values(PROFILE_FIELD_WEIGHTS).reduce((a, b) => a + b, 0);
  let completedWeight = 0;
  
  Object.entries(PROFILE_FIELD_WEIGHTS).forEach(([field, weight]) => {
    const value = formData[field];
    let isComplete = false;
    
    if (field === 'petFriendly' || field === 'smokingAllowed') {
      isComplete = value !== null && value !== undefined;
    } else if (['hobbies', 'socialActivities', 'languages'].includes(field)) {
      isComplete = Array.isArray(value) && value.length > 0;
    } else if (field === 'dietaryRestrictions') {
      isComplete = value !== null && value !== undefined;
    } else if (typeof value === 'string') {
      isComplete = !!(value && value.trim());
    } else {
      isComplete = value !== null && value !== undefined;
    }
    
    if (isComplete) {
      completedWeight += weight;
    }
  });
  
  return Math.round((completedWeight / totalWeight) * 100);
}