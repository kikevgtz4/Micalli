// frontend/src/components/map/PropertyMap.tsx
'use client';
import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox access token here (environment variable)
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface Property {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  price: number;
  privacyRadius?: number; // Radius in meters
}

interface PropertyMapProps {
  properties: Property[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  height?: string;
  onMarkerClick?: (propertyId: number) => void;
  showExactLocation?: boolean;
}

export default function PropertyMap({
  properties,
  centerLat = 25.6866, // Default to Monterrey coordinates
  centerLng = -100.3161,
  zoom = 12,
  height = '500px',
  onMarkerClick,
  showExactLocation = false
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: zoom
    });
    
    map.current.on('load', () => {
      setMapLoaded(true);
    });
    
    return () => {
      map.current?.remove();
    };
  }, [centerLat, centerLng, zoom]);

  // Add markers or circles based on privacy settings
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    // Clean up existing layers and sources
    if (map.current.getLayer('property-circles')) {
      map.current.removeLayer('property-circles');
    }
    if (map.current.getLayer('property-labels')) {
      map.current.removeLayer('property-labels');
    }
    if (map.current.getSource('properties')) {
      map.current.removeSource('properties');
    }
    
    // Remove existing markers
    const markers = document.getElementsByClassName('mapboxgl-marker');
    while(markers[0]) {
      markers[0].remove();
    }
    
    if (showExactLocation) {
      // EXACT LOCATION MODE - Use markers
      properties.forEach(property => {
        const marker = document.createElement('div');
        marker.className = 'marker';
        marker.style.backgroundColor = '#4F46E5';
        marker.style.width = '24px';
        marker.style.height = '24px';
        marker.style.borderRadius = '50%';
        marker.style.display = 'flex';
        marker.style.justifyContent = 'center';
        marker.style.alignItems = 'center';
        marker.style.color = 'white';
        marker.style.fontWeight = 'bold';
        marker.style.fontSize = '12px';
        marker.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        marker.style.cursor = 'pointer';
        marker.innerHTML = `$${Math.round(property.price / 1000)}k`;
        
        const markerPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<strong>${property.title}</strong><br>$${property.price}/month`
        );
        
        if (map.current) {
          const newMarker = new mapboxgl.Marker(marker)
            .setLngLat([property.longitude, property.latitude])
            .setPopup(markerPopup)
            .addTo(map.current);
            
          marker.addEventListener('click', () => {
            if (onMarkerClick) {
              onMarkerClick(property.id);
            }
          });
        }
      });
    } else {
      // PRIVACY MODE - Show approximate circles with proper radius
      const features = properties.map(property => ({
        type: 'Feature' as const,
        properties: {
          id: property.id,
          title: property.title,
          price: property.price,
          radius: property.privacyRadius || 200 // Default 200m radius
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
          'circle-radius': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            // At zoom level 0, radius calculation
            0, ['/', ['get', 'radius'], 78271.484],
            // At zoom level 24, radius calculation  
            24, ['*', ['get', 'radius'], 2.688]
          ],
          'circle-color': '#4F46E5',
          'circle-opacity': 0.3,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#4F46E5',
          'circle-stroke-opacity': 0.6
        }
      });
      
      // Add price labels
      map.current.addLayer({
        id: 'property-labels',
        type: 'symbol',
        source: 'properties',
        layout: {
          'text-field': ['concat', '$', ['to-string', ['/', ['get', 'price'], 1000]], 'k/mo'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#4F46E5',
          'text-halo-width': 2
        }
      });
      
      // Add popup on click
      map.current.on('click', 'property-circles', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const coordinates = (feature.geometry as any).coordinates.slice();
          const { title, price, id } = feature.properties as any;
          
          // Create popup
          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
              <div style="padding: 8px;">
                <strong style="font-size: 14px;">${title}</strong><br>
                <span style="color: #6B7280; font-size: 12px;">Approximate location</span><br>
                <span style="font-size: 16px; font-weight: 600; color: #4F46E5;">$${price}/month</span>
              </div>
            `)
            .addTo(map.current!);
          
          // Trigger click handler if provided
          if (onMarkerClick) {
            onMarkerClick(id);
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
    }
  }, [properties, mapLoaded, showExactLocation, onMarkerClick]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height }} className="rounded-lg overflow-hidden" />
  );
}