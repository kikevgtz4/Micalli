// frontend/src/utils/helpers.ts
import { formatters } from './formatters';

export const helpers = {
  // Keep your existing currency formatting (Mexican peso) - this is better!
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  // Keep your existing number formatting
  formatNumber: (num: number): string => {
    return new Intl.NumberFormat('es-MX').format(num);
  },

  // Keep your existing date formatting
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Keep your existing (better) error message handling
  getErrorMessage: (error: any): string => {
    if (typeof error === 'string') return error;
    
    if (error?.response?.data) {
      const data = error.response.data;
      
      if (typeof data === 'string') return data;
      if (data.detail) return data.detail;
      if (data.message) return data.message;
      
      // Handle field errors
      if (typeof data === 'object') {
        const fieldErrors = Object.entries(data)
          .map(([field, errors]) => {
            const errorList = Array.isArray(errors) ? errors : [errors];
            return `${field}: ${errorList.join(' ')}`;
          })
          .join(', ');
          
        if (fieldErrors) return fieldErrors;
      }
    }

    if (error?.message) return error.message;
    
    return 'An unexpected error occurred. Please try again.';
  },

  // Keep your existing debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Keep your existing capitalize function
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Keep your existing truncate function
  truncate: (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  },

  // Keep your existing storage object
  storage: {
    get: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },

    set: (key: string, value: string): boolean => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },

    remove: (key: string): boolean => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  },

  // Add new utilities (these won't conflict with existing code)
  
  // Generate unique ID
  generateId: (): string => {
    return Math.random().toString(36).substr(2, 9);
  },

  // Sleep function for delays
  sleep: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Check if object is empty
  isEmpty: (obj: any): boolean => {
    if (obj == null) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    if (typeof obj === 'string') return obj.trim().length === 0;
    return false;
  },

  // Deep clone object
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  },

  // Scroll to element
  scrollToElement: (elementId: string, behavior: ScrollBehavior = 'smooth'): void => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior });
    }
  },

  // Additional formatters (available as alternatives to the main ones)
  alt: {
    // Alternative currency formatter (if you want USD format)
    formatCurrencyUSD: formatters.currency,
    
    // Alternative date formatters
    formatDateLong: formatters.date.long,
    formatDateRelative: formatters.date.relative,
    formatDateTime: formatters.date.dateTime,
    
    // Additional text utilities
    titleCase: formatters.text.titleCase,
    pluralize: formatters.text.pluralize,
    
    // Distance and area formatters
    formatDistance: formatters.distance,
    formatArea: formatters.area,
    
    // Status formatters
    propertyStatus: formatters.status.property,
    verificationStatus: formatters.status.verification,
  }
};