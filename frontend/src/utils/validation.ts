// frontend/src/utils/validation.ts
import { VALIDATION_RULES, ERROR_MESSAGES } from './constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FormErrors {
  [key: string]: string;
}

// Basic validation functions
export const validation = {
  // Email validation
  email: (email: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  },

  // Password validation
  password: (password: string): ValidationResult => {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }
    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      return { isValid: false, error: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long` };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }
    return { isValid: true };
  },

  // Username validation
  username: (username: string): ValidationResult => {
    if (!username) {
      return { isValid: false, error: 'Username is required' };
    }
    if (username.length < VALIDATION_RULES.USERNAME_MIN_LENGTH) {
      return { isValid: false, error: `Username must be at least ${VALIDATION_RULES.USERNAME_MIN_LENGTH} characters long` };
    }
    if (username.length > VALIDATION_RULES.USERNAME_MAX_LENGTH) {
      return { isValid: false, error: `Username must be no more than ${VALIDATION_RULES.USERNAME_MAX_LENGTH} characters long` };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    return { isValid: true };
  },

  // Required field validation
  required: (value: string | number | boolean, fieldName: string): ValidationResult => {
    if (value === undefined || value === null || value === '') {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  },

  // Number validation
  number: (value: string | number, min?: number, max?: number, fieldName = 'Field'): ValidationResult => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return { isValid: false, error: `${fieldName} must be a valid number` };
    }
    
    if (min !== undefined && numValue < min) {
      return { isValid: false, error: `${fieldName} must be at least ${min}` };
    }
    
    if (max !== undefined && numValue > max) {
      return { isValid: false, error: `${fieldName} must be no more than ${max}` };
    }
    
    return { isValid: true };
  },

  // Integer validation
  integer: (value: string | number, min?: number, max?: number, fieldName = 'Field'): ValidationResult => {
    const numValue = typeof value === 'string' ? parseInt(value) : value;
    
    if (isNaN(numValue) || !Number.isInteger(numValue)) {
      return { isValid: false, error: `${fieldName} must be a valid whole number` };
    }
    
    if (min !== undefined && numValue < min) {
      return { isValid: false, error: `${fieldName} must be at least ${min}` };
    }
    
    if (max !== undefined && numValue > max) {
      return { isValid: false, error: `${fieldName} must be no more than ${max}` };
    }
    
    return { isValid: true };
  },

  // String length validation
  stringLength: (value: string, min?: number, max?: number, fieldName = 'Field'): ValidationResult => {
    if (min !== undefined && value.length < min) {
      return { isValid: false, error: `${fieldName} must be at least ${min} characters long` };
    }
    
    if (max !== undefined && value.length > max) {
      return { isValid: false, error: `${fieldName} must be no more than ${max} characters long` };
    }
    
    return { isValid: true };
  },

  // Date validation
  date: (value: string, futureOnly = false, fieldName = 'Date'): ValidationResult => {
    if (!value) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { isValid: false, error: `${fieldName} must be a valid date` };
    }
    
    if (futureOnly && date < new Date()) {
      return { isValid: false, error: `${fieldName} must be in the future` };
    }
    
    return { isValid: true };
  },

  // Phone validation (basic)
  phone: (phone: string): ValidationResult => {
    if (!phone) {
      return { isValid: true }; // Phone is optional in most cases
    }
    
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return { isValid: false, error: 'Please enter a valid phone number' };
    }
    
    return { isValid: true };
  },

  // URL validation
  url: (url: string, required = false): ValidationResult => {
    if (!url && !required) {
      return { isValid: true };
    }
    
    if (!url && required) {
      return { isValid: false, error: 'URL is required' };
    }
    
    try {
      new URL(url);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Please enter a valid URL' };
    }
  }
};

// Property-specific validations
export const propertyValidation = {
  title: (title: string): ValidationResult => {
    const requiredCheck = validation.required(title, 'Title');
    if (!requiredCheck.isValid) return requiredCheck;
    
    return validation.stringLength(title, 1, VALIDATION_RULES.TITLE_MAX_LENGTH, 'Title');
  },

  description: (description: string): ValidationResult => {
    const requiredCheck = validation.required(description, 'Description');
    if (!requiredCheck.isValid) return requiredCheck;
    
    return validation.stringLength(description, 10, VALIDATION_RULES.DESCRIPTION_MAX_LENGTH, 'Description');
  },

  address: (address: string): ValidationResult => {
    const requiredCheck = validation.required(address, 'Address');
    if (!requiredCheck.isValid) return requiredCheck;
    
    return validation.stringLength(address, 5, 255, 'Address');
  },

  price: (price: string | number): ValidationResult => {
    return validation.number(price, VALIDATION_RULES.MIN_PRICE, VALIDATION_RULES.MAX_PRICE, 'Price');
  },

  bedrooms: (bedrooms: string | number): ValidationResult => {
    return validation.integer(bedrooms, VALIDATION_RULES.MIN_BEDROOMS, VALIDATION_RULES.MAX_BEDROOMS, 'Bedrooms');
  },

  bathrooms: (bathrooms: string | number): ValidationResult => {
    return validation.number(bathrooms, VALIDATION_RULES.MIN_BATHROOMS, VALIDATION_RULES.MAX_BATHROOMS, 'Bathrooms');
  },

  area: (area: string | number): ValidationResult => {
    return validation.number(area, VALIDATION_RULES.MIN_AREA, VALIDATION_RULES.MAX_AREA, 'Area');
  },

  minimumStay: (months: string | number): ValidationResult => {
    return validation.integer(months, VALIDATION_RULES.MIN_STAY_MONTHS, VALIDATION_RULES.MAX_STAY_MONTHS, 'Minimum stay');
  },

  maximumStay: (months: string | number): ValidationResult => {
    if (!months) return { isValid: true }; // Optional field
    return validation.integer(months, VALIDATION_RULES.MIN_STAY_MONTHS, VALIDATION_RULES.MAX_STAY_MONTHS, 'Maximum stay');
  },

  coordinates: (lat: string | number, lng: string | number): ValidationResult => {
    if (!lat && !lng) return { isValid: true }; // Optional
    
    if (!lat || !lng) {
      return { isValid: false, error: 'Both latitude and longitude are required if providing coordinates' };
    }
    
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      return { isValid: false, error: 'Coordinates must be valid numbers' };
    }
    
    if (latNum < -90 || latNum > 90) {
      return { isValid: false, error: 'Latitude must be between -90 and 90' };
    }
    
    if (lngNum < -180 || lngNum > 180) {
      return { isValid: false, error: 'Longitude must be between -180 and 180' };
    }
    
    return { isValid: true };
  }
};

// Form validation helpers
export const validateForm = (data: Record<string, any>, rules: Record<string, (value: any) => ValidationResult>): FormErrors => {
  const errors: FormErrors = {};
  
  Object.keys(rules).forEach(field => {
    const result = rules[field](data[field]);
    if (!result.isValid && result.error) {
      errors[field] = result.error;
    }
  });
  
  return errors;
};

export const hasFormErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

export const getFirstError = (errors: FormErrors): string | null => {
  const firstErrorKey = Object.keys(errors)[0];
  return firstErrorKey ? errors[firstErrorKey] : null;
};

// Password confirmation validation
export const validatePasswordConfirmation = (password: string, confirmPassword: string): ValidationResult => {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  return { isValid: true };
};

// Array validation
export const validateArray = (arr: any[], fieldName: string, min = 0, max?: number): ValidationResult => {
  if (arr.length < min) {
    return { isValid: false, error: `${fieldName} must have at least ${min} item${min !== 1 ? 's' : ''}` };
  }
  
  if (max && arr.length > max) {
    return { isValid: false, error: `${fieldName} can have at most ${max} item${max !== 1 ? 's' : ''}` };
  }
  
  return { isValid: true };
};

// File validation
export const validateFile = (file: File, maxSizeMB = 10, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif']): ValidationResult => {
  if (!file) {
    return { isValid: false, error: 'File is required' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }
  
  return { isValid: true };
};

export const validateFiles = (files: File[], maxFiles = 10): ValidationResult => {
  if (files.length > maxFiles) {
    return { isValid: false, error: `Maximum ${maxFiles} files allowed` };
  }
  
  for (const file of files) {
    const fileValidation = validateFile(file);
    if (!fileValidation.isValid) {
      return fileValidation;
    }
  }
  
  return { isValid: true };
};

// Roommate profile specific validations
export const roommateValidation = {
  // Emergency contact validations
  emergencyPhone: (phone: string): ValidationResult => {
    if (!phone) {
      return { isValid: false, error: 'Emergency contact phone is required' };
    }
    
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      return { isValid: false, error: 'Please enter a valid phone number' };
    }
    
    if (phone.replace(/\D/g, '').length < 10) {
      return { isValid: false, error: 'Phone number must be at least 10 digits' };
    }
    
    return { isValid: true };
  },

  emergencyContactName: (name: string): ValidationResult => {
    if (!name || !name.trim()) {
      return { isValid: false, error: 'Emergency contact name is required' };
    }
    return validation.stringLength(name.trim(), 2, 100, 'Emergency contact name');
  },

  emergencyContactRelationship: (relationship: string): ValidationResult => {
    const validRelationships = ['parent', 'sibling', 'friend', 'guardian', 'partner', 'other'];
    if (!relationship) {
      return { isValid: false, error: 'Emergency contact relationship is required' };
    }
    if (!validRelationships.includes(relationship)) {
      return { isValid: false, error: 'Please select a valid relationship' };
    }
    return { isValid: true };
  },

  // Budget validations
  budgetRange: (min: number | undefined, max: number | undefined): ValidationResult => {
    if (min !== undefined && max !== undefined && min > max) {
      return { isValid: false, error: 'Maximum budget must be greater than minimum budget' };
    }
    
    if (min !== undefined && min < 0) {
      return { isValid: false, error: 'Minimum budget cannot be negative' };
    }
    
    if (max !== undefined && max < 0) {
      return { isValid: false, error: 'Maximum budget cannot be negative' };
    }
    
    return { isValid: true };
  },

  // Age range validations
  ageRange: (min: number | undefined, max: number | null | undefined): ValidationResult => {
    if (min !== undefined && min < 18) {
      return { isValid: false, error: 'Minimum age must be at least 18' };
    }
    
    if (min !== undefined && min > 100) {
      return { isValid: false, error: 'Please enter a valid minimum age' };
    }
    
    if (max !== undefined && max !== null) {
      if (max < 18) {
        return { isValid: false, error: 'Maximum age must be at least 18' };
      }
      
      if (max > 100) {
        return { isValid: false, error: 'Please enter a valid maximum age' };
      }
      
      if (min !== undefined && max < min) {
        return { isValid: false, error: 'Maximum age must be greater than minimum age' };
      }
    }
    
    return { isValid: true };
  },

  // Bio validation
  bio: (bio: string): ValidationResult => {
    if (!bio || !bio.trim()) {
      return { isValid: false, error: 'Bio is required - tell potential roommates about yourself' };
    }
    
    const trimmedBio = bio.trim();
    if (trimmedBio.length < 50) {
      return { isValid: false, error: 'Bio must be at least 50 characters - help others get to know you' };
    }
    
    if (trimmedBio.length > 500) {
      return { isValid: false, error: 'Bio must be no more than 500 characters' };
    }
    
    return { isValid: true };
  },

  // Personality traits, deal breakers, shared interests validation
  personalityTraits: (traits: string[]): ValidationResult => {
    return validateArray(traits, 'Personality traits', 0, 10);
  },

  dealBreakers: (dealBreakers: string[]): ValidationResult => {
    return validateArray(dealBreakers, 'Deal breakers', 0, 10);
  },

  sharedInterests: (interests: string[]): ValidationResult => {
    return validateArray(interests, 'Shared interests', 0, 15);
  },

  // Languages validation
  languages: (languages: string[]): ValidationResult => {
    if (!languages || languages.length === 0) {
      return { isValid: false, error: 'Please select at least one language you speak' };
    }
    return validateArray(languages, 'Languages', 1, 10);
  },

  // Move-in date validation
  moveInDate: (date: string): ValidationResult => {
    if (!date) {
      return { isValid: true }; // Optional field
    }
    
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { isValid: false, error: 'Move-in date cannot be in the past' };
    }
    
    // Check if date is not too far in the future (e.g., 2 years)
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2);
    
    if (selectedDate > maxFutureDate) {
      return { isValid: false, error: 'Move-in date cannot be more than 2 years in the future' };
    }
    
    return { isValid: true };
  },

  // Nickname validation
  nickname: (nickname: string): ValidationResult => {
    if (!nickname) {
      return { isValid: true }; // Optional field
    }
    
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2) {
      return { isValid: false, error: 'Nickname must be at least 2 characters' };
    }
    
    if (trimmedNickname.length > 30) {
      return { isValid: false, error: 'Nickname must be no more than 30 characters' };
    }
    
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedNickname)) {
      return { isValid: false, error: 'Nickname can only contain letters, numbers, spaces, hyphens, and underscores' };
    }
    
    return { isValid: true };
  },

  // Preferred locations validation
  preferredLocations: (locations: string[]): ValidationResult => {
    if (!locations || locations.length === 0) {
      return { isValid: true }; // Optional field
    }
    
    if (locations.length > 10) {
      return { isValid: false, error: 'You can select up to 10 preferred locations' };
    }
    
    // Check each location isn't too long
    for (const location of locations) {
      if (location.length > 100) {
        return { isValid: false, error: 'Location names must be less than 100 characters' };
      }
    }
    
    return { isValid: true };
  },

  // Dietary restrictions validation
  dietaryRestrictions: (dietaryRestrictions: string[] | undefined): ValidationResult => {
    // Check if user has toggled "Yes" but hasn't selected any restrictions
    const hasDietaryRestrictions = dietaryRestrictions && 
      !dietaryRestrictions.includes('No Restrictions');
    
    if (hasDietaryRestrictions && dietaryRestrictions.length === 0) {
      return { 
        isValid: false, 
        error: 'Please select at least one dietary restriction or toggle off if you have none' 
      };
    }
    
    return { isValid: true };
  },
};

// Composite validation for the entire roommate profile form
export const validateRoommateProfile = (data: any): FormErrors => {
  const errors: FormErrors = {};

  // Basic info validations
  if (data.bio !== undefined) {
    const bioResult = roommateValidation.bio(data.bio);
    if (!bioResult.isValid && bioResult.error) {
      errors.bio = bioResult.error;
    }
  }

  if (data.nickname !== undefined) {
    const nicknameResult = roommateValidation.nickname(data.nickname);
    if (!nicknameResult.isValid && nicknameResult.error) {
      errors.nickname = nicknameResult.error;
    }
  }

  // Budget validation
  const budgetResult = roommateValidation.budgetRange(data.budgetMin, data.budgetMax);
  if (!budgetResult.isValid && budgetResult.error) {
    errors.budget = budgetResult.error;
  }

  // Age range validation
  const ageResult = roommateValidation.ageRange(data.ageRangeMin, data.ageRangeMax);
  if (!ageResult.isValid && ageResult.error) {
    errors.ageRange = ageResult.error;
  }

  // Emergency contact validations
  if (data.emergencyContactName || data.emergencyContactPhone || data.emergencyContactRelation) {
    // If any emergency contact field is filled, all are required
    if (!data.emergencyContactName) {
      errors.emergencyContactName = 'Emergency contact name is required';
    } else {
      const nameResult = roommateValidation.emergencyContactName(data.emergencyContactName);
      if (!nameResult.isValid && nameResult.error) {
        errors.emergencyContactName = nameResult.error;
      }
    }

    if (!data.emergencyContactPhone) {
      errors.emergencyContactPhone = 'Emergency contact phone is required';
    } else {
      const phoneResult = roommateValidation.emergencyPhone(data.emergencyContactPhone);
      if (!phoneResult.isValid && phoneResult.error) {
        errors.emergencyContactPhone = phoneResult.error;
      }
    }

    if (!data.emergencyContactRelation) {
      errors.emergencyContactRelation = 'Emergency contact relationship is required';
    } else {
      const relationResult = roommateValidation.emergencyContactRelationship(data.emergencyContactRelation);
      if (!relationResult.isValid && relationResult.error) {
        errors.emergencyContactRelation = relationResult.error;
      }
    }
  }

  // Array field validations
  if (data.languages !== undefined) {
    const langResult = roommateValidation.languages(data.languages);
    if (!langResult.isValid && langResult.error) {
      errors.languages = langResult.error;
    }
  }

  if (data.personality !== undefined) {
    const personalityResult = roommateValidation.personalityTraits(data.personality);
    if (!personalityResult.isValid && personalityResult.error) {
      errors.personality = personalityResult.error;
    }
  }

  if (data.dealBreakers !== undefined) {
    const dealBreakersResult = roommateValidation.dealBreakers(data.dealBreakers);
    if (!dealBreakersResult.isValid && dealBreakersResult.error) {
      errors.dealBreakers = dealBreakersResult.error;
    }
  }

  if (data.sharedInterests !== undefined) {
    const interestsResult = roommateValidation.sharedInterests(data.sharedInterests);
    if (!interestsResult.isValid && interestsResult.error) {
      errors.sharedInterests = interestsResult.error;
    }
  }

  if (data.preferredLocations !== undefined) {
    const locationsResult = roommateValidation.preferredLocations(data.preferredLocations);
    if (!locationsResult.isValid && locationsResult.error) {
      errors.preferredLocations = locationsResult.error;
    }
  }

  // Dietary restrictions validation
  if (data.dietaryRestrictions !== undefined) {
    const dietaryResult = roommateValidation.dietaryRestrictions(data.dietaryRestrictions);
    if (!dietaryResult.isValid && dietaryResult.error) {
      errors.dietaryRestrictions = dietaryResult.error;
    }
  }

  if (data.moveInDate !== undefined) {
    const dateResult = roommateValidation.moveInDate(data.moveInDate);
    if (!dateResult.isValid && dateResult.error) {
      errors.moveInDate = dateResult.error;
    }
  }

  return errors;
};