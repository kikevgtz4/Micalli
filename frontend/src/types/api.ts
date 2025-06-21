// frontend/src/types/api.ts

// Import types from roommates that are used here
import type { SleepSchedule, StudyHabits, GuestPolicy, DealBreaker } from './roommates';

// Base interfaces - updated to use camelCase consistently
export interface User {
  id: number;
  username: string;
  email: string;
  userType: 'student' | 'property_owner' | 'admin';
  firstName?: string;
  lastName?: string;
  hasCompleteProfile?: boolean;
  profilePicture?: string;
  university?: University;
  graduationYear?: number;
  program?: string;
  studentIdVerified?: boolean;
  emailVerified?: boolean;
  dateOfBirth?: string;
  age?: number;
  // REMOVED: phone (moved to property owner only)
  // REMOVED: businessName, businessRegistration, verificationStatus (moved to PropertyOwner model)
}

export interface University {
  id: number;
  name: string;
  description?: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  studentPopulation?: number;
}

export interface PropertyImage {
  id: number;
  image: string;
  isMain: boolean;
  caption?: string;
  order: number;
}

export interface UniversityProximity {
  id: number;
  university: University;
  distanceInMeters: number;
  walkingTimeMinutes: number;
  publicTransportTimeMinutes?: number;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  propertyType: 'apartment' | 'house' | 'room' | 'studio' | 'other';
  bedrooms: number;
  bathrooms: number;
  totalArea: number;
  furnished: boolean;
  amenities: string[];
  rules: string[];
  rentAmount: number;
  depositAmount: number;
  paymentFrequency: 'monthly' | 'bimonthly' | 'quarterly' | 'yearly';
  includedUtilities: string[];
  availableFrom: string;
  minimumStay: number;
  maximumStay?: number;
  owner: User;
  ownerName?: string;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  images: PropertyImage[];
  universityProximities: UniversityProximity[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PropertyListResponse {
  results: Property[];
  count: number;
  next?: string;
  previous?: string;
}

// Dashboard types
export interface DashboardStats {
  propertyCount: number;
  activeViewingRequests: number;
  unreadMessages: number;
  recentActivity: {
    messages: any[];
    viewingRequests: any[];
  };
}

// Roommate Profile - Updated to match backend changes
export interface RoommateProfile {
  id: number;
  user: User;
  
  // Name fields
  firstName?: string;
  lastName?: string;
  nickname?: string;
  displayName?: string; // computed from nickname || firstName || username
  
  // Basic Info
  bio?: string;
  age?: number;  // Computed from user.dateOfBirth on backend
  gender?: 'male' | 'female' | 'other';
  major?: string;
  year?: number; // Academic year (1-5)
  graduationYear?: number;
  
  // Core 5 Lifestyle Fields (Essential)
  sleepSchedule?: SleepSchedule; // 'early_bird' | 'night_owl' | 'flexible'
  cleanliness?: 1 | 2 | 3 | 4 | 5;
  noiseTolerance?: 1 | 2 | 3 | 4 | 5;
  guestPolicy?: GuestPolicy; // 'rarely' | 'occasionally' | 'frequently'
  studyHabits?: StudyHabits; // 'quiet' | 'social' | 'flexible'
  
  // Housing Preferences
  budgetMin?: number;
  budgetMax?: number;
  moveInDate?: string;
  leaseDuration?: '1_month' | '3_months' | '6_months' | '12_months' | 'flexible';
  housingType?: 'apartment' | 'house' | 'room' | 'shared_room' | 'other';
  // REMOVED: preferredLocations
  
  // Compatibility
  petFriendly: boolean;
  smokingAllowed: boolean;
  dietaryRestrictions: string[];
  languages: string[];
  hobbies: string[];
  socialActivities: string[];
  
  // Deal Breakers - Now predefined choices
  dealBreakers?: DealBreaker[];
  
  // Roommate Preferences
  preferredRoommateGender: 'male' | 'female' | 'other' | 'no_preference';
  ageRangeMin?: number;
  ageRangeMax?: number | null;
  preferredRoommateCount: number;
  
  // Additional fields
  personality?: string[];
  sharedInterests?: string[];
  // REMOVED: additionalInfo
  
  // Meta
  university?: University;
  createdAt: string;
  updatedAt: string;
  completionPercentage?: number;
  profileCompletionPercentage?: number; // Alias for backward compatibility
  missingFields?: string[];
  
  // Images
  images: RoommateProfileImage[];
  primaryImage?: string;
  imageCount: number;
  
  // Privacy settings
  profileVisibleTo?: 'everyone' | 'matches_only' | 'nobody';
  contactVisibleTo?: 'everyone' | 'matches_only' | 'nobody';
  imagesVisibleTo?: 'everyone' | 'matches_only' | 'connected_only';
  
  // System flags
  onboardingCompleted?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  lastMatchCalculation?: string;
  
  // REMOVED: phone, workSchedule, emergencyContactName, emergencyContactPhone, emergencyContactRelation
}

export interface RoommateProfileImage {
  id: number;
  image: string;
  url: string;
  isPrimary: boolean;
  order: number;
  uploadedAt: string;
  isApproved?: boolean;
}

export interface MatchDetails {
  score: number;
  factorBreakdown: Record<string, number>;
  profileCompletion: number;
  recommendation: string;
}

export interface RoommateMatch extends RoommateProfile {
  matchDetails: MatchDetails;
}

export interface CompatibilityResult {
  compatibilityScore: number;
  factorScores: Record<string, number>;
  compatibleTraits: string[];
  incompatibleTraits: string[];
  incompatibleFactors: string[];
  profileCompletion: {
    yours: number;
    theirs: number;
  };
  recommendation: string;
}

export interface FindMatchesResponse {
  matches: RoommateMatch[];
  totalCount: number;
  yourProfileCompletion: number;
}

export interface ImageReportRequest {
  imageId: number;
  reason: 'inappropriate' | 'fake' | 'offensive' | 'spam' | 'other';
  description?: string;
}

// Property Owner Profile (new)
export interface PropertyOwnerProfile {
  id: number;
  user: User;
  businessName: string;
  businessRegistration?: string;
  taxId?: string;
  businessPhone?: string;
  businessAddress?: string;
  establishedYear?: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: User;
  createdAt: string;
  updatedAt: string;
}

// For image uploads
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