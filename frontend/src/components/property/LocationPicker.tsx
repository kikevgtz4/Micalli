// components/property/LocationPicker.tsx
'use client';
import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { geocodingService } from '@/utils/geocoding';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  height?: string;
}

export default function LocationPicker({
  latitude,
  longitude,
  address,
  onLocationChange,
  height = '400px',
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Default to Monterrey center if no coordinates
    const initialLat = latitude || 25.6866;
    const initialLng = longitude || -100.3161;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLng, initialLat],
      zoom: latitude && longitude ? 16 : 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: '#4F46E5',
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    // Handle marker drag
    marker.current.on('dragend', async () => {
      const lngLat = marker.current!.getLngLat();
      setIsLoadingAddress(true);
      
      try {
        const result = await geocodingService.reverseGeocode(lngLat.lng, lngLat.lat);
        onLocationChange(lngLat.lat, lngLat.lng, result?.address);
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        onLocationChange(lngLat.lat, lngLat.lng);
      } finally {
        setIsLoadingAddress(false);
      }
    });

    // Handle map click
    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      marker.current!.setLngLat([lng, lat]);
      
      setIsLoadingAddress(true);
      try {
        const result = await geocodingService.reverseGeocode(lng, lat);
        onLocationChange(lat, lng, result?.address);
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        onLocationChange(lat, lng);
      } finally {
        setIsLoadingAddress(false);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []); // Only run once on mount

  // Update marker position when props change
  useEffect(() => {
    if (marker.current && latitude && longitude) {
      marker.current.setLngLat([longitude, latitude]);
      map.current?.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        duration: 1000,
      });
    }
  }, [latitude, longitude]);

  return (
    <div className="relative">
      <div ref={mapContainer} style={{ height }} className="rounded-lg overflow-hidden" />
      
      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 max-w-xs">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Click on the map</span> or{' '}
          <span className="font-medium">drag the marker</span> to set the exact location
        </p>
      </div>

      {/* Loading indicator */}
      {isLoadingAddress && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
          <span className="text-sm text-gray-600">Getting address...</span>
        </div>
      )}

      {/* Current location display */}
      {latitude && longitude && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-3 max-w-sm">
          <p className="text-xs text-gray-600">Current location:</p>
          <p className="text-sm font-mono text-gray-800">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}