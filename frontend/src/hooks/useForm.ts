// frontend/src/hooks/useForm.ts
import { useState, useCallback, useEffect } from 'react';
import { validateForm, hasFormErrors, getFirstError, type FormErrors, type ValidationResult } from '@/utils/validation';

export interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: Record<string, (value: any) => ValidationResult>;
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
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (validateOnChange && validationRules[name]) {
      const result = validationRules[name](value);
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
  }, [validateOnChange, validationRules]);

  // Handle field blur
  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validateOnBlur && validationRules[name]) {
      const result = validationRules[name](values[name]);
      if (!result.isValid && result.error) {
        setErrors(prev => ({ ...prev, [name]: result.error! }));
      }
    }
  }, [validateOnBlur, validationRules, values]);

  // Validate single field
  const validateField = useCallback((name: string) => {
    if (validationRules[name]) {
      const result = validationRules[name](values[name]);
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

  // Validate entire form
  const validateFormCallback = useCallback(() => {
    const formErrors = validateForm(values, validationRules);
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
        // You might want to handle this error differently
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