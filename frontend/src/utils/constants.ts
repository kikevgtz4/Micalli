// frontend/src/utils/constants.ts

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'room', label: 'Room' },
  { value: 'studio', label: 'Studio' },
  { value: 'other', label: 'Other' }
] as const;

export const PAYMENT_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bimonthly', label: 'Bimonthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
] as const;

export const USER_TYPES = [
  { value: 'student', label: 'Student' },
  { value: 'property_owner', label: 'Property Owner' },
  { value: 'admin', label: 'Admin' }
] as const;

export const AMENITIES_LIST = [
  'WiFi',
  'Air Conditioning',
  'Heating',
  'Washing Machine',
  'Dryer',
  'Kitchen',
  'Refrigerator',
  'Microwave',
  'Dishwasher',
  'TV',
  'Cable TV',
  'Parking',
  'Gym',
  'Swimming Pool',
  'Security System',
  'Elevator',
  'Balcony',
  'Patio',
  'Garden',
  'Study Room'
] as const;

export const UTILITIES_LIST = [
  'Electricity',
  'Water',
  'Gas',
  'Internet',
  'Cable TV',
  'Trash Collection'
] as const;

export const SLEEP_SCHEDULES = [
  { value: 'early_bird', label: 'Early Bird (Before 10 PM)' },
  { value: 'night_owl', label: 'Night Owl (After Midnight)' },
  { value: 'average', label: 'Average (10 PM - Midnight)' }
] as const;

export const YEAR_OPTIONS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
  { value: 5, label: '5th Year+' }
] as const;

export const CLEANLINESS_LEVELS = [
  { value: 1, label: 'Very Messy' },
  { value: 2, label: 'Somewhat Messy' },
  { value: 3, label: 'Average' },
  { value: 4, label: 'Clean' },
  { value: 5, label: 'Very Clean' }
] as const;

export const NOISE_TOLERANCE_LEVELS = [
  { value: 1, label: 'Very Low' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Very High' }
] as const;

export const GUEST_POLICIES = [
  { value: 'rarely', label: 'Rarely', icon: '🏠' },
  { value: 'occasionally', label: 'Occasionally', icon: '👥' },
  { value: 'frequently', label: 'Frequently', icon: '🎉' }
] as const;

export const GENDER_PREFERENCES = [
  { value: 'male', label: 'Male', icon: '👨' },
  { value: 'female', label: 'Female', icon: '👩' },
  { value: 'other', label: 'Other', icon: '🌈' },
  { value: 'no_preference', label: 'No Preference', icon: '🤝' }
] as const;

// API Related Constants
export const API_ENDPOINTS = {
  PROPERTIES: '/properties',
  USERS: '/accounts',
  UNIVERSITIES: '/universities',
  MESSAGES: '/messages',
  ROOMMATES: '/roommates'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Form Validation Constants
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 150,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000,
  MAX_IMAGES: 10,
  MIN_PRICE: 1,
  MAX_PRICE: 1000000,
  MIN_BEDROOMS: 0,
  MAX_BEDROOMS: 10,
  MIN_BATHROOMS: 0,
  MAX_BATHROOMS: 10,
  MIN_AREA: 1,
  MAX_AREA: 10000,
  MIN_STAY_MONTHS: 1,
  MAX_STAY_MONTHS: 36
} as const;

// UI Constants
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const;

export const COLORS = {
  PRIMARY: 'indigo',
  SUCCESS: 'green',
  WARNING: 'yellow',
  ERROR: 'red',
  INFO: 'blue'
} as const;

// Default Values
export const DEFAULTS = {
  PROPERTY: {
    type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    furnished: false,
    paymentFrequency: 'monthly',
    minimumStay: 1,
    isActive: false
  },
  USER: {
    type: 'student'
  },
  PAGINATION: {
    pageSize: 10
  }
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check the form for errors.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROPERTY_CREATED: 'Property created successfully!',
  PROPERTY_UPDATED: 'Property updated successfully!',
  PROPERTY_DELETED: 'Property deleted successfully!',
  PROPERTY_ACTIVATED: 'Property activated successfully!',
  PROPERTY_DEACTIVATED: 'Property deactivated successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  LOGIN_SUCCESS: 'Logged in successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  SIGNUP_SUCCESS: 'Account created successfully!'
} as const;


export const STUDY_HABITS = [
  { value: 'at_home', label: 'Study at Home', description: 'I prefer studying in my room' },
  { value: 'library', label: 'Library/Campus', description: 'I study outside the home' },
  { value: 'flexible', label: 'Flexible', description: 'I study wherever' }
] as const;

export const HOBBIES = [
  'Sports', 'Gaming', 'Reading', 'Music', 'Cooking', 
  'Art', 'Photography', 'Travel', 'Fitness', 'Movies',
  'Hiking', 'Dancing', 'Volunteering', 'Technology',
  'Yoga', 'Meditation', 'Crafts', 'Writing', 'Podcasts'
] as const;

export const SOCIAL_ACTIVITIES = [
  'Parties', 'Small gatherings', 'One-on-one hangouts',
  'Study groups', 'Game nights', 'Movie nights',
  'Outdoor activities', 'Concerts', 'Sports events',
  'Restaurant outings', 'Coffee dates', 'Club activities'
] as const;

export const PERSONALITY_TRAITS = [
  'Introverted', 'Extroverted', 'Organized', 'Spontaneous',
  'Morning person', 'Night person', 'Social', 'Independent',
  'Adventurous', 'Homebody', 'Creative', 'Analytical',
  'Calm', 'Energetic', 'Focused', 'Flexible'
] as const;

export const LANGUAGES = [
  'English', 'Spanish', 'Mandarin', 'French', 'German',
  'Portuguese', 'Italian', 'Korean', 'Japanese', 'Arabic',
  'Hindi', 'Russian', 'Dutch', 'Polish', 'Vietnamese'
] as const;

export const HOUSING_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'house', label: 'House', icon: '🏠' },
  { value: 'dorm', label: 'Dorm', icon: '🏫' },
  { value: 'shared', label: 'Shared Room', icon: '👥' }
] as const;

export const DEAL_BREAKERS = [
  { value: 'no_smoking', label: 'No smoking' },
  { value: 'no_pets', label: 'No pets' },
  { value: 'same_gender_only', label: 'Same gender only' },
  { value: 'quiet_study_required', label: 'Quiet study environment required' },
  { value: 'no_overnight_guests', label: 'No overnight guests' },
  { value: 'no_messy_common_areas', label: 'No messy common areas' },
  { value: 'no_loud_music', label: 'No loud music' },
  { value: 'no_different_sleep_schedules', label: 'No different sleep schedules' },
  { value: 'cleaning_schedule_required', label: 'Cleaning schedule required' },
  { value: 'compatible_diets_required', label: 'Compatible diets required' }
] as const;

export const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Halal',
  'Kosher',
  'Gluten-Free',
  'Dairy-Free',
  'Nut Allergy',
  'Lactose Intolerant',
  'No Restrictions'
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', icon: '👨' },
  { value: 'female', label: 'Female', icon: '👩' },
  { value: 'other', label: 'Other', icon: '🌟' },
] as const;