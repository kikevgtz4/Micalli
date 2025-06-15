// frontend/src/types/roommates.ts
export interface RoommateProfileFormData {
    // Basic Info (from User model)
    university?: number | null;
    program?: string;  // This is 'major' in the UI
    graduationYear?: number;
    
    // Basic Info (from RoommateProfile)
    sleepSchedule?: 'early_bird' | 'night_owl' | 'average';
    bio?: string;
    
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

    // Images
    images?: ImageData[];
}

// Also add the ImageData interface
export interface ImageData {
    id: string;
    file?: File;
    url?: string;
    isPrimary: boolean;
    order: number;
    isExisting?: boolean;
}

export interface StepProps {
  data: Partial<RoommateProfileFormData>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}