"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyMap from "@/components/map/PropertyMap";
import apiService from "@/lib/api";
import { useInView } from "react-intersection-observer";
import { Property } from "@/types/api";

// Update the Property interface to use the proper type
interface PropertyCardData extends Omit<Property, 'images'> {
  imageUrl?: string; // For compatibility with PropertyCard
  isVerified?: boolean; // For compatibility with PropertyCard
  universityDistance?: string; // For compatibility with PropertyCard
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
        <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg"></div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyCardData[]>([]);
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

        console.log("Properties API Response:", response.data);

        // Handle the response data properly with type safety
        let propertiesData: Property[] = [];
        
        if (Array.isArray(response.data)) {
          propertiesData = response.data;
        } else if (response.data && typeof response.data === "object" && 'results' in response.data) {
          // Handle paginated response
          propertiesData = (response.data as any).results || [];
        }

        // Process property data to ensure compatibility with PropertyCard
        const processedProperties: PropertyCardData[] = propertiesData
          .filter(prop => prop.is_active) // Extra safety: only show active properties
          .map((prop: Property) => ({
            ...prop,
            isVerified: prop.is_verified,
            imageUrl: prop.images?.length > 0 ? prop.images[0].image : "/placeholder-property.jpg",
            universityDistance: prop.university_proximities?.length > 0
              ? `${prop.university_proximities[0].distance_in_meters}m from ${prop.university_proximities[0].university.name}`
              : undefined,
          }));

        setProperties(processedProperties);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
        setError("Failed to load properties. Please try again later.");
        setProperties([]); // Clear properties on error
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

  return (
    <MainLayout>
      <div className="bg-gray-50 py-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Find Your Ideal Student Housing
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Browse verified properties near universities in Monterrey
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by location, university, etc."
                className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
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
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                  viewMode === "map"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Map View
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading properties...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md max-w-md mx-auto">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {searchTerm 
                  ? "No properties found matching your search." 
                  : "No active properties available at the moment."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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
            <div className="bg-white p-4 rounded-lg shadow-md">
              <PropertyMap
                properties={filteredProperties}
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