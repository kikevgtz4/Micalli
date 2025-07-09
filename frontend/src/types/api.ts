// frontend/src/types/api.ts

// Import types from roommates that are used here
import type { SleepSchedule, StudyHabits, GuestPolicy, DealBreaker } from './roommates';

// Base interfaces - updated to use camelCase consistently
export interface User {
  // Core fields
  id: number;
  email: string;
  username: string;
  userType: 'student' | 'property_owner' | 'admin';
  
  // Personal info - required in backend
  firstName: string;
  lastName: string;
  
  // Profile fields
  profilePicture?: string;
  dateOfBirth?: string;
  age?: number; // Computed field from backend
  gender?: 'male' | 'female' | 'other';
  phone?: string; // Backend has this on User model
  
  // Verification status
  emailVerified: boolean;
  studentIdVerified?: boolean;
  
  // Student-specific fields
  university?: University; // Keep full University object
  graduationYear?: number;
  program?: string;
  
  // Django built-in fields
  dateJoined: string; // ISO date string
  lastLogin?: string; // ISO date string
  isActive: boolean;
  
  // Computed/additional fields
  hasCompleteProfile?: boolean;
  
  // Property owner specific (only present for property owners)
  propertyOwnerProfile?: PropertyOwnerProfile;
  
  // Fields from UserBriefSerializer (used in messaging)
  name?: string; // Computed display name
  isOnline?: boolean;
  lastSeen?: string;
  responseTime?: string;
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
  abbreviation?: string;
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
  monthlyRent?: number; // Add as optional for backward compatibility
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
  displayNeighborhood?: string;
  displayArea?: string;
  privacyRadius?: number;
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

  dateOfBirth?: string;
  
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

export interface UserBrief {
  id: number;
  username: string;
  email: string;
  userType: 'student' | 'property_owner' | 'admin';
  
  // Name fields
  firstName: string;
  lastName: string;
  name?: string; // Computed display name from backend
  
  // Profile info
  profilePicture?: string;
  
  // Verification
  emailVerified: boolean;
  studentIdVerified?: boolean;
  
  // Activity status (from UserBriefSerializer)
  isOnline?: boolean;
  lastSeen?: string; // This is lastLogin in ISO format
  responseTime?: string; // For property owners
  
  // Timestamps
  dateJoined: string; // ISO date string
  
  // University
  university?: University;
}

export interface Conversation {
  id: number;
  participants: number[]; // Array of user IDs
  participantsDetails: UserBrief[]; // Full user details
  otherParticipant?: UserBrief; // Computed field
  property?: number; // Property ID
  propertyDetails?: { // From PropertyBriefSerializer
    id: number;
    title: string;
    address: string;
    rentAmount: number;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    owner: UserBrief;
    mainImage?: string;
    isActive: boolean;
  };
  conversationType: 'general' | 'property_inquiry' | 'application' | 'roommate_inquiry';
  status: 'active' | 'pending_response' | 'pending_application' | 'application_submitted' | 'booking_confirmed' | 'archived' | 'flagged';
  createdAt: string;
  updatedAt: string;
  latestMessage?: Message; // Computed field
  unreadCount: number; // Computed field
  messageCount?: number; // From annotated queryset
  lastMessageTime?: string; // From annotated queryset
  hasFlaggedContent: boolean;
  flaggedAt?: string;
  initialMessageTemplate?: string;
  ownerResponseTime?: string; // Duration as string
}

export interface Message {
  id: number;
  content: string;
  sender: number; // User ID
  senderDetails: UserBrief; // Full user details
  createdAt: string;
  read: boolean;
  messageType: 'text' | 'inquiry' | 'document_share' | 'application_update' | 'system';
  metadata?: Record<string, any>;
  attachment?: string;
  attachmentType?: string;
  isSystemMessage: boolean;
  hasFilteredContent: boolean;
  filterWarnings?: PolicyViolation[];
  filteredContent?: string;
  isEdited: boolean; // Computed (always false currently)
  canEdit: boolean; // Computed based on time
  readBy: number[]; // Array of user IDs who read the message
  conversation?: number; // Only in write operations
}

export interface MessageTemplate {
  id: number;
  templateType: 'initial_inquiry' | 'ask_amenities' | 'ask_availability' | 'ask_requirements' | 'ask_neighborhood' | 'ask_utilities' | 'roommate_introduction';
  title: string;
  content: string;
  localizedContent?: { // From get_localized_content method
    title: string;
    content: string;
  };
  variables: string[];
  usageCount: number;
  isActive: boolean;
  order: number;
  // Note: titleEs, contentEs are write-only fields, not returned in responses
}

export interface ConversationFlag {
  id: number;
  conversation: number;
  conversationDetails?: { // From get_conversation_details method
    id: number;
    property?: string;
    participants: number;
    messageCount: number;
  };
  message?: number;
  flaggedBy: number;
  flaggedByDetails: UserBrief;
  reason: 'spam' | 'contact_info' | 'payment_circumvention' | 'inappropriate' | 'harassment' | 'scam' | 'other';
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
  actionTaken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern: string;
  education: string;
  matchedText?: string;
  position?: number;
}

export interface ContentFilterResult {
  violations: PolicyViolation[];
  action: 'allow' | 'educate' | 'warn' | 'block';
  filteredContent: string;
  severityScore: number;
}

// API Response Types
export interface StartConversationResponse extends Conversation {
  contentWarning?: {
    message: string;
    violations: PolicyViolation[];
  };
}

// For ConversationDetailSerializer
export interface ConversationDetail extends Conversation {
  messages: Message[];
  canSendMessage: boolean;
  responseTimeStats?: {
    averageResponseTime: string;
    responseRate: number;
    lastActive?: string;
  };
}

// Request types for API calls
export interface ConversationStartRequest {
  userId: number;
  propertyId?: number;
  message: string;
  templateType?: string;
  metadata?: Record<string, any>;
}

export interface MessageCreateRequest {
  content: string;
  messageType?: 'text' | 'inquiry' | 'document_share' | 'application_update';
  metadata?: Record<string, any>;
  attachment?: File;
}