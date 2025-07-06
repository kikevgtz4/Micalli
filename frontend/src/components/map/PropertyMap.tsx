// frontend/src/components/map/PropertyMap.tsx
'use client';
import { useRef, useEffect, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface Property {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  price: number;
  privacyRadius?: number; // Radius in meters
  bedrooms?: number;
  bathrooms?: number;
  imageUrl?: string;
}

interface PropertyMapProps {
  properties: Property[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  height?: string;
  onMarkerClick?: (propertyId: number) => void;
  showExactLocation?: boolean;
  selectedPropertyId?: number;
}

export default function PropertyMap({
  properties,
  centerLat = 25.6866, // Default to Monterrey coordinates
  centerLng = -100.3161,
  zoom = 12,
  height = '500px',
  onMarkerClick,
  showExactLocation = false,
  selectedPropertyId
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Lighter, cleaner style
      center: [centerLng, centerLat],
      zoom: zoom,
      maxZoom: showExactLocation ? 20 : 17 // Limit zoom in privacy mode
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 200,
      unit: 'metric'
    }), 'bottom-right');
    
    map.current.on('load', () => {
      setMapLoaded(true);
    });
    
    return () => {
      map.current?.remove();
    };
  }, [centerLat, centerLng, zoom]);

  // Helper function to calculate meters per pixel at given latitude and zoom
  const metersPerPixel = (latitude: number, zoomLevel: number) => {
    const earthCircumference = 40075017; // meters at equator
    const latRadians = latitude * (Math.PI / 180);
    return (earthCircumference * Math.cos(latRadians)) / Math.pow(2, zoomLevel + 8);
  };

  // Add markers or circles based on privacy settings
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    // Clean up existing layers and sources
    if (map.current.getLayer('property-circles')) {
      map.current.removeLayer('property-circles');
    }
    if (map.current.getLayer('property-circles-blur')) {
      map.current.removeLayer('property-circles-blur');
    }
    if (map.current.getLayer('property-labels')) {
      map.current.removeLayer('property-labels');
    }
    if (map.current.getSource('properties')) {
      map.current.removeSource('properties');
    }
    
    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    if (showExactLocation) {
      // EXACT LOCATION MODE - Modern price bubble markers
      properties.forEach(property => {
        // Create custom marker element
        const markerEl = document.createElement('div');
        markerEl.className = 'property-marker';
        
        // Determine if this marker is selected
        const isSelected = property.id === selectedPropertyId;
        
        // Style the marker
        markerEl.innerHTML = `
          <div class="marker-content ${isSelected ? 'selected' : ''}">
            <span class="price">$${Math.round(property.price / 1000)}k</span>
          </div>
        `;
        
        // Create the marker
        const marker = new mapboxgl.Marker({
          element: markerEl,
          anchor: 'center'
        })
          .setLngLat([property.longitude, property.latitude])
          .addTo(map.current!);
        
        // Add hover effect
        markerEl.addEventListener('mouseenter', () => {
          markerEl.classList.add('hovered');
        });
        
        markerEl.addEventListener('mouseleave', () => {
          markerEl.classList.remove('hovered');
        });
        
        // Add click handler
        markerEl.addEventListener('click', () => {
          if (onMarkerClick) {
            onMarkerClick(property.id);
          }
          
          // Show popup with property details
          new mapboxgl.Popup({
            offset: [0, -40],
            className: 'property-popup'
          })
            .setLngLat([property.longitude, property.latitude])
            .setHTML(`
              <div class="popup-content">
                <h3>${property.title}</h3>
                <p class="details">
                  ${property.bedrooms || 0} bed • ${property.bathrooms || 0} bath
                </p>
                <p class="price">$${property.price.toLocaleString()}/month</p>
              </div>
            `)
            .addTo(map.current!);
        });
        
        markersRef.current.push(marker);
      });
    } else {
      // PRIVACY MODE - Animated circles with proper radius scaling
      const features = properties.map(property => ({
        type: 'Feature' as const,
        properties: {
          id: property.id,
          title: property.title,
          price: property.price,
                      radius: property.privacyRadius || 250, // Default 250m radius
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [property.longitude, property.latitude]
        }
      }));
      
      // Add source
      map.current.addSource('properties', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features
        }
      });
      
      // Add circle layer with proper radius calculation
      map.current.addLayer({
        id: 'property-circles',
        type: 'circle',
        source: 'properties',
        paint: {
          // Calculate circle radius in pixels from meters
          'circle-radius': {
            property: 'radius',
            stops: [
              [{zoom: 0, value: 0}, 0],
              [{zoom: 0, value: 150}, 0],
              [{zoom: 22, value: 0}, 0],
              [{zoom: 22, value: 150}, 150 / 0.075]
            ],
            base: 2
          },
          'circle-color': [
            'case',
            ['==', ['get', 'id'], selectedPropertyId || -1],
            '#4F46E5',
            '#6366F1'
          ],
          'circle-opacity': [
            'case',
            ['==', ['get', 'id'], selectedPropertyId || -1],
            0.4,
            0.3
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': [
            'case',
            ['==', ['get', 'id'], selectedPropertyId || -1],
            '#4F46E5',
            '#6366F1'
          ],
          'circle-stroke-opacity': 0.8,
          'circle-pitch-alignment': 'map'
        }
      });
      
      // Add blur/glow effect layer
      map.current.addLayer({
        id: 'property-circles-blur',
        type: 'circle',
        source: 'properties',
        paint: {
          'circle-radius': {
            property: 'radius',
            stops: [
              [{zoom: 0, value: 0}, 0],
              [{zoom: 0, value: 150}, 0],
              [{zoom: 22, value: 0}, 0],
              [{zoom: 22, value: 150}, 150 * 1.5 / 0.075]
            ],
            base: 2
          },
          'circle-color': '#818CF8',
          'circle-opacity': 0.2,
          'circle-blur': 1,
          'circle-pitch-alignment': 'map'
        }
      }, 'property-circles'); // Place below main circles
      
      // Add price labels with modern styling
      map.current.addLayer({
        id: 'property-labels',
        type: 'symbol',
        source: 'properties',
        layout: {
          'text-field': ['concat', '$', ['to-string', ['/', ['get', 'price'], 1000]], 'k'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 11,
            15, 14,
            20, 16
          ],
          'text-anchor': 'center',
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#1F2937',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2,
          'text-halo-blur': 1
        }
      });
      
      // Add click handler for circles
      map.current.on('click', 'property-circles', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const coordinates = (feature.geometry as any).coordinates.slice();
          const props = feature.properties as any;
          
          // Create popup with glassmorphism effect
          new mapboxgl.Popup({
            className: 'property-popup-glass',
            offset: [0, -10]
          })
            .setLngLat(coordinates)
            .setHTML(`
              <div class="popup-content-glass">
                <h3>${props.title}</h3>
                <p class="location-notice">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/>
                  </svg>
                  Approximate location
                </p>
                <div class="property-details">
                  <span>${props.bedrooms} bed</span>
                  <span>•</span>
                  <span>${props.bathrooms} bath</span>
                </div>
                <p class="price">$${props.price.toLocaleString()}/month</p>
              </div>
            `)
            .addTo(map.current!);
          
          // Trigger click handler if provided
          if (onMarkerClick) {
            onMarkerClick(props.id);
          }
        }
      });
      
      // Change cursor on hover
      map.current.on('mouseenter', 'property-circles', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'property-circles', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      
      // Add hover effect
      let hoveredStateId: number | undefined = undefined;
      
      map.current.on('mousemove', 'property-circles', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredStateId !== undefined) {
            map.current!.setFeatureState(
              { source: 'properties', id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = e.features[0].properties!.id;
          if (hoveredStateId !== undefined) {
            map.current!.setFeatureState(
              { source: 'properties', id: hoveredStateId },
              { hover: true }
            );
          }
        }
      });
      
      map.current.on('mouseleave', 'property-circles', () => {
        if (hoveredStateId !== undefined) {
          map.current!.setFeatureState(
            { source: 'properties', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = undefined;
      });
    }
  }, [properties, mapLoaded, showExactLocation, onMarkerClick, selectedPropertyId, centerLat]);

  return (
    <>
      <style jsx global>{`
        /* Modern marker styles */
        .property-marker {
          cursor: pointer;
          transform: translate(-50%, -50%);
          transition: all 0.2s ease;
          z-index: 1;
        }
        
        .marker-content {
          background: white;
          border-radius: 20px;
          padding: 6px 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 2px solid transparent;
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .marker-content.selected {
          background: #4F46E5;
          transform: scale(1.1);
          z-index: 10;
        }
        
        .marker-content:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          border-color: #4F46E5;
          z-index: 10;
        }
        
        .marker-content.selected:hover {
          transform: scale(1.2);
        }
        
        .marker-content .price {
          font-weight: 600;
          font-size: 14px;
          color: #1F2937;
          white-space: nowrap;
        }
        
        .marker-content.selected .price {
          color: white;
        }
        
        /* Popup styles */
        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
        }
        
        .popup-content {
          padding: 16px;
          min-width: 200px;
        }
        
        .popup-content h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1F2937;
        }
        
        .popup-content .details {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #6B7280;
        }
        
        .popup-content .price {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #4F46E5;
        }
        
        /* Glassmorphism popup for privacy mode */
        .property-popup-glass .mapboxgl-popup-content {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .popup-content-glass {
          padding: 16px;
          min-width: 220px;
        }
        
        .popup-content-glass h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1F2937;
        }
        
        .popup-content-glass .location-notice {
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #6B7280;
        }
        
        .popup-content-glass .location-notice svg {
          flex-shrink: 0;
          color: #9CA3AF;
        }
        
        .popup-content-glass .property-details {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #4B5563;
        }
        
        .popup-content-glass .price {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #4F46E5;
        }
        
        /* Remove default Mapbox popup tip */
        .mapboxgl-popup-tip {
          display: none;
        }
        
        /* Custom navigation controls */
        .mapboxgl-ctrl-group {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .mapboxgl-ctrl-group button {
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .mapboxgl-ctrl-group button:hover {
          background: #F3F4F6;
        }
      `}</style>
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height }} 
        className="rounded-xl overflow-hidden shadow-lg"
      />
    </>
  );
}