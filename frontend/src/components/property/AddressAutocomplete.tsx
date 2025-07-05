// components/property/AddressAutocomplete.tsx
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { geocodingService, GeocodingResult } from '@/utils/geocoding';
import { useDebounce } from '@/hooks/useDebounce';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onLocationSelect: (location: GeocodingResult) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Enter property address...",
  required = false,
  error,
  disabled = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce search query to reduce API calls
  const debouncedValue = useDebounce(value, 300);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for addresses
  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 3 || disabled) {
      setSuggestions([]);
      return;
    }

    const searchAddresses = async () => {
      setIsLoading(true);
      try {
        const results = await geocodingService.searchAddress(debouncedValue);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchAddresses();
  }, [debouncedValue, disabled]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle suggestion selection
  const handleSelect = (result: GeocodingResult) => {
    onChange(result.address);
    onLocationSelect(result);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          disabled={disabled}
          required={required}
          className={`
            w-full pl-10 pr-10 py-3 border-2 rounded-lg transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${error 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          `}
          placeholder={placeholder}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`
                w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                ${index === selectedIndex ? 'bg-gray-50' : ''}
                ${index !== suggestions.length - 1 ? 'border-b border-gray-100' : ''}
              `}
            >
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {suggestion.address}
                  </p>
                  {suggestion.context.neighborhood && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {suggestion.context.neighborhood}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${suggestion.confidence === 'exact' ? 'bg-green-100 text-green-700' : 
                        suggestion.confidence === 'high' ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-700'}
                    `}>
                      {suggestion.confidence} match
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <XMarkIcon className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}