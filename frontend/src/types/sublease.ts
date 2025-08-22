// frontend/src/types/sublease.ts
import { User } from './api';

// Constants
export const MAX_SUBLEASES_PER_USER = 1;
export const MAX_SUBLEASE_IMAGES = 7;
export const MIN_SUBLEASE_IMAGES = 3;
export const MAX_SUBLEASE_DURATION_MONTHS = 12;

// Type literals (matching your pattern from roommates.ts)
export type ListingType = 'summer' | 'semester' | 'temporary' | 'takeover';
export type SubleaseType = 'entire_place' | 'private_room' | 'shared_room';
export type SubleaseStatus = 'draft' | 'active' | 'pending' | 'filled' | 'expired' | 'cancelled';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';
export type ConsentStatus = 'not_required' | 'confirmed' | 'documented' | 'verified';
export type PropertyType = 'apartment' | 'house' | 'studio' | 'dorm' | 'condo';
export type RoommateGenders = 'all_male' | 'all_female' | 'mixed' | 'prefer_not_say';

// Interfaces
export interface SubleaseImage {
  id: number;
  image: string;
  thumbnailUrl?: string;
  cardDisplayUrl?: string;
  isMain: boolean;
  caption?: string;
  order: number;
  uploadedAt: string;
}

export interface SubleaseUniversityProximity {
  id: number;
  university: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  };
  distanceInMeters: number;
  distanceInKm: string;
  walkingTimeMinutes?: number;
  drivingTimeMinutes?: number;
}

export interface Sublease {
  id: number;
  user: User;
  
  // Type fields
  listingType: ListingType;
  subleaseType: SubleaseType;
  propertyType: PropertyType;
  
  // Status fields
  status: SubleaseStatus;
  urgencyLevel: UrgencyLevel;
  
  // Temporal fields
  startDate: string;
  endDate: string;
  isFlexible: boolean;
  flexibilityRangeDays?: number;
  availableImmediately: boolean;
  
  // Location fields
  address: string;
  displayNeighborhood: string;
  displayArea: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  approxLatitude?: number;
  approxLongitude?: number;
  privacyRadius: number;
  
  // Financial fields
  originalRent: number;
  subleaseRent: number;
  depositRequired: boolean;
  depositAmount?: number;
  utilitiesIncluded: string[];
  additionalFees?: Record<string, number>;
  
  // Property details
  title: string;
  description: string;
  additionalInfo?: string;
  bedrooms?: number;
  bathrooms?: number;
  totalArea?: number;
  furnished: boolean;
  amenities: string[];
  petFriendly: boolean;
  smokingAllowed: boolean;
  
  // Roommate information
  totalRoommates?: number;
  currentRoommates?: number;
  roommateGenders?: RoommateGenders;
  roommateDescription?: string;
  sharedSpaces?: string[];
  
  // Legal & Verification
  landlordConsentStatus: ConsentStatus;
  landlordConsentDocument?: string;
  leaseTransferAllowed: boolean;
  subleaseAgreementRequired: boolean;
  disclaimersAccepted: boolean;
  disclaimersAcceptedAt?: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: User;
  
  // Metrics
  viewsCount: number;
  savedCount: number;
  inquiryCount: number;
  
  // Relations
  mainImage?: SubleaseImage;
  images: SubleaseImage[];
  universityProximities: SubleaseUniversityProximity[];
  
  // Computed fields
  discountPercentage?: number;
  durationMonths?: number;
  isUrgent?: boolean;
  isSaved?: boolean;  // ADD THIS LINE
  canEdit?: boolean;  // ADD THIS LINE (for consistency)
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
}

export interface SubleaseApplication {
  id: number;
  sublease: number;
  subleaseTitle?: string;
  applicant: User;
  moveInDate: string;
  message: string;
  phone?: string;
  email?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
}

export interface SubleaseSave {
  id: number;
  user: User;
  sublease: Sublease;
  savedAt: string;
}

// Form interfaces (consistent with roommates.ts pattern)
export interface SubleaseFormData {
  // Step 1: Type
  listingType: ListingType | '';
  subleaseType: SubleaseType | '';
  
  // Step 2: Basics
  title: string;
  description: string;
  additionalInfo?: string;
  
  // Step 3: Dates
  startDate: string;
  endDate: string;
  isFlexible: boolean;
  flexibilityRangeDays: number;
  availableImmediately: boolean;
  urgencyLevel: UrgencyLevel | '';
  
  // Step 4: Property
  propertyType: PropertyType | '';
  address: string;
  latitude?: string;  // ADD THIS
  longitude?: string; // ADD THIS
  displayNeighborhood?: string; // ADD THIS
  displayArea?: string; // ADD THIS
  bedrooms?: number;
  bathrooms?: number;
  totalArea?: number;
  furnished: boolean;
  amenities: string[];
  petFriendly: boolean;
  smokingAllowed: boolean;
  
  // Step 5: Roommates (conditional)
  totalRoommates?: number;
  currentRoommates?: number;
  roommateGenders?: RoommateGenders | '';
  roommateDescription?: string;
  sharedSpaces?: string[];
  
  // Step 6: Pricing
  originalRent: number;
  subleaseRent: number;
  depositRequired: boolean;
  depositAmount?: number;
  utilitiesIncluded: string[];
  additionalFees?: Record<string, number>;
  
  // Step 7: Photos
  images?: File[];
  
  // Step 8: Legal
  landlordConsentStatus: ConsentStatus | '';
  landlordConsentDocument?: File;
  leaseTransferAllowed: boolean;
  subleaseAgreementRequired: boolean;
  disclaimersAccepted: boolean;
}

// Filter interfaces (matching filters.ts pattern)
export interface SubleaseFilters {
  search?: string;
  subleaseType?: SubleaseType[] | string;  // Array or comma-separated
  listingType?: ListingType[] | string;
  minRent?: number;
  maxRent?: number;
  startDateAfter?: string;
  startDateBefore?: string;
  endDateAfter?: string;
  endDateBefore?: string;
  urgencyLevel?: UrgencyLevel[] | string;
  furnished?: boolean;
  petFriendly?: boolean;
  smokingAllowed?: boolean;
  universityId?: number;
  distanceKm?: number;
  bedrooms?: number;
  bathrooms?: number;
  page?: number;
  pageSize?: number;
  ordering?: string;
}

// Dashboard interfaces
export interface SubleaseDashboardStats {
  activeSubleases: number;
  pendingApplications: number;
  totalApplications: number;
  unreadMessages: number;
  profileViews: number;
  responseRate: number;
  savedCount: number;
  viewsThisWeek: number;
}

// Response interfaces (matching api.ts pattern)
export interface SubleaseListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Sublease[];
}

export interface SubleaseApplicationResponse {
  count: number;
  results: SubleaseApplication[];
}

// Validation helpers
export const isUrgentSublease = (urgencyLevel: UrgencyLevel): boolean => {
  return urgencyLevel === 'urgent';
};

export const isHighUrgencySublease = (urgencyLevel: UrgencyLevel): boolean => {
  return urgencyLevel === 'high';
};

export const shouldShowUrgencyIndicator = (urgencyLevel: UrgencyLevel): boolean => {
  return urgencyLevel === 'urgent' || urgencyLevel === 'high';
};

export const calculateSavings = (originalRent: number, subleaseRent: number): number => {
  return Math.max(0, originalRent - subleaseRent);
};

export const calculateDurationMonths = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.round(diffDays / 30);
};

export const formatDuration = (months: number): string => {
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
};