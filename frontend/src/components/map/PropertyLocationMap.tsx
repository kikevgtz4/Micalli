// frontend/src/components/map/PropertyLocationMap.tsx
'use client';
import { useRef, useEffect, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPinIcon } from '@heroicons/react/24/outline';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface PropertyLocationMapProps {
  latitude: number;
  longitude: number;
  privacyRadius?: number;
  title: string;
  height?: string;
}

// Helper function to generate consistent random offset
const generateConsistentOffset = (propertyId: number, radius: number, latitude: number) => {
  // Use property ID as seed for consistent randomness
  const seed = propertyId || 1;
  
  // Simple pseudo-random based on seed (will always give same result for same ID)
  const random1 = ((seed * 9301 + 49297) % 233280) / 233280;
  const random2 = ((seed * 5923 + 72353) % 233280) / 233280;
  
  // Generate random angle (0-360 degrees)
  const angle = random1 * 2 * Math.PI;
  
  // Generate random distance (20-50% of radius to ensure property is within circle)
  const distance = radius * (0.2 + random2 * 0.3);
  
  // Calculate offset in degrees
  const offsetLat = (distance * Math.cos(angle)) / 111320; // meters to degrees latitude
  const offsetLng = (distance * Math.sin(angle)) / (111320 * Math.cos(latitude * Math.PI / 180)); // meters to degrees longitude
  
  return { offsetLat, offsetLng };
};

export default function PropertyLocationMap({
  latitude,
  longitude,
  privacyRadius = 250, // Default 150m radius
  title,
  height = '400px',
}: PropertyLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const animationRef = useRef<{ id?: number; isActive: boolean }>({ isActive: false });
  const [isMaxZoom, setIsMaxZoom] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Don't initialize if we don't have valid coordinates
    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      console.warn('Invalid coordinates for map:', { latitude, longitude });
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [longitude, latitude],
      zoom: 15,
      maxZoom: 17,
      pitch: 30,
      bearing: 0,
      interactive: true
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Monitor zoom level to show feedback
    map.current.on('zoom', () => {
      if (map.current) {
        const currentZoom = map.current.getZoom();
        setIsMaxZoom(currentZoom >= 16.8);
      }
    });

    map.current.on('load', () => {
      setIsLoading(false);
      if (!map.current) return;

      // Force fly to the correct location after load
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 1000
      });

      // Add the privacy circle source at OFFSET location
      map.current.addSource('privacy-area', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude] // Use offset center
          }
        }
      });

      // Optional: Add a very faint indication of general area
      map.current.addSource('general-area', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude] // Actual location
          }
        }
      });

      // Very subtle larger area glow (optional - you can remove this if too revealing)
      map.current.addLayer({
        id: 'general-area-hint',
        type: 'circle',
        source: 'general-area',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [22, privacyRadius * 3 / 0.075]
            ],
            base: 2
          },
          'circle-color': '#6366F1',
          'circle-opacity': 0.02, // Extremely faint
          'circle-blur': 2,
          'circle-pitch-alignment': 'map'
        }
      });

      // Add multiple layers for gradient effect with proper scaling
      // Outer glow
      map.current.addLayer({
        id: 'privacy-glow',
        type: 'circle',
        source: 'privacy-area',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [22, privacyRadius * 1.2 / 0.075]
            ],
            base: 2
          },
          'circle-color': '#6366F1',
          'circle-opacity': 0.1,
          'circle-blur': 1.5,
          'circle-pitch-alignment': 'map'
        }
      });

      // Middle ring
      map.current.addLayer({
        id: 'privacy-ring',
        type: 'circle',
        source: 'privacy-area',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [22, privacyRadius * 1.1 / 0.075]
            ],
            base: 2
          },
          'circle-color': '#6366F1',
          'circle-opacity': 0.15,
          'circle-blur': 0.8,
          'circle-pitch-alignment': 'map'
        }
      });

      // Main privacy circle
      map.current.addLayer({
        id: 'privacy-circle',
        type: 'circle',
        source: 'privacy-area',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [22, privacyRadius / 0.075]
            ],
            base: 2
          },
          'circle-color': '#6366F1',
          'circle-opacity': 0.25,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#6366F1',
          'circle-stroke-opacity': 0.5,
          'circle-pitch-alignment': 'map'
        }
      });

      // Add center point (at offset location)
      map.current.addLayer({
        id: 'center-point',
        type: 'circle',
        source: 'privacy-area',
        paint: {
          'circle-radius': 6,
          'circle-color': '#4F46E5',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 1
        }
      });

      // Set animation as active
      animationRef.current.isActive = true;

      // Wait a bit to ensure layers are fully loaded before starting animation
      setTimeout(() => {
        if (!map.current || !animationRef.current.isActive) return;

        // Add a subtle animation
        let opacity = 0.25;
        let increasing = true;

        const animateCircle = () => {
          if (!animationRef.current.isActive || !map.current) {
            return;
          }

          try {
            if (!map.current.getLayer('privacy-circle')) {
              return;
            }

            if (increasing) {
              opacity += 0.002;
              if (opacity >= 0.35) increasing = false;
            } else {
              opacity -= 0.002;
              if (opacity <= 0.15) increasing = true;
            }

            map.current.setPaintProperty('privacy-circle', 'circle-opacity', opacity);
            animationRef.current.id = requestAnimationFrame(animateCircle);
          } catch (error) {
            console.warn('Animation error:', error);
            animationRef.current.isActive = false;
          }
        };

        animateCircle();
      }, 100);
    });

    return () => {
      animationRef.current.isActive = false;
      if (animationRef.current.id) {
        cancelAnimationFrame(animationRef.current.id);
      }
      map.current?.remove();
    };
  }, [latitude, longitude, privacyRadius]);

  return (
    <div className="relative">
      {/* Add loading overlay */}
      {(!latitude || !longitude || isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-xl z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height }} 
        className="rounded-xl overflow-hidden shadow-lg"
      />
      
      {/* Overlay with location notice */}
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-xs">
        <div className="bg-white/95 backdrop-blur-md rounded-lg p-4 shadow-lg border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <MapPinIcon className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Approximate Location
              </h3>
              <p className="text-gray-600 text-xs mt-1">
                The exact address will be provided once your booking is confirmed. 
                The property is located within the highlighted area.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4">
        <div className="bg-white/95 backdrop-blur-md rounded-lg px-3 py-2 shadow-md border border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500 opacity-30 ring-2 ring-indigo-500 ring-opacity-50"></div>
            <span className="text-xs font-medium text-gray-700">
              ~{privacyRadius}m radius
            </span>
          </div>
        </div>
      </div>

      {/* Max zoom indicator */}
      {isMaxZoom && (
        <div className="absolute top-1/10 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-fade-in">
          <div className="bg-black/75 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Maximum zoom reached
          </div>
        </div>
      )}
    </div>
  );
}