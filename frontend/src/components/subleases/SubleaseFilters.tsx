// frontend/src/components/subleases/SubleaseFilters.tsx
'use client';

import { useState, useEffect } from 'react';
import type { SubleaseFilters, ListingType, SubleaseType, UrgencyLevel } from '@/types/sublease';
import { formatters } from '@/utils/formatters';

interface SubleaseFiltersProps {
  filters: SubleaseFilters;
  onFilterChange: <K extends keyof SubleaseFilters>(key: K, value: SubleaseFilters[K]) => void;
  onClearFilters: () => void;
  className?: string;
}

export default function SubleaseFilters({
  filters,
  onFilterChange,
  onClearFilters,
  className = '',
}: SubleaseFiltersProps) {
  const [priceRange, setPriceRange] = useState({
    min: filters.minRent || 0,
    max: filters.maxRent || 50000,
  });

  // Sync price range with filters
  useEffect(() => {
    setPriceRange({
      min: filters.minRent || 0,
      max: filters.maxRent || 50000,
    });
  }, [filters.minRent, filters.maxRent]);

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const newRange = { ...priceRange, [type]: value };
    setPriceRange(newRange);
    
    // Debounce the filter update
    const timeoutId = setTimeout(() => {
      onFilterChange(type === 'min' ? 'minRent' : 'maxRent', value || undefined);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  // Get today's date for date inputs
  const today = new Date().toISOString().split('T')[0];

  const listingTypes: { value: ListingType; label: string }[] = [
    { value: 'summer', label: 'Summer' },
    { value: 'semester', label: 'Semester' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'takeover', label: 'Lease Takeover' },
  ];

  const subleaseTypes: { value: SubleaseType; label: string }[] = [
    { value: 'entire_place', label: 'Entire Place' },
    { value: 'private_room', label: 'Private Room' },
    { value: 'shared_room', label: 'Shared Room' },
  ];

  const urgencyLevels: { value: UrgencyLevel; label: string; color: string }[] = [
    { value: 'urgent', label: '🔥 Urgent', color: 'text-red-600' },
    { value: 'high', label: 'High Priority', color: 'text-amber-600' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600' },
    { value: 'low', label: 'Low', color: 'text-gray-600' },
  ];

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof SubleaseFilters];
    return value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true);
  });

  const toggleArrayFilter = (key: keyof SubleaseFilters, value: any) => {
    const currentValues = (filters[key] as any[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange(key, newValues.length > 0 ? newValues : undefined);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilterChange('search', e.target.value || undefined)}
          placeholder="Search subleases..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Listing Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Listing Type
        </label>
        <div className="space-y-2">
          {listingTypes.map(type => (
            <label key={type.value} className="flex items-center">
              <input
                type="checkbox"
                checked={((filters.listingType as ListingType[]) || []).includes(type.value)}
                onChange={() => toggleArrayFilter('listingType', type.value)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sublease Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Space Type
        </label>
        <div className="space-y-2">
          {subleaseTypes.map(type => (
            <label key={type.value} className="flex items-center">
              <input
                type="checkbox"
                checked={((filters.subleaseType as SubleaseType[]) || []).includes(type.value)}
                onChange={() => toggleArrayFilter('subleaseType', type.value)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Urgency Level */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Urgency
        </label>
        <div className="space-y-2">
          {urgencyLevels.map(level => (
            <label key={level.value} className="flex items-center">
              <input
                type="checkbox"
                checked={((filters.urgencyLevel as UrgencyLevel[]) || []).includes(level.value)}
                onChange={() => toggleArrayFilter('urgencyLevel', level.value)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className={`ml-2 text-sm ${level.color}`}>{level.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monthly Rent
        </label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={priceRange.min}
              onChange={(e) => handlePriceChange('min', parseInt(e.target.value) || 0)}
              placeholder="Min"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              value={priceRange.max}
              onChange={(e) => handlePriceChange('max', parseInt(e.target.value) || 0)}
              placeholder="Max"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="text-xs text-gray-500 text-center">
            ${formatters.number(priceRange.min)} - ${formatters.number(priceRange.max)} MXN
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Dates
        </label>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Start after</label>
            <input
              type="date"
              value={filters.startDateAfter || ''}
              onChange={(e) => onFilterChange('startDateAfter', e.target.value || undefined)}
              min={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End before</label>
            <input
              type="date"
              value={filters.endDateBefore || ''}
              onChange={(e) => onFilterChange('endDateBefore', e.target.value || undefined)}
              min={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Room Details */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Room Details
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Bedrooms</label>
            <select
              value={filters.bedrooms || ''}
              onChange={(e) => onFilterChange('bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Any</option>
              <option value="0">Studio</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4+</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Bathrooms</label>
            <select
              value={filters.bathrooms || ''}
              onChange={(e) => onFilterChange('bathrooms', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Any</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amenities
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.furnished || false}
              onChange={(e) => onFilterChange('furnished', e.target.checked || undefined)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Furnished</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.petFriendly || false}
              onChange={(e) => onFilterChange('petFriendly', e.target.checked || undefined)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Pet Friendly</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.smokingAllowed || false}
              onChange={(e) => onFilterChange('smokingAllowed', e.target.checked || undefined)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Smoking Allowed</span>
          </label>
        </div>
      </div>

      {/* Active Filter Count */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {Object.keys(filters).filter(key => {
              const value = filters[key as keyof SubleaseFilters];
              return value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true);
            }).length} filters active
          </p>
        </div>
      )}
    </div>
  );
}