// frontend/src/types/roommates.ts

export interface RoommateProfileFormData {
    // Name fields
    firstName?: string;
    lastName?: string;
    nickname?: string;

    // Basic Information
    bio: string;
    gender: 'male' | 'female' | 'other' | undefined;  // Made more specific
    dateOfBirth?: string;  // ISO date string
    university?: number;
    program: string;
    graduationYear: number;

    // Living Preferences
    budgetMin?: number;
    budgetMax?: number;
    moveInDate?: string;
    leaseDuration?: '1_month' | '3_months' | '6_months' | '12_months' | 'flexible';  // Made specific
    preferredLocations: string[];
    housingType?: 'apartment' | 'house' | 'room' | 'shared_room' | 'other';  // Made specific

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
    emergencyContactRelation?: 'parent' | 'sibling' | 'friend' | 'guardian' | 'partner' | 'other';  // Made specific
    additionalInfo?: string;

    // Privacy Settings - Made specific
    profileVisibleTo?: 'everyone' | 'matches_only' | 'nobody';
    contactVisibleTo?: 'everyone' | 'matches_only' | 'nobody';
    imagesVisibleTo?: 'everyone' | 'matches_only' | 'nobody';

    // Images
    images?: ImageData[];
    existingImageIds?: number[];
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

// State types for the edit form
export interface BasicInfoState {
    firstName: string;
    lastName: string;
    nickname: string;
    bio: string;
    gender: 'male' | 'female' | 'other' | undefined;
    program: string;
    graduationYear: number;
    sleepSchedule: 'early_bird' | 'night_owl' | 'average';
}

export interface LifestyleState {
    cleanliness: 1 | 2 | 3 | 4 | 5;
    noiseTolerance: 1 | 2 | 3 | 4 | 5;
    guestPolicy: "rarely" | "occasionally" | "frequently";
    studyHabits: string;
    workSchedule: string;
}

export interface PreferencesState {
    petFriendly: boolean;
    smokingAllowed: boolean;
    dietaryRestrictions: string[];
    languages: string[];
}

export interface SocialState {
    hobbies: string[];
    socialActivities: string[];
}

export interface RoommatePreferencesState {
    preferredRoommateGender: "male" | "female" | "other" | "no_preference";
    ageRangeMin: number;
    ageRangeMax: number | null;
    preferredRoommateCount: number;
}

export interface HousingState {
    budgetMin: number;
    budgetMax: number;
    moveInDate: string;
    leaseDuration: '1_month' | '3_months' | '6_months' | '12_months' | 'flexible';
    preferredLocations: string[];
    housingType: 'apartment' | 'house' | 'room' | 'shared_room' | 'other';
}

export interface AdditionalState {
    personality: string[];
    dealBreakers: string[];
    sharedInterests: string[];
    additionalInfo: string;
}

export interface EmergencyContactState {
    name: string;
    phone: string;
    relationship: 'parent' | 'sibling' | 'friend' | 'guardian' | 'partner' | 'other' | undefined;
}

export interface PrivacyState {
    profileVisibleTo: 'everyone' | 'matches_only' | 'nobody';
    contactVisibleTo: 'everyone' | 'matches_only' | 'nobody';
    imagesVisibleTo: 'everyone' | 'matches_only' | 'nobody';
}