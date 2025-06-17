// Base interfaces - updated to use camelCase consistently
export interface User {
  id: number;
  username: string;
  email: string;
  userType: 'student' | 'property_owner' | 'admin';
  firstName?: string;
  lastName?: string;
  phone?: string;
  hasCompleteProfile?: boolean;
  profilePicture?: string;
  university?: University;
  graduationYear?: number;
  program?: string;
  studentIdVerified?: boolean;
  verificationStatus?: boolean;
  businessName?: string;
  businessRegistration?: string;
  dateOfBirth?: string;  // Add this line
  age?: number;  // Add this line
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
  studentPopulation?: number; // Changed from student_population
}

export interface PropertyImage {
  id: number;
  image: string;
  isMain: boolean; // Changed from is_main
  caption?: string;
  order: number;
}

export interface UniversityProximity {
  id: number;
  university: University;
  distanceInMeters: number; // Changed from distance_in_meters
  walkingTimeMinutes: number; // Changed from walking_time_minutes
  publicTransportTimeMinutes?: number; // Changed from public_transport_time_minutes
}

export interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  propertyType: 'apartment' | 'house' | 'room' | 'studio' | 'other'; // Changed from property_type
  bedrooms: number;
  bathrooms: number;
  totalArea: number; // Changed from total_area
  furnished: boolean;
  amenities: string[];
  rules: string[];
  rentAmount: number; // Changed from rent_amount
  depositAmount: number; // Changed from deposit_amount
  paymentFrequency: 'monthly' | 'bimonthly' | 'quarterly' | 'yearly'; // Changed from payment_frequency
  includedUtilities: string[]; // Changed from included_utilities
  availableFrom: string; // Changed from available_from
  minimumStay: number; // Changed from minimum_stay
  maximumStay?: number; // Changed from maximum_stay
  owner: User;
  ownerName?: string; // Changed from owner_name
  isActive: boolean; // Changed from is_active
  isVerified: boolean; // Changed from is_verified
  isFeatured: boolean; // Changed from is_featured
  createdAt: string; // Changed from created_at
  updatedAt: string; // Changed from updated_at
  images: PropertyImage[];
  universityProximities: UniversityProximity[]; // Changed from university_proximities
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
  propertyCount: number; // Changed from property_count
  activeViewingRequests: number; // Changed from active_viewing_requests
  unreadMessages: number; // Changed from unread_messages
  recentActivity: { // Changed from recent_activity
    messages: any[];
    viewingRequests: any[]; // Changed from viewing_requests
  };
}

export interface RoommateProfile {
  id: number;
  user: User;
  
  // Basic Info
  bio?: string;
  age?: number;  // Computed from user.dateOfBirth on backend
  gender?: 'male' | 'female' | 'other';
  major?: string;
  year?: number; // Academic year (1-5)
  graduationYear?: number;
  
  // Lifestyle
  sleepSchedule?: 'early_bird' | 'night_owl' | 'average';
  cleanliness?: 1 | 2 | 3 | 4 | 5;
  noiseTolerance?: 1 | 2 | 3 | 4 | 5;
  guestPolicy?: 'rarely' | 'occasionally' | 'frequently';
  studyHabits?: string;
  workSchedule?: string;
  
  // Housing Preferences
  budgetMin?: number;
  budgetMax?: number;
  moveInDate?: string;
  leaseDuration?: string;
  preferredLocations?: string[];
  housingType?: string;
  
  // Compatibility
  petFriendly: boolean;
  smokingAllowed: boolean;
  dietaryRestrictions: string[];
  languages: string[];
  hobbies: string[];
  socialActivities: string[];
  
  // Roommate Preferences
  preferredRoommateGender: 'male' | 'female' | 'other' | 'no_preference';
  ageRangeMin?: number;
  ageRangeMax?: number | null;
  preferredRoommateCount: number;
  
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
}

export interface RoommateProfileImage {
  id: number;
  image: string;
  url: string;
  isPrimary: boolean;
  order: number;
  uploadedAt: string;
  isApproved?: boolean;
  // Note: isDeleted is not persisted from backend, only used in frontend for UI state
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
  totalCount: number; // Changed from total_count (camelCase)
  yourProfileCompletion: number; // Changed from your_profile_completion
}

export interface ImageReportRequest {
  imageId: number;
  reason: 'inappropriate' | 'fake' | 'offensive' | 'spam' | 'other';
  description?: string;
}