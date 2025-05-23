// frontend/src/utils/helpers.ts
export const helpers = {
  // Format currency for display
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  // Format numbers with thousands separator
  formatNumber: (num: number): string => {
    return new Intl.NumberFormat('es-MX').format(num);
  },

  // Format dates consistently
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Get error message from API error
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

  // Debounce function for search inputs
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

  // Capitalize first letter
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Truncate text with ellipsis
  truncate: (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  },

  // Safe localStorage operations
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
  }
};