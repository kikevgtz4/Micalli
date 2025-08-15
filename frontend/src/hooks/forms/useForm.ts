// frontend/src/hooks/useForm.ts
import { useState, useCallback } from 'react';
import { validateForm, hasFormErrors, getFirstError, type FormErrors, type ValidationResult } from '@/utils/validation';
import type { SubleaseFormData } from '@/types/sublease';
import { 
  MAX_SUBLEASE_DURATION_MONTHS,
  MIN_SUBLEASE_IMAGES,
  MAX_SUBLEASE_IMAGES 
} from '@/types/sublease';

// UPDATE: Support cross-field validation with allValues parameter
export interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: Record<string, (value: any, allValues?: T) => ValidationResult>;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormReturn<T> {
  values: T;
  errors: FormErrors;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (name: string, value: any) => void;
  handleBlur: (name: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (name: string, value: any) => void;
  setFieldError: (name: string, error: string) => void;
  setErrors: (errors: FormErrors) => void;
  resetForm: () => void;
  validateField: (name: string) => void;
  validateForm: () => boolean;
  clearErrors: () => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed properties
  const isValid = !hasFormErrors(errors);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  // Handle field change
  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => {
      const newValues = { ...prev, [name]: value };
      
      if (validateOnChange && validationRules[name]) {
        // Pass both value and all values for cross-field validation
        const result = validationRules[name](value, newValues);
        if (!result.isValid && result.error) {
          setErrors(prevErrors => ({ ...prevErrors, [name]: result.error! }));
        } else {
          setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
          });
        }
      }
      
      return newValues;
    });
  }, [validateOnChange, validationRules]);

  // Handle field blur
  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validateOnBlur && validationRules[name]) {
      // Pass both value and all values
      const result = validationRules[name](values[name], values);
      if (!result.isValid && result.error) {
        setErrors(prev => ({ ...prev, [name]: result.error! }));
      }
    }
  }, [validateOnBlur, validationRules, values]);

  // Validate single field
  const validateField = useCallback((name: string) => {
    if (validationRules[name]) {
      // Pass both value and all values
      const result = validationRules[name](values[name], values);
      if (!result.isValid && result.error) {
        setErrors(prev => ({ ...prev, [name]: result.error! }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  }, [validationRules, values]);

  // Validate entire form - UPDATE to pass allValues
  const validateFormCallback = useCallback(() => {
    const formErrors: FormErrors = {};
    
    Object.keys(validationRules).forEach(fieldName => {
      const validator = validationRules[fieldName];
      const fieldValue = values[fieldName];
      const result = validator(fieldValue, values);
      
      if (!result.isValid && result.error) {
        formErrors[fieldName] = result.error;
      }
    });
    
    setErrors(formErrors);
    return !hasFormErrors(formErrors);
  }, [values, validationRules]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // Validate form
    const isFormValid = validateFormCallback();
    
    if (!isFormValid) {
      const firstError = getFirstError(errors);
      if (firstError) {
        console.warn('Form validation failed:', firstError);
      }
      return;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateFormCallback, onSubmit, errors]);

  // Set individual field value
  const setFieldValue = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  // Set individual field error
  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Set multiple errors
  const setErrorsCallback = useCallback((newErrors: FormErrors) => {
    setErrors(newErrors);
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setErrors: setErrorsCallback,
    resetForm,
    validateField,
    validateForm: validateFormCallback,
    clearErrors,
  };
}

// Specialized hook for property forms
export function usePropertyForm(initialValues: any, onSubmit?: (values: any) => Promise<void>) {
  return useForm({
    initialValues,
    validationRules: {
      title: (value: string) => {
        if (!value) return { isValid: false, error: 'Title is required' };
        if (value.length < 3) return { isValid: false, error: 'Title must be at least 3 characters' };
        if (value.length > 200) return { isValid: false, error: 'Title must be less than 200 characters' };
        return { isValid: true };
      },
      description: (value: string) => {
        if (!value) return { isValid: false, error: 'Description is required' };
        if (value.length < 10) return { isValid: false, error: 'Description must be at least 10 characters' };
        if (value.length > 1000) return { isValid: false, error: 'Description must be less than 1000 characters' };
        return { isValid: true };
      },
      address: (value: string) => {
        if (!value) return { isValid: false, error: 'Address is required' };
        if (value.length < 5) return { isValid: false, error: 'Address must be at least 5 characters' };
        return { isValid: true };
      },
      price: (value: string | number) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue <= 0) return { isValid: false, error: 'Price must be a positive number' };
        if (numValue > 1000000) return { isValid: false, error: 'Price must be less than $1,000,000' };
        return { isValid: true };
      },
      deposit: (value: string | number) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue < 0) return { isValid: false, error: 'Deposit must be a non-negative number' };
        return { isValid: true };
      },
      bedrooms: (value: string | number) => {
        const numValue = typeof value === 'string' ? parseInt(value) : value;
        if (isNaN(numValue) || numValue < 0 || numValue > 10) return { isValid: false, error: 'Bedrooms must be between 0 and 10' };
        return { isValid: true };
      },
      bathrooms: (value: string | number) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue < 0 || numValue > 10) return { isValid: false, error: 'Bathrooms must be between 0 and 10' };
        return { isValid: true };
      },
      area: (value: string | number) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue <= 0) return { isValid: false, error: 'Area must be a positive number' };
        if (numValue > 10000) return { isValid: false, error: 'Area must be less than 10,000 m²' };
        return { isValid: true };
      },
      availableFrom: (value: string) => {
        if (!value) return { isValid: false, error: 'Available from date is required' };
        const date = new Date(value);
        if (isNaN(date.getTime())) return { isValid: false, error: 'Please enter a valid date' };
        return { isValid: true };
      },
      minimumStay: (value: string | number) => {
        const numValue = typeof value === 'string' ? parseInt(value) : value;
        if (isNaN(numValue) || numValue < 1 || numValue > 36) return { isValid: false, error: 'Minimum stay must be between 1 and 36 months' };
        return { isValid: true };
      }
    },
    onSubmit,
    validateOnBlur: true,
  });
}

