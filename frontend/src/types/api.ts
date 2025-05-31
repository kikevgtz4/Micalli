// Base interfaces - updated to use camelCase consistently
export interface User {
  id: number;
  username: string;
  email: string;
  userType: 'student' | 'property_owner' | 'admin'; // Changed from user_type
  firstName?: string; // Changed from first_name
  lastName?: string; // Changed from last_name
  phone?: string;
  hasCompleteProfile?: boolean;
  profilePicture?: string; // Changed from profile_picture
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
  sleepSchedule?: 'early_bird' | 'night_owl' | 'average';
  cleanliness?: 1 | 2 | 3 | 4 | 5;
  noiseTolerance?: 1 | 2 | 3 | 4 | 5;
  guestPolicy?: 'rarely' | 'occasionally' | 'frequently';
  studyHabits?: string;
  major?: string;
  year?: number;
  hobbies: string[];
  socialActivities: string[];
  petFriendly: boolean;
  smokingAllowed: boolean;
  dietaryRestrictions: string[];
  preferredRoommateGender: 'male' | 'female' | 'other' | 'no_preference';
  ageRangeMin?: number;
  ageRangeMax?: number;
  preferredRoommateCount: number;
  bio?: string;
  languages: string[];
  university?: University;
  createdAt: string;
  updatedAt: string;
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