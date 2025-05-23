// Base interfaces
export interface User {
  id: number;
  username: string;
  email: string;
  userType: 'student' | 'property_owner' | 'admin'; // Changed from user_type
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
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
  student_population?: number;
}

export interface PropertyImage {
  id: number;
  image: string;
  is_main: boolean;
  caption?: string;
  order: number;
}

export interface UniversityProximity {
  id: number;
  university: University;
  distance_in_meters: number;
  walking_time_minutes: number;
  public_transport_time_minutes?: number;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  property_type: 'apartment' | 'house' | 'room' | 'studio' | 'other';
  bedrooms: number;
  bathrooms: number;
  total_area: number;
  furnished: boolean;
  amenities: string[];
  rules: string[];
  rent_amount: number;
  deposit_amount: number;
  payment_frequency: 'monthly' | 'bimonthly' | 'quarterly' | 'yearly';
  included_utilities: string[];
  available_from: string;
  minimum_stay: number;
  maximum_stay?: number;
  owner: User;
  owner_name?: string;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
  university_proximities: UniversityProximity[];
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
  property_count: number;
  active_viewing_requests: number;
  unread_messages: number;
  recent_activity: {
    messages: any[];
    viewing_requests: any[];
  };
}