// components/property/AddressField.tsx
'use client';
import { useState } from 'react';
import AddressAutocomplete from './AddressAutocomplete';
import LocationPicker from './LocationPicker';
import { GeocodingResult } from '@/utils/geocoding';
import { MapIcon, PencilIcon } from '@heroicons/react/24/outline';

interface AddressFieldProps {
  address: string;
  latitude: string;
  longitude: string;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (lat: string, lng: string) => void;
  errors?: {
    address?: string;
  };
  required?: boolean;
}

export default function AddressField({
  address,
  latitude,
  longitude,
  onAddressChange,
  onCoordinatesChange,
  errors,
  required = false,
}: AddressFieldProps) {
  const [showMap, setShowMap] = useState(false);
  const [hasLocationSet, setHasLocationSet] = useState(!!latitude && !!longitude);

  const handleLocationSelect = (location: GeocodingResult) => {
    onCoordinatesChange(
      location.latitude.toString(),
      location.longitude.toString()
    );
    setHasLocationSet(true);
  };

  const handleMapLocationChange = (lat: number, lng: number, newAddress?: string) => {
    onCoordinatesChange(lat.toString(), lng.toString());
    if (newAddress) {
      onAddressChange(newAddress);
    }
    setHasLocationSet(true);
  };

  return (
    <div className="space-y-4">
      {/* Address Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Property Address
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <AddressAutocomplete
          value={address}
          onChange={onAddressChange}
          onLocationSelect={handleLocationSelect}
          placeholder="Start typing your property address..."
          required={required}
          error={errors?.address}
        />

        {/* Location status */}
        {hasLocationSet && (
          <div className="mt-2 flex items-center text-sm text-green-600">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Location coordinates set
          </div>
        )}
      </div>

      {/* Map Toggle Button */}
      <div>
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {showMap ? (
            <>
              <PencilIcon className="h-4 w-4" />
              <span>Hide map</span>
            </>
          ) : (
            <>
              <MapIcon className="h-4 w-4" />
              <span>Fine-tune location on map</span>
            </>
          )}
        </button>
      </div>

      {/* Map */}
      {showMap && (
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <LocationPicker
            latitude={latitude ? parseFloat(latitude) : undefined}
            longitude={longitude ? parseFloat(longitude) : undefined}
            address={address}
            onLocationChange={handleMapLocationChange}
          />
        </div>
      )}
    </div>
  );
}