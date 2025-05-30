// frontend/src/components/filters/DistanceFilter.tsx
'use client';
import { University } from '@/types/api';

interface DistanceFilterProps {
  universities: University[];
  selectedUniversity?: number;
  maxDistance?: number;
  onUniversityChange: (universityId?: number) => void;
  onDistanceChange: (distance?: number) => void;
}

export default function DistanceFilter({
  universities,
  selectedUniversity,
  maxDistance,
  onUniversityChange,
  onDistanceChange,
}: DistanceFilterProps) {
  // Add safety check
  const safeUniversities = Array.isArray(universities) ? universities : [];
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          University
        </label>
        <select
          value={selectedUniversity || ''}
          onChange={(e) => onUniversityChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Universities</option>
          {safeUniversities.map((uni) => (
            <option key={uni.id} value={uni.id}>
              {uni.name}
            </option>
          ))}
        </select>
      </div>
      
      {selectedUniversity && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Maximum Distance: {maxDistance || 5} km
          </label>
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={maxDistance || 5}
            onChange={(e) => onDistanceChange(Number(e.target.value))}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-stone-500 mt-1">
            <span>0.5 km</span>
            <span>10 km</span>
          </div>
        </div>
      )}
    </div>
  );
}