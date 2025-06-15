// frontend/src/types/roommates.ts
export interface RoommateProfileFormData {
    // Basic Information
    bio: string;
    age: number;
    gender: string;
    university?: number;
    program: string;
    graduationYear: number;

      // Living Preferences
    budgetMin?: number;
    budgetMax?: number;
    moveInDate?: string;
    leaseDuratio?: string;
    preferredLocations: string[];
    housingType?: string;

    // Lifestyle
    sleepSchedule?: 'early_bird' | 'night_owl' | 'average';
    cleanliness?: 1 | 2 | 3 | 4 | 5;
    noiseTolerance?: 1 | 2 | 3 | 4 | 5;
    guestPolicy?: 'rarely' | 'occasionally' | 'frequently';
    studyHabits?: string;
    workSchedule?: string;
    
      // Compatibility
      petFriendly?: boolean;
      smokingAllowed?: boolean;
      dietaryRestrictions?: string[];
      languages?: string[];
      hobbies?: string[];
      personality?: string[];

  // Roommate Preferences
    ageRangeMin?: number;
    ageRangeMax?: number | null;
    preferredRoommateGender?: 'male' | 'female' | 'other' | 'no_preference';
    preferredRoommateCount?: number;
    dealBreakers?: string[];
    sharedInterests?: string[];

  // Additional
    socialActivities?: string[];
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    additionalInfo?: string;

    // Privacy Settings
    profileVisibleTo?: string;
    contactVisibleTo?: string;
    imagesVisibleTo?: string;

    // Images
    images?: ImageData[];
    existingImageIds?: number[]; // IDs of existing images to keep
}

export interface ImageData {
    id: string; // Temporary ID for new uploads, prefixed ID for existing
    file?: File; // Only for new uploads
    url?: string; // Preview URL or server URL
    isPrimary: boolean;
    order: number;
    isExisting?: boolean; // True if image already exists on server
    serverId?: number; // Actual server ID for existing images
    isDeleted?: boolean; // Mark for deletion without removing from array
}

export interface StepProps {
  data: Partial<RoommateProfileFormData>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}