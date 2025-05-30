// frontend/src/types/filters.ts
export interface PropertyFilters {
  search?: string; 
  priceMin?: number;
  priceMax?: number;
  amenities?: string[];
  universityId?: number;
  maxDistance?: number; // in km
  furnished?: boolean;
  petFriendly?: boolean;
  smokingAllowed?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'distance' | 'newest' | 'popularity';
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: PropertyFilters;
  createdAt: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export type SortOption = PropertyFilters['sortBy'];