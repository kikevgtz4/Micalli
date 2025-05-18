'use client';
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import PropertyImage from "@/components/common/PropertyImage";
import Link from "next/link";
import apiService from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

interface University {
  id: number;
  name: string;
  distance: number;
  walkingTime: number;
}

interface PropertyDetail {
  id: number;
  title: string;
  address: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  isVerified?: boolean;
  is_verified?: boolean;
  isFurnished?: boolean;
  furnished?: boolean;
  amenities: string[];
  nearbyUniversities?: University[];
  university_proximities?: any[];
  ownerName?: string;
  owner_name?: string;
  ownerPhone?: string;
  owner_phone?: string;
  owner?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    phone?: string;
  };
  images: string[];
  property_images?: any[];
  availableFrom?: string;
  available_from?: string;
  minimumStay?: number;
  minimum_stay?: number;
  maximumStay?: number;
  maximum_stay?: number;
  is_active: boolean;
}

export default function PropertyDetail({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const created = searchParams.get("created") === "success";
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let isMounted = true;

    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.properties.getById(parseInt(id));

        if (!isMounted) return; // Prevent state updates if component unmounted

        // Log raw API response for debugging
        console.log('Raw API property response:', response.data);
        
        // Process the API data with safety checks
        const propertyData = response.data || {};

        // Add the processImages function here
        const processImages = (propertyData: any): string[] => {
          // Case 1: Direct array of strings
          if (Array.isArray(propertyData.images) && 
              propertyData.images.length > 0 && 
              typeof propertyData.images[0] === 'string') {
            return propertyData.images;
          }
          
          // Case 2: Array of objects with image property
          if (Array.isArray(propertyData.images) && 
              propertyData.images.length > 0 && 
              typeof propertyData.images[0] === 'object') {
            return propertyData.images
              .map((img: any) => img.image)
              .filter(Boolean);
          }
          
          // Case 3: property_images field
          if (Array.isArray(propertyData.property_images) && 
              propertyData.property_images.length > 0) {
            return propertyData.property_images
              .map((img: any) => img.image)
              .filter(Boolean);
          }
          
          // Fallback
          return ["/placeholder-property.jpg"];
        };

        const processedProperty: PropertyDetail = {
          id: propertyData.id,
          title: propertyData.title,
          address: propertyData.address,
          description: propertyData.description || "",
          price: propertyData.rent_amount || propertyData.price,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          area: propertyData.total_area || propertyData.area,
          isVerified: propertyData.is_verified === true,
          isFurnished: propertyData.furnished === true,
          amenities: propertyData.amenities || [],
          owner: propertyData.owner || {},
          is_active: propertyData.is_active === true,

          // Process owner information
          ownerName:
            propertyData.owner_name ||
            (propertyData.owner
              ? `${propertyData.owner.first_name || ""} ${
                  propertyData.owner.last_name || ""
                }`.trim() || propertyData.owner.username
              : "Property Owner"),

          ownerPhone:
            propertyData.owner_phone ||
            (propertyData.owner ? propertyData.owner.phone : ""),

          // Use the new processImages function
          images: processImages(propertyData),

          // Process dates and stay information
          availableFrom:
            propertyData.available_from || propertyData.availableFrom,
          minimumStay:
            propertyData.minimum_stay || propertyData.minimumStay || 1,
          maximumStay: propertyData.maximum_stay || propertyData.maximumStay,

          // Process university proximities - convert from snake_case to camelCase
          nearbyUniversities:
            propertyData.university_proximities?.map((prox: any) => ({
              id: prox.university.id,
              name: prox.university.name,
              distance: prox.distance_in_meters,
              walkingTime: prox.walking_time_minutes,
            })) || [],
        };
        
        // Log processed images for debugging
        console.log('Processed property images:', processedProperty.images);

        setProperty(processedProperty);
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        console.error("Failed to load property details:", err);
        setError("Failed to load property details. Please try again later.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProperty();

    return () => {
      isMounted = false; // Cleanup to prevent updates after unmount
    };
  }, [id]);

  const nextImage = () => {
    if (property?.images.length) {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % property.images.length
      );
    }
  };

  const prevImage = () => {
    if (property?.images.length) {
      setCurrentImageIndex(
        (prevIndex) =>
          (prevIndex - 1 + property.images.length) % property.images.length
      );
    }
  };

  const handleToggleActive = async () => {
    if (!property) {
      setError("Cannot update property: Property data is not available");
      return;
    }

    try {
      // Show loading state
      setIsLoading(true);

      // Call the API endpoint to toggle active status
      await apiService.properties.toggleActive(property.id);

      // Update the local property state
      setProperty({
        ...property,
        is_active: !property.is_active,
      });

      // Show success message using react-hot-toast
      if (property.is_active) {
        toast.error(
          "Property deactivated. Your property is now hidden from students."
        );
      } else {
        toast.success(
          "Property activated. Your property is now visible to students."
        );
      }
    } catch (error: any) {
      console.error("Failed to toggle property status:", error);
      // Show error message
      setError("Failed to update property status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-3 gap-6">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="h-40 bg-gray-200 rounded mt-6"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !property) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error || "Property not found"}</p>
          </div>
          <Link
            href="/properties"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
          >
            ← Back to all properties
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 py-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/properties"
            className="inline-block mb-6 text-indigo-600 hover:text-indigo-800"
          >
            ← Back to all properties
          </Link>

          {created && (
            <div className="mb-8 bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Your property listing has been successfully created! It will
                    be reviewed by our team before becoming visible to students.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Property Images */}
            <div className="relative h-96 w-full">
              {property.images && property.images.length > 0 ? (
                <>
                  <PropertyImage 
                    image={property.images[currentImageIndex]}
                    alt={property.title}
                    fill
                    className="object-cover"
                  />

                  {/* Image navigation */}
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full shadow-md hover:bg-opacity-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full shadow-md hover:bg-opacity-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>

                      {/* Image counter */}
                      <div className="absolute bottom-16 right-4 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {property.images.length}
                      </div>
                      
                      {/* Thumbnail gallery */}
                      <div className="absolute bottom-4 left-0 right-0 px-4">
                        <div className="flex space-x-2 overflow-x-auto pb-2 justify-center">
                          {property.images.map((image, index) => (
                            <div 
                              key={index}
                              className={`w-16 h-16 flex-shrink-0 cursor-pointer border-2 ${
                                currentImageIndex === index ? 'border-indigo-500' : 'border-white border-opacity-50'
                              }`}
                              onClick={() => setCurrentImageIndex(index)}
                            >
                              <PropertyImage 
                                image={image}
                                alt={`${property.title} - image ${index + 1}`}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                  <span className="text-gray-400">No images available</span>
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {property.title}
                  </h1>
                  <p className="text-gray-600 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {property.address}
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md text-2xl font-bold">
                    ${new Intl.NumberFormat().format(property.price)}
                    <span className="text-sm font-normal ml-1">/ month</span>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                  {/* Bedrooms */}
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bedrooms</p>
                      <p className="font-medium text-gray-900">
                        {property.bedrooms} {property.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Bathrooms */}
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bathrooms</p>
                      <p className="font-medium text-gray-900">
                        {property.bathrooms} {property.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Area */}
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Area</p>
                      <p className="font-medium text-gray-900">{property.area} m²</p>
                    </div>
                  </div>
                  
                  {/* Available from */}
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Available From</p>
                      <p className="font-medium text-gray-900">
                        {new Date(property.availableFrom || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Minimum stay */}
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Minimum Stay</p>
                      <p className="font-medium text-gray-900">
                        {property.minimumStay} {property.minimumStay === 1 ? "month" : "months"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Furnished status */}
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Furnishing</p>
                      <p className="font-medium text-gray-900">
                        {property.isFurnished ? "Furnished" : "Unfurnished"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Description
                </h2>
                <p className="text-gray-700">{property.description}</p>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    Amenities
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green-500 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nearby Universities */}
              {property.nearbyUniversities &&
                property.nearbyUniversities.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                      Nearby Universities
                    </h2>
                    <div className="space-y-3">
                      {property.nearbyUniversities.map((uni, index) => (
                        <div key={index} className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-indigo-500 mr-2 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          <div>
                            <div className="font-medium">{uni.name}</div>
                            <div className="text-sm text-gray-600">
                              {uni.distance}m distance ({uni.walkingTime} mins
                              walking)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Contact Owner */}
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Contact Information
                </h2>
                <div className="flex items-start mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-indigo-500 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <div>
                    <div className="font-medium">{property.ownerName}</div>
                    <div className="text-sm text-gray-600">Property Owner</div>
                  </div>
                </div>
                {property.ownerPhone && (
                  <div className="flex items-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-indigo-500 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{property.ownerPhone}</span>
                  </div>
                )}
                <button
                  className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                  onClick={async () => {
                    if (!isAuthenticated) {
                      router.push(`/login?redirect=/properties/${property.id}`);
                      return;
                    }

                    try {
                      // Check that property.owner exists and has an id
                      if (!property.owner || !property.owner.id) {
                        console.error("Owner information is missing");
                        alert(
                          "Owner information is missing. Cannot start conversation."
                        );
                        return;
                      }

                      // Log the request details for debugging
                      console.log("Starting conversation with:", {
                        ownerId: property.owner.id,
                        propertyId: property.id,
                        message: `Hi, I'm interested in "${property.title}". Is it still available?`,
                      });

                      const response =
                        await apiService.messaging.startConversation(
                          property.owner.id,
                          property.id,
                          `Hi, I'm interested in "${property.title}". Is it still available?`
                        );

                      // Navigate to the conversation
                      router.push(`/messages/${response.data.id}`);
                    } catch (error) {
                      console.error("Failed to start conversation:", error);
                      alert("Failed to start conversation. Please try again.");
                    }
                  }}
                >
                  Message Owner
                </button>
              </div>

              {/* Viewing request form would go here */}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}