// Specialized hook for sublease forms - FIXED WITH PROPER TYPES
export function useSubleaseForm(
  initialValues: Partial<SubleaseFormData>, 
  onSubmit?: (values: SubleaseFormData) => Promise<void>
) {
  return useForm<SubleaseFormData>({
    initialValues: {
      // Defaults
      listingType: '',
      subleaseType: '',
      title: '',
      description: '',
      additionalInfo: '',
      startDate: '',
      endDate: '',
      isFlexible: false,
      flexibilityRangeDays: 7,
      availableImmediately: false,
      urgencyLevel: 'low',
      propertyType: 'apartment',
      address: '',
      bedrooms: 1,
      bathrooms: 1,
      totalArea: undefined,
      furnished: false,
      amenities: [],
      petFriendly: false,
      smokingAllowed: false,
      totalRoommates: undefined,
      currentRoommates: undefined,
      roommateGenders: undefined,
      roommateDescription: '',
      sharedSpaces: [],
      originalRent: 0,
      subleaseRent: 0,
      depositRequired: true,
      depositAmount: 0,
      utilitiesIncluded: [],
      additionalFees: {},
      images: [],
      landlordConsentStatus: 'not_required',
      landlordConsentDocument: undefined,
      leaseTransferAllowed: false,
      subleaseAgreementRequired: true,
      disclaimersAccepted: false,
      ...initialValues,
    } as SubleaseFormData,
    validationRules: {
      // Step 1: Type validation
      listingType: (value: string) => {
        if (!value) return { isValid: false, error: 'Please select a listing type' };
        return { isValid: true };
      },
      subleaseType: (value: string) => {
        if (!value) return { isValid: false, error: 'Please select what you\'re offering' };
        return { isValid: true };
      },
      
      // Step 2: Basic info validation
      title: (value: string) => {
        if (!value) return { isValid: false, error: 'Title is required' };
        if (value.length < 5) return { isValid: false, error: 'Title must be at least 5 characters' };
        if (value.length > 200) return { isValid: false, error: 'Title must be less than 200 characters' };
        return { isValid: true };
      },
      description: (value: string) => {
        if (!value) return { isValid: false, error: 'Description is required' };
        if (value.length < 20) return { isValid: false, error: 'Description must be at least 20 characters' };
        if (value.length > 5000) return { isValid: false, error: 'Description must be less than 5000 characters' };
        return { isValid: true };
      },
      additionalInfo: (value: string) => {
        // Optional field
        if (value && value.length > 1000) return { isValid: false, error: 'Additional info must be less than 1000 characters' };
        return { isValid: true };
      },
      
      // Step 3: Date validation - WITH CROSS-FIELD VALIDATION
      startDate: (value: string) => {
        if (!value) return { isValid: false, error: 'Start date is required' };
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return { isValid: false, error: 'Start date cannot be in the past' };
        return { isValid: true };
      },
      endDate: (value: string, allValues?: SubleaseFormData) => {
        if (!value) return { isValid: false, error: 'End date is required' };
        const endDate = new Date(value);
        
        if (allValues?.startDate) {
          const startDate = new Date(allValues.startDate);
          
          if (endDate <= startDate) {
            return { isValid: false, error: 'End date must be after start date' };
          }
          
          // Check max duration
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
          
          if (diffMonths > MAX_SUBLEASE_DURATION_MONTHS) {
            return { isValid: false, error: `Maximum sublease duration is ${MAX_SUBLEASE_DURATION_MONTHS} months` };
          }
        }
        
        return { isValid: true };
      },
      flexibilityRangeDays: (value: number) => {
        if (value < 0 || value > 30) return { isValid: false, error: 'Flexibility range must be between 0 and 30 days' };
        return { isValid: true };
      },
      
      // Step 4: Property details validation
      address: (value: string) => {
        if (!value) return { isValid: false, error: 'Address is required' };
        if (value.length < 10) return { isValid: false, error: 'Please enter a complete address' };
        return { isValid: true };
      },
      bedrooms: (value: number, allValues?: SubleaseFormData) => {
        // Required for entire_place and private_room
        if ((allValues?.subleaseType === 'entire_place' || allValues?.subleaseType === 'private_room')) {
          if (!value && value !== 0) {
            return { isValid: false, error: 'Number of bedrooms is required' };
          }
        }
        if (value !== undefined && (value < 0 || value > 10)) {
          return { isValid: false, error: 'Bedrooms must be between 0 and 10' };
        }
        return { isValid: true };
      },
      bathrooms: (value: number) => {
        if (value !== undefined && (value < 0 || value > 10)) {
          return { isValid: false, error: 'Bathrooms must be between 0 and 10' };
        }
        return { isValid: true };
      },
      totalArea: (value: number) => {
        if (value !== undefined && value <= 0) {
          return { isValid: false, error: 'Area must be a positive number' };
        }
        if (value !== undefined && value > 10000) {
          return { isValid: false, error: 'Area seems too large. Please verify.' };
        }
        return { isValid: true };
      },
      
      // Step 5: Roommate validation (conditional)
      totalRoommates: (value: number, allValues?: SubleaseFormData) => {
        if (allValues?.subleaseType === 'shared_room' && !value) {
          return { isValid: false, error: 'Total roommates is required for shared rooms' };
        }
        if (value !== undefined && (value < 1 || value > 20)) {
          return { isValid: false, error: 'Number of roommates must be between 1 and 20' };
        }
        return { isValid: true };
      },
      roommateDescription: (value: string, allValues?: SubleaseFormData) => {
        if ((allValues?.subleaseType === 'shared_room' || allValues?.subleaseType === 'private_room') && !value) {
          return { isValid: false, error: 'Please describe the current roommates' };
        }
        if (value && value.length > 1000) {
          return { isValid: false, error: 'Roommate description must be less than 1000 characters' };
        }
        return { isValid: true };
      },
      
      // Step 6: Pricing validation
      originalRent: (value: number) => {
        if (!value || value <= 0) return { isValid: false, error: 'Original rent is required' };
        if (value > 100000) return { isValid: false, error: 'Please enter a valid rent amount' };
        return { isValid: true };
      },
      subleaseRent: (value: number, allValues?: SubleaseFormData) => {
        if (!value || value <= 0) return { isValid: false, error: 'Sublease rent is required' };
        if (value > 100000) return { isValid: false, error: 'Please enter a valid rent amount' };
        
        // Warning if sublease rent is > 150% of original
        if (allValues?.originalRent && value > allValues.originalRent * 1.5) {
          return { isValid: false, error: 'Sublease rent seems unusually high compared to original rent' };
        }
        
        return { isValid: true };
      },
      depositAmount: (value: number, allValues?: SubleaseFormData) => {
        if (allValues?.depositRequired && (!value || value <= 0)) {
          return { isValid: false, error: 'Deposit amount is required' };
        }
        if (value && value > 50000) {
          return { isValid: false, error: 'Deposit amount seems too high' };
        }
        return { isValid: true };
      },
      
      // Step 8: Legal validation
      disclaimersAccepted: (value: boolean) => {
        if (!value) return { isValid: false, error: 'You must accept the terms and disclaimers' };
        return { isValid: true };
      },
    },
    onSubmit,
    validateOnBlur: true,
    validateOnChange: false,
  });
}

// Helper hook for handling file uploads
export function useFileUpload(maxFiles = 10, maxSizeMB = 10) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach((file, index) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        errors.push(`File ${index + 1}: Only image files are allowed`);
        return;
      }

      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        errors.push(`File ${index + 1}: File size must be less than ${maxSizeMB}MB`);
        return;
      }

      validFiles.push(file);
    });

    setFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      if (newFiles.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return newFiles.slice(0, maxFiles);
      }
      return newFiles;
    });

    setUploadErrors(errors);
  }, [maxFiles, maxSizeMB]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadErrors([]);
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploadErrors([]);
  }, []);

  return {
    files,
    uploadErrors,
    addFiles,
    removeFile,
    clearFiles,
    hasFiles: files.length > 0,
    fileCount: files.length,
  };
}