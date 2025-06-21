// frontend/src/types/roommates.ts

// Core enums for the streamlined profile
export type SleepSchedule = 'early_bird' | 'night_owl' | 'flexible';
export type StudyHabits = 'quiet' | 'social' | 'flexible';
export type GuestPolicy = 'rarely' | 'occasionally' | 'frequently';
export type DealBreaker = 
  | 'no_smoking'
  | 'no_pets'
  | 'same_gender_only'
  | 'quiet_study_required'
  | 'no_overnight_guests';

// Quick setup data - only core 5 fields
export interface QuickProfileData {
  sleepSchedule: SleepSchedule;
  cleanliness: number;
  noiseTolerance: number;
  studyHabits: StudyHabits;
  guestPolicy: GuestPolicy;
}

// Response types
export interface QuickSetupResponse {
  profile: any; // Will be RoommateProfile from api.ts
  matchCount: number;
  message: string;
}

export interface OnboardingStatusResponse {
  hasProfile: boolean;
  onboardingCompleted: boolean;
  completionStatus: {
    percentage: number;
    isComplete: boolean;
    isReadyForMatching: boolean;
    missingCoreFields: string[];
    level: 'excellent' | 'good' | 'basic' | 'minimal' | 'incomplete';
    nextMilestone?: {
      target: number;
      reward: string;
    };
  };
  coreFieldsComplete: boolean;
}

// Form data for profile creation/editing
export interface RoommateProfileFormData {
  // Core 5
  sleepSchedule?: string;
  cleanliness?: string | number;
  noiseTolerance?: string | number;
  studyHabits?: string;
  guestPolicy?: string;
  
  // Identity & Bio
  nickname?: string;
  bio?: string;
  gender?: string;
  
  // Academic (synced from User)
  university?: number;
  major?: string;
  year?: number;
  graduationYear?: number;
  
  // Housing (optional)
  budgetMin?: string | number;
  budgetMax?: string | number;
  moveInDate?: string;
  leaseDuration?: string;
  housingType?: string;
  
  // Deal breakers (predefined choices)
  dealBreakers?: DealBreaker[];
  
  // Lifestyle (optional)
  petFriendly?: boolean;
  smokingAllowed?: boolean;
  hobbies?: string[];
  socialActivities?: string[];
  dietaryRestrictions?: string[];
  languages?: string[];
  personality?: string[];
  sharedInterests?: string[];
  
  // Preferences (optional)
  preferredRoommateGender?: string;
  ageRangeMin?: number;
  ageRangeMax?: number;
  preferredRoommateCount?: number;
  
  // Privacy (optional)
  profileVisibleTo?: string;
  contactVisibleTo?: string;
  imagesVisibleTo?: string;
  
  // Images
  images?: ImageData[];
  imageCount?: number;
  existingImageIds?: number[];
}

// Step component props
export interface StepProps {
  data: Partial<RoommateProfileFormData>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

// Form state interfaces for edit page
export interface BasicInfoState {
  bio: string;
  gender: string;
  major: string;
  year: number | null;
  nickname: string;
}

export interface LifestyleState {
  sleepSchedule: SleepSchedule | '';
  cleanliness: 1 | 2 | 3 | 4 | 5;
  noiseTolerance: 1 | 2 | 3 | 4 | 5;
  guestPolicy: GuestPolicy | '';
  studyHabits: StudyHabits | '';
}

export interface HousingState {
  budgetMin: number;
  budgetMax: number;
  moveInDate: string;
  leaseDuration: '1_month' | '3_months' | '6_months' | '12_months' | 'flexible';
  housingType: 'apartment' | 'house' | 'room' | 'shared_room' | 'other';
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
  preferredRoommateGender: 'male' | 'female' | 'other' | 'no_preference';
  ageRangeMin: number;
  ageRangeMax: number | null;
  preferredRoommateCount: number;
}

export interface AdditionalState {
  personality: string[];
  dealBreakers: DealBreaker[];
  sharedInterests: string[];
}

export interface PrivacyState {
  profileVisibleTo: 'everyone' | 'matches_only' | 'nobody';
  contactVisibleTo: 'everyone' | 'matches_only' | 'nobody';
  imagesVisibleTo: 'everyone' | 'matches_only' | 'connected_only';
}

// Image handling types
export interface ImageData {
  id: string;
  file?: File;
  url?: string;
  isPrimary: boolean;
  order: number;
  isDeleted?: boolean;
  isExisting?: boolean;  // For distinguishing between existing and new images
  serverId?: number;
}