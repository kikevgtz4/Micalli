// frontend/src/utils/constants.ts
export const CONSTANTS = {
  PROPERTY_TYPES: [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'room', label: 'Room' },
    { value: 'studio', label: 'Studio' },
    { value: 'other', label: 'Other' },
  ],

  PAYMENT_FREQUENCIES: [
    { value: 'monthly', label: 'Monthly' },
    { value: 'bimonthly', label: 'Bimonthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ],

  USER_TYPES: [
    { value: 'student', label: 'Student' },
    { value: 'property_owner', label: 'Property Owner' },
  ],

  AMENITIES: [
    'WiFi', 'Air Conditioning', 'Heating', 'Washing Machine', 'Dryer',
    'Kitchen', 'Refrigerator', 'Microwave', 'Dishwasher', 'TV',
    'Cable TV', 'Parking', 'Gym', 'Swimming Pool', 'Security System',
    'Elevator', 'Balcony', 'Patio', 'Garden', 'Study Room'
  ],

  UTILITIES: [
    'Electricity', 'Water', 'Gas', 'Internet', 'Cable TV', 'Trash Collection'
  ],

  ROOMMATE_PREFERENCES: {
    SLEEP_SCHEDULE: [
      { value: 'early_bird', label: 'Early Bird' },
      { value: 'night_owl', label: 'Night Owl' },
      { value: 'average', label: 'Average' },
    ],

    CLEANLINESS: [
      { value: 1, label: 'Very Messy' },
      { value: 2, label: 'Somewhat Messy' },
      { value: 3, label: 'Average' },
      { value: 4, label: 'Clean' },
      { value: 5, label: 'Very Clean' },
    ],

    NOISE_TOLERANCE: [
      { value: 1, label: 'Very Low' },
      { value: 2, label: 'Low' },
      { value: 3, label: 'Medium' },
      { value: 4, label: 'High' },
      { value: 5, label: 'Very High' },
    ],

    GUEST_POLICY: [
      { value: 'rarely', label: 'Rarely' },
      { value: 'occasionally', label: 'Occasionally' },
      { value: 'frequently', label: 'Frequently' },
    ],

    GENDER: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' },
      { value: 'no_preference', label: 'No Preference' },
    ],
  },

  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_TITLE_LENGTH: 200,
    MAX_DESCRIPTION_LENGTH: 2000,
    MIN_RENT_AMOUNT: 1000,
    MAX_RENT_AMOUNT: 100000,
    MIN_BEDROOMS: 0,
    MAX_BEDROOMS: 10,
    MIN_BATHROOMS: 0.5,
    MAX_BATHROOMS: 10,
  },

  FILE_UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    MAX_IMAGES_PER_PROPERTY: 10,
  },
  
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },

  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    DEBOUNCE_DELAY: 300, // ms
  },

  CURRENCY: {
    DEFAULT: 'MXN',
    LOCALE: 'es-MX',
  },
} as const;