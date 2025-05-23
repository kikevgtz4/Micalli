// frontend/src/utils/formatters.ts

export const formatters = {
  // Currency formatting for Mexican Pesos
  currency: (amount: number | string, currency = 'MXN'): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return '$0';
    
    // Format with Mexican Peso symbol and commas
    if (currency === 'MXN') {
      return `$${numAmount.toLocaleString('es-MX')}`;
    }
    
    // Default to USD formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  },

  // Number formatting with commas
  number: (num: number | string): string => {
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return '0';
    return numValue.toLocaleString();
  },

  // Percentage formatting
  percentage: (value: number | string, decimals = 1): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0%';
    return `${numValue.toFixed(decimals)}%`;
  },

  // Date formatting functions
  date: {
    // Standard date format: Jan 15, 2024
    standard: (dateString: string): string => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },

    // Short date format: 01/15/24
    short: (dateString: string): string => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
      });
    },

    // Long date format: Monday, January 15, 2024
    long: (dateString: string): string => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },

    // Relative date format: 2 days ago, in 3 days
    relative: (dateString: string): string => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = date.getTime() - now.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const absDays = Math.abs(diffInDays);

      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Tomorrow';
      if (diffInDays === -1) return 'Yesterday';
      
      if (diffInDays > 0) {
        if (absDays < 7) return `In ${absDays} days`;
        if (absDays < 30) return `In ${Math.floor(absDays / 7)} weeks`;
        return formatters.date.standard(dateString);
      } else {
        if (absDays < 7) return `${absDays} days ago`;
        if (absDays < 30) return `${Math.floor(absDays / 7)} weeks ago`;
        return formatters.date.standard(dateString);
      }
    },

    // Time format: 2:30 PM
    time: (dateString: string): string => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Time';
      
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    },

    // DateTime format: Jan 15, 2024 at 2:30 PM
    dateTime: (dateString: string): string => {
      return `${formatters.date.standard(dateString)} at ${formatters.date.time(dateString)}`;
    },

    // ISO format for form inputs: 2024-01-15
    iso: (dateString: string): string => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toISOString().split('T')[0];
    }
  },

  // Distance formatting
  distance: (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  },

  // Area formatting
  area: (squareMeters: number): string => {
    return `${formatters.number(squareMeters)} m²`;
  },

  // Phone number formatting
  phone: (phoneNumber: string): string => {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Mexican phone number format
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    // International format
    if (cleaned.length === 12 && cleaned.startsWith('52')) {
      return `+52 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
    }
    
    // Return as-is if format not recognized
    return phoneNumber;
  },

  // Text formatting
  text: {
    // Capitalize first letter
    capitalize: (text: string): string => {
      if (!text) return '';
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },

    // Title case
    titleCase: (text: string): string => {
      if (!text) return '';
      return text
        .split(' ')
        .map(word => formatters.text.capitalize(word))
        .join(' ');
    },

    // Truncate text with ellipsis
    truncate: (text: string, maxLength: number): string => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return `${text.substring(0, maxLength)}...`;
    },

    // Pluralize text based on count
    pluralize: (text: string, count: number, pluralForm?: string): string => {
      if (count === 1) return text;
      return pluralForm || `${text}s`;
    },

    // Remove extra whitespace
    cleanWhitespace: (text: string): string => {
      return text.replace(/\s+/g, ' ').trim();
    }
  },

  // Status formatting
  status: {
    // Property status badge classes
    property: (isActive: boolean): { text: string; className: string } => {
      if (isActive) {
        return {
          text: 'Active',
          className: 'bg-green-100 text-green-800'
        };
      }
      return {
        text: 'Inactive',
        className: 'bg-red-100 text-red-800'
      };
    },

    // User verification status
    verification: (isVerified: boolean): { text: string; className: string } => {
      if (isVerified) {
        return {
          text: 'Verified',
          className: 'bg-blue-100 text-blue-800'
        };
      }
      return {
        text: 'Unverified',
        className: 'bg-gray-100 text-gray-800'
      };
    },

    // Message status
    message: (read: boolean): { text: string; className: string } => {
      if (read) {
        return {
          text: 'Read',
          className: 'bg-gray-100 text-gray-600'
        };
      }
      return {
        text: 'Unread',
        className: 'bg-indigo-100 text-indigo-800'
      };
    }
  },

  // List formatting
  list: {
    // Join array with commas and "and"
    natural: (items: string[]): string => {
      if (!items || items.length === 0) return '';
      if (items.length === 1) return items[0];
      if (items.length === 2) return `${items[0]} and ${items[1]}`;
      
      const lastItem = items[items.length - 1];
      const otherItems = items.slice(0, -1);
      return `${otherItems.join(', ')}, and ${lastItem}`;
    },

    // Join with bullets
    bulleted: (items: string[]): string => {
      if (!items || items.length === 0) return '';
      return items.map(item => `• ${item}`).join('\n');
    }
  },

  // URL formatting
  url: {
    // Ensure URL has protocol
    ensureProtocol: (url: string): string => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      return `https://${url}`;
    },

    // Extract domain from URL
    domain: (url: string): string => {
      try {
        const urlObj = new URL(formatters.url.ensureProtocol(url));
        return urlObj.hostname;
      } catch {
        return url;
      }
    }
  },

  // File size formatting
  fileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Property specific formatters
  property: {
    // Format bedrooms/bathrooms
    rooms: (bedrooms: number, bathrooms: number): string => {
      const bedText = formatters.text.pluralize('bedroom', bedrooms);
      const bathText = formatters.text.pluralize('bathroom', bathrooms);
      return `${bedrooms} ${bedText}, ${bathrooms} ${bathText}`;
    },

    // Format property type
    type: (type: string): string => {
      return formatters.text.capitalize(type);
    },

    // Format amenities list
    amenities: (amenities: string[]): string => {
      if (!amenities || amenities.length === 0) return 'No amenities listed';
      return formatters.list.natural(amenities);
    },

    // Format minimum stay
    minimumStay: (months: number): string => {
      if (months === 1) return '1 month minimum';
      return `${months} months minimum`;
    }
  }
};

// Export individual formatter categories for convenience
export const { currency, number, percentage, date, distance, area, phone, text, status, list, url, fileSize, property } = formatters;