"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyMap from "@/components/map/PropertyMap";
import apiService from "@/lib/api";
import { useInView } from "react-intersection-observer";

// Updated interface that includes all required PropertyCard props
interface PropertyCardData {
  id: number;
  title: string;
  address: string;
  price: number; // Add this field mapped from rent_amount
  rent_amount: number; // Keep original for compatibility
  bedrooms: number;
  bathrooms: number;
  latitude?: number;
  longitude: number;
  imageUrl?: string;
  isVerified?: boolean;
  universityDistance?: string;
}

// Updated interface for PropertyMap compatibility
interface PropertyMapData {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  price: number; // Required by PropertyMap
}

function PropertyItem({ property }: { property: PropertyCardData }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
  });

  return (
    <div ref={ref} key={property.id}>
      {inView ? (
        <PropertyCard {...property} />
      ) : (
        <div className="h-[300px] bg-stone-100 animate-pulse rounded-lg"></div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [mapProperties, setMapProperties] = useState<PropertyMapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.properties.getAll();

        // Handle the response data properly
        let propertiesData: any[] = [];
        
        if (Array.isArray(response.data)) {
          propertiesData = response.data;
        } else if (response.data && typeof response.data === "object" && 'results' in response.data) {
          propertiesData = (response.data as any).results || [];
        }

        // Filter active properties (case conversion handles this)
        const activeProperties = propertiesData.filter(prop => prop.isActive);

        // Process property data for PropertyCard
        const processedProperties: PropertyCardData[] = activeProperties.map((prop: any) => ({
          id: prop.id,
          title: prop.title,
          address: prop.address,
          price: prop.rentAmount,
          rent_amount: prop.rentAmount,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          latitude: prop.latitude,
          longitude: prop.longitude || 0,
          isVerified: prop.isVerified,
          imageUrl: prop.images?.length > 0 ? prop.images[0].image : "/placeholder-property.jpg",
          universityDistance: prop.universityProximities?.length > 0
            ? `${prop.universityProximities[0].distanceInMeters}m from ${prop.universityProximities[0].university.name}`
            : undefined,
        }));

        // Process property data for PropertyMap
        const processedMapProperties: PropertyMapData[] = activeProperties
          .filter(prop => prop.latitude && prop.longitude)
          .map((prop: any) => ({
            id: prop.id,
            title: prop.title,
            latitude: prop.latitude!,
            longitude: prop.longitude!,
            price: prop.rentAmount,
          }));

        setProperties(processedProperties);
        setMapProperties(processedMapProperties);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
        setError("Failed to load properties. Please try again later.");
        setProperties([]);
        setMapProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleMarkerClick = (propertyId: number) => {
    router.push(`/properties/${propertyId}`);
  };

  const filteredProperties = properties.filter(
    (property) =>
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.universityDistance?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMapProperties = mapProperties.filter(
    (property) =>
      property.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="bg-stone-50 py-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-stone-900 sm:text-4xl">
              Find Your Ideal Student Housing
            </h1>
            <p className="mt-4 text-lg text-stone-600">
              Browse verified properties near universities in Monterrey
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-surface p-4 rounded-lg shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by location, university, etc."
                className="flex-grow px-4 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors transition-colors"
                onClick={() => setSearchTerm("")}
                disabled={!searchTerm}
              >
                {searchTerm ? "Clear Search" : "Search"}
              </button>
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex justify-end mb-6">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === "list"
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-surface text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                  viewMode === "map"
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-surface text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                Map View
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-stone-600">Loading properties...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-error-50 border-l-4 border-error-400 p-4 rounded-md max-w-md mx-auto">
                <p className="text-error-700">{error}</p>
              </div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-stone-600">
                {searchTerm 
                  ? "No properties found matching your search." 
                  : "No active properties available at the moment."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : viewMode === "list" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <PropertyItem key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="bg-surface p-4 rounded-lg shadow-md">
              <PropertyMap
                properties={filteredMapProperties}
                onMarkerClick={handleMarkerClick}
              />
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProperties.slice(0, 3).map((property) => (
                  <PropertyCard key={property.id} {...property} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}