// Base interfaces - updated to use camelCase consistently
export interface User {
  id: number;
  username: string;
  email: string;
  userType: 'student' | 'property_owner' | 'admin'; // Changed from user_type
  firstName?: string; // Changed from first_name
  lastName?: string; // Changed from last_name
  phone?: string;
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