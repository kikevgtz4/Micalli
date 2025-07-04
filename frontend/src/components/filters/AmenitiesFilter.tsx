// frontend/src/components/filters/AmenitiesFilter.tsx
'use client';
import { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';

interface AmenitiesFilterProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
}

const AVAILABLE_AMENITIES = [
  { value: 'wifi', label: 'WiFi', icon: '📶' },
  { value: 'air_conditioning', label: 'Air Conditioning', icon: '❄️' },
  { value: 'heating', label: 'Heating', icon: '🔥' },
  { value: 'washing_machine', label: 'Washing Machine', icon: '🧺' },
  { value: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { value: 'parking', label: 'Parking', icon: '🚗' },
  { value: 'gym', label: 'Gym', icon: '💪' },
  { value: 'pool', label: 'Swimming Pool', icon: '🏊' },
  { value: 'security', label: 'Security System', icon: '🔒' },
  { value: 'elevator', label: 'Elevator', icon: '🛗' },
  { value: 'balcony', label: 'Balcony', icon: '🏠' },
  { value: 'study_room', label: 'Study Room', icon: '📚' },
];

export default function AmenitiesFilter({ 
  selectedAmenities, 
  onChange 
}: AmenitiesFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = (amenity: string) => {
    const updated = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity];
    onChange(updated);
  };

  const displayedAmenities = isExpanded 
    ? AVAILABLE_AMENITIES 
    : AVAILABLE_AMENITIES.slice(0, 6);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-stone-700">Amenities</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {displayedAmenities.map((amenity) => (
          <label
            key={amenity.value}
            className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
              selectedAmenities.includes(amenity.value)
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'bg-white border-stone-200 hover:bg-stone-50 text-gray-600'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedAmenities.includes(amenity.value)}
              onChange={() => handleToggle(amenity.value)}
              className="sr-only"
            />
            <span className="text-lg">{amenity.icon}</span>
            <span className="text-sm">{amenity.label}</span>
          </label>
        ))}
      </div>
      
      {AVAILABLE_AMENITIES.length > 6 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm text-primary-600 hover:text-primary-700"
        >
          {isExpanded ? 'Show less' : 'Show more'}
          <ChevronDownIcon 
            className={`ml-1 h-4 w-4 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}
    </div>
  );
}