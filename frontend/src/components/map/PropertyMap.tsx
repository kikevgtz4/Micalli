'use client';
import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token here (ideally from environment variables)
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'your-mapbox-token';

interface Property {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  price: number;
}

interface PropertyMapProps {
  properties: Property[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  height?: string;
  onMarkerClick?: (propertyId: number) => void;
}

export default function PropertyMap({
  properties,
  centerLat = 25.6866, // Default to Monterrey coordinates
  centerLng = -100.3161,
  zoom = 12,
  height = '500px',
  onMarkerClick
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

  // Add markers when properties change or map loads
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    // Remove existing markers
    const markers = document.getElementsByClassName('mapboxgl-marker');
    while(markers[0]) {
      markers[0].remove();
    }
    
    // Add new markers
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
  }, [properties, mapLoaded, onMarkerClick]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height }} className="rounded-lg overflow-hidden" />
  );
}