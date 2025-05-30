// frontend/src/components/property/PropertyFiltersPanel.tsx
'use client';
import { PropertyFilters } from '@/types/filters';
import { University } from '@/types/api';
import PriceRangeSlider from '@/components/filters/PriceRangeSlider';
import AmenitiesFilter from '@/components/filters/AmenitiesFilter';
import DistanceFilter from '@/components/filters/DistanceFilter';
import { X } from 'lucide-react';

interface PropertyFiltersPanelProps {
  filters: PropertyFilters;
  universities: University[];
  onFilterChange: <K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export default function PropertyFiltersPanel({
  filters,
  universities,
  onFilterChange,
  onClose,
  isMobile = false,
}: PropertyFiltersPanelProps) {
    const safeUniversities = Array.isArray(universities) ? universities : [];
  return (
    <div className="bg-white rounded-lg shadow-sm h-full overflow-y-auto">
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Filters</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-stone-100"
          >
            <X className="h-5 w-5 text-stone-500" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Price Range */}
        <PriceRangeSlider
          min={0}
          max={20000}
          value={[filters.priceMin || 0, filters.priceMax || 20000]}
          onChange={([min, max]) => {
            onFilterChange('priceMin', min);
            onFilterChange('priceMax', max);
          }}
        />

        {/* Property Type */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-700">Property Type</h3>
          <div className="space-y-2">
            {['apartment', 'house', 'room', 'studio'].map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="propertyType"
                  value={type}
                  checked={filters.propertyType === type}
                  onChange={(e) => onFilterChange('propertyType', e.target.value)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-stone-700 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Bedrooms
            </label>
            <select
              value={filters.bedrooms || ''}
              onChange={(e) => onFilterChange('bedrooms', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-stone-200 rounded-md"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>{num}+</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Bathrooms
            </label>
            <select
              value={filters.bathrooms || ''}
              onChange={(e) => onFilterChange('bathrooms', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-stone-200 rounded-md"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4].map((num) => (
                <option key={num} value={num}>{num}+</option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Features */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-700">Room Features</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.furnished || false}
                onChange={(e) => onFilterChange('furnished', e.target.checked)}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-stone-700">Furnished</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.petFriendly || false}
                onChange={(e) => onFilterChange('petFriendly', e.target.checked)}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-stone-700">Pet Friendly</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.smokingAllowed || false}
                onChange={(e) => onFilterChange('smokingAllowed', e.target.checked)}
                className="mr-2 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-stone-700">Smoking Allowed</span>
            </label>
          </div>
        </div>

        {/* Distance from University */}
        <DistanceFilter
            universities={safeUniversities}
            selectedUniversity={filters.universityId}
            maxDistance={filters.maxDistance}
            onUniversityChange={(id) => onFilterChange('universityId', id)}
            onDistanceChange={(distance) => onFilterChange('maxDistance', distance)}
        />

        {/* Amenities */}
        <AmenitiesFilter
          selectedAmenities={filters.amenities || []}
          onChange={(amenities) => onFilterChange('amenities', amenities)}
        />
      </div>
    </div>
  );
}