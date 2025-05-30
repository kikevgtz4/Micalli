// frontend/src/app/(main)/properties/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyMap from "@/components/map/PropertyMap";
import PropertyFiltersPanel from "@/components/property/PropertyFiltersPanel";
import PropertySortDropdown from "@/components/property/PropertySortDropdown";
import SavedSearchesDropdown from "@/components/property/SavedSearchesDropdown";
import { usePropertyFilters } from "@/hooks/usePropertyFilters";
import apiService from "@/lib/api";
import { Property, University } from "@/types/api";
import { toast } from "react-hot-toast";
import {
  FunnelIcon,
  XMarkIcon,
  BookmarkIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  MapIcon,
} from "@heroicons/react/24/outline";
import { SortOption } from "@/types/filters";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    filters,
    debouncedFilters,
    updateFilter,
    clearFilters,
    savedSearches,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
  } = usePropertyFilters();

  // Initialize filters from URL params
  useEffect(() => {
    const universityParam = searchParams.get("university");
    const budgetParam = searchParams.get("budget");

    if (universityParam) {
      updateFilter("universityId", Number(universityParam));
    }

    if (budgetParam) {
      const [min, max] = budgetParam.split("-").map(Number);
      if (min) updateFilter("priceMin", min);
      if (max) updateFilter("priceMax", max);
    }
  }, [searchParams, updateFilter]);

  // Fetch universities
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await apiService.universities.getAll();
        console.log('Universities response:', response); // Debug log
        
        // Handle different response formats
        let universitiesData = [];
        if (Array.isArray(response.data)) {
          universitiesData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Handle paginated response
          universitiesData = response.data.results;
        } else if (response.data && typeof response.data === 'object') {
          // Handle if data is an object with universities nested
          console.warn('Unexpected universities response format:', response.data);
          universitiesData = [];
        }
        
        setUniversities(universitiesData);
      } catch (error) {
        console.error('Failed to fetch universities:', error);
        setUniversities([]); // Set empty array on error
      }
    };
    
    fetchUniversities();
  }, []);

  
// Separate search from other filters for the API call:
useEffect(() => {
  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      // Build params object excluding search
      const params: any = {};
      
      // Don't send search to API - we'll filter client-side
      // if (debouncedFilters.search) params.search = debouncedFilters.search;
      
      if (debouncedFilters.priceMin) params.minPrice = debouncedFilters.priceMin;
      if (debouncedFilters.priceMax) params.maxPrice = debouncedFilters.priceMax;
      if (debouncedFilters.bedrooms) params.bedrooms = debouncedFilters.bedrooms;
      if (debouncedFilters.bathrooms) params.bathrooms = debouncedFilters.bathrooms;
      if (debouncedFilters.propertyType) params.propertyType = debouncedFilters.propertyType;
      if (debouncedFilters.furnished !== undefined) params.furnished = debouncedFilters.furnished;
      if (debouncedFilters.petFriendly !== undefined) params.petFriendly = debouncedFilters.petFriendly;
      if (debouncedFilters.smokingAllowed !== undefined) params.smokingAllowed = debouncedFilters.smokingAllowed;
      if (debouncedFilters.universityId) params.university = debouncedFilters.universityId;
      if (debouncedFilters.maxDistance) params.maxDistance = debouncedFilters.maxDistance;
      if (debouncedFilters.amenities?.length) params.amenities = debouncedFilters.amenities.join(',');
      if (debouncedFilters.sortBy) params.ordering = debouncedFilters.sortBy;
      
      const response = await apiService.properties.getAll(params);
      const activeProperties = response.data.filter((prop: Property) => prop.isActive);
      setProperties(activeProperties);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchProperties();
}, [debouncedFilters]);

// Then add the client-side search filter:
const filteredProperties = useMemo(() => {
  let filtered = properties;
  
  // Apply search filter client-side
  if (filters.search && filters.search.trim() !== '') {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter((property) => {
      return (
        property.title.toLowerCase().includes(searchLower) ||
        property.address.toLowerCase().includes(searchLower) ||
        property.description?.toLowerCase().includes(searchLower) ||
        property.propertyType?.toLowerCase().includes(searchLower)
      );
    });
  }
  
  return filtered;
}, [properties, filters.search]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(
      (v) =>
        v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true)
    ).length;
  }, [filters]);

  const handleSaveSearch = () => {
    const name = prompt("Name your search:");
    if (name) {
      saveSearch(name);
      toast.success("Search saved successfully!");
    }
  };

  // Prepare properties for map view
  const mapProperties = properties
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      id: p.id,
      title: p.title,
      latitude: p.latitude!,
      longitude: p.longitude!,
      price: p.rentAmount,
    }));

  return (
    <MainLayout>
      <div className="min-h-screen bg-stone-50">
        {/* Sticky Header */}
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search bar */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by location, property name..."
                    value={filters.search || ""}
                    onChange={(e) => updateFilter("search", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-3.5 w-5 h-5 text-stone-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Desktop Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-primary-500 text-white rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  <FunnelIcon className="h-5 w-5" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-primary-500 text-white rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Saved Searches */}
                <SavedSearchesDropdown
                  savedSearches={savedSearches}
                  onLoad={loadSavedSearch}
                  onDelete={deleteSavedSearch}
                />

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center text-sm text-stone-600 hover:text-stone-900"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Clear all
                  </button>
                )}

                {/* View Mode Toggle */}
                <div className="flex bg-stone-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      viewMode === "grid" ? "bg-white shadow-sm" : ""
                    }`}
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      viewMode === "map" ? "bg-white shadow-sm" : ""
                    }`}
                  >
                    <MapIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <PropertySortDropdown
                  value={filters.sortBy}
                  onChange={(value) =>
                    updateFilter("sortBy", value as SortOption)
                  }
                />

                {/* Save Search */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleSaveSearch}
                    className="hidden md:flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <BookmarkIcon className="h-4 w-4 mr-1" />
                    Save search
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

                      {/* Update the subtitle to show filtered count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-22 pb-0 py-1">
        <div className="mb-1 font-semibold">
          <h1 className="text-3xl font-bold text-stone-900">
            Find Your Perfect Student Home
          </h1>
          <p className="mt-2 text-lg text-stone-600">
            {filteredProperties.length} properties available
            {filters.search && ` matching "${filters.search}"`}
          </p>
        </div>
      </div>

        {/* Main Content */}
        <div
          className={
            viewMode === "grid"
              ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
              : ""
          }
        >
          <div className={viewMode === "grid" ? "flex gap-6" : ""}>
            {/* Desktop Filters Panel - Only show in grid view */}
            {showFilters && viewMode === "grid" && (
              <div className="hidden lg:block w-80 flex-shrink-0">
                <PropertyFiltersPanel
                  filters={filters}
                  universities={universities}
                  onFilterChange={updateFilter}
                  onClose={() => setShowFilters(false)}
                />
              </div>
            )}

            {/* Properties Grid/Map */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-stone-200 rounded-2xl h-64"></div>
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                        <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : viewMode === 'grid' ? (
  filteredProperties.length === 0 ? (
    <div className="text-center py-12">
      <p className="text-lg text-stone-600">
        No properties found matching your criteria.
      </p>
      <button
        onClick={clearFilters}
        className="mt-4 text-primary-600 hover:text-primary-700"
      >
        Clear filters and try again
      </button>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProperties.map((property) => (
        <PropertyCard
                        key={property.id}
                        id={property.id}
                        title={property.title}
                        address={property.address}
                        price={property.rentAmount}
                        bedrooms={property.bedrooms}
                        bathrooms={property.bathrooms}
                        imageUrl={property.images?.[0]?.image}
                        isVerified={property.isVerified}
                        furnished={property.furnished}
                        totalArea={property.totalArea}
                        availableFrom={property.availableFrom}
                        universityDistance={
                          property.universityProximities?.[0]
                            ? `${property.universityProximities[0].distanceInMeters}m from ${property.universityProximities[0].university.name}`
                            : undefined
                        }
                      />
      ))}
    </div>
  )
) : (
  // Update map view to use filteredProperties:
  <div className="h-[calc(100vh-200px)]">
    <PropertyMap
      properties={filteredProperties
        .filter(p => p.latitude && p.longitude)
        .map(p => ({
          id: p.id,
          title: p.title,
          latitude: p.latitude!,
          longitude: p.longitude!,
          price: p.rentAmount,
        }))}
      onMarkerClick={(id) => router.push(`/properties/${id}`)}
    />
  </div>
)}

            </div>
          </div>
        </div>

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileFilters(false)}
            />
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
              <PropertyFiltersPanel
                filters={filters}
                universities={universities}
                onFilterChange={updateFilter}
                onClose={() => setShowMobileFilters(false)}
                isMobile
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
