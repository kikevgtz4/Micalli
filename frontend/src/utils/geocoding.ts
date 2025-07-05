// utils/geocoding.ts
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export interface GeocodingResult {
  address: string;
  latitude: number;
  longitude: number;
  confidence: 'exact' | 'high' | 'medium' | 'low';
  context: {
    place?: string;
    region?: string;
    country?: string;
    postcode?: string;
    neighborhood?: string;
  };
}

export const geocodingService = {
  // Forward geocoding with Mexican address optimization
  async searchAddress(query: string): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
      q: query,
      access_token: MAPBOX_TOKEN,
      country: 'mx', // Limit to Mexico
      types: 'address,street,place',
      language: 'es', // Spanish language for better Mexican results
      limit: '5',
      proximity: '-100.3161,25.6866', // Monterrey center for better local results
    });

    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?${params}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    return this.transformResults(data.features);
  },

  // Reverse geocoding for map clicks
  async reverseGeocode(lng: number, lat: number): Promise<GeocodingResult | null> {
    const params = new URLSearchParams({
      longitude: lng.toString(),
      latitude: lat.toString(),
      access_token: MAPBOX_TOKEN,
      types: 'address,street',
      language: 'es',
    });

    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/reverse?${params}`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    const results = this.transformResults(data.features);
    return results[0] || null;
  },

  // Transform Mapbox results to our format
  transformResults(features: any[]): GeocodingResult[] {
    return features.map(feature => ({
      address: feature.properties.full_address || feature.properties.name,
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      confidence: feature.properties.match_code?.confidence || 'medium',
      context: {
        place: feature.properties.context?.place?.name,
        region: feature.properties.context?.region?.name,
        country: feature.properties.context?.country?.name,
        postcode: feature.properties.context?.postcode?.name,
        neighborhood: feature.properties.context?.neighborhood?.name,
      },
    }));
  },
};