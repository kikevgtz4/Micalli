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
  // Add id for existing profiles
  id?: number;
  
  // Core 5 (make these required for the form)
  sleepSchedule: string;  // Remove the optional
  cleanliness: number;    // Change from string | number to just number
  noiseTolerance: number; // Change from string | number to just number
  studyHabits: string;    // Remove the optional
  guestPolicy: string;    // Remove the optional
  
  // Identity & Bio (add firstName/lastName from User)
  firstName?: string;     // Add this
  lastName?: string;      // Add this
  nickname?: string;
  bio?: string;
  gender?: string;
  dateOfBirth?: string; // ISO date string from user
  
  // Academic (synced from User)
  university?: number;
  major?: string;
  year?: number;
  graduationYear?: number;
  
  // Housing (keep as optional)
  budgetMin?: number;     // Change to just number
  budgetMax?: number;     // Change to just number
  moveInDate?: string;
  leaseDuration?: string;
  housingType?: string;
  
  // Deal breakers (change to string[] for flexibility)
  dealBreakers?: string[];  // Change from DealBreaker[] to string[]
  
  // Lifestyle (keep as optional)
  petFriendly?: boolean;
  smokingAllowed?: boolean;
  hobbies?: string[];
  socialActivities?: string[];
  dietaryRestrictions?: string[];
  languages?: string[];
  personality?: string[];
  sharedInterests?: string[];
  
  // Preferences (keep as optional)
  preferredRoommateGender?: string;
  ageRangeMin?: number;
  ageRangeMax?: number;
  preferredRoommateCount?: number;
  
  // Privacy (keep as optional)
  profileVisibleTo?: string;
  contactVisibleTo?: string;
  imagesVisibleTo?: string;
  
  // Images (use your existing ImageData type)
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