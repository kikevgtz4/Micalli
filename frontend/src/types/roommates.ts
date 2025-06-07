// frontend/src/types/roommates.ts (create this new file)

// This keeps all roommate-related types together in your global types folder
export interface RoommateProfileFormData {
    // Basic Info
    sleepSchedule?: 'early_bird' | 'night_owl' | 'average';
    major?: string;
    year?: number;
    bio?: string;
    university?: number | null;
    
    // Lifestyle
    cleanliness?: 1 | 2 | 3 | 4 | 5;
    noiseTolerance?: 1 | 2 | 3 | 4 | 5;
    guestPolicy?: 'rarely' | 'occasionally' | 'frequently';
    studyHabits?: string;
    
    // Preferences
    petFriendly?: boolean;
    smokingAllowed?: boolean;
    dietaryRestrictions?: string[];
    languages?: string[];
    
    // Social
    hobbies?: string[];
    socialActivities?: string[];
    
    // Roommate Preferences
    preferredRoommateGender?: 'male' | 'female' | 'other' | 'no_preference';
    ageRangeMin?: number;
    ageRangeMax?: number | null;
    preferredRoommateCount?: number;
}

export interface StepProps {
  data: Partial<RoommateProfileFormData>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}