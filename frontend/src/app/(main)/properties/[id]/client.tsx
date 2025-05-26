"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import PropertyImage from "@/components/common/PropertyImage";
import Link from "next/link";
import apiService from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import { Property } from "@/types/api";

export default function PropertyDetail({ 
  id, 
  initialData = null,
  isOwnerView = false // New prop to indicate owner viewing their own property
}: { 
  id: string, 
  initialData?: Property | null,
  isOwnerView?: boolean
}) {
  const [property, setProperty] = useState<Property | null>(initialData);
  const searchParams = useSearchParams();
  const created = searchParams.get("created") === "success";
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have initial data, use it and don't fetch
    if (initialData) {
      setProperty(initialData);
      return;
    }

    // Only fetch if we don't have initial data and it's not an owner view
    if (!isOwnerView) {
      const fetchProperty = async () => {
        try {
          setIsLoading(true);
          const response = await apiService.properties.getById(parseInt(id));
          
          // Check if property is active for public view
          if (!response.data.isActive) {
            console.log('Property is inactive, redirecting to properties page');
            router.push('/properties');
            return;
          }
          
          setProperty(response.data);
          setError(null);
        } catch (err: any) {
          console.log('Property fetch failed, redirecting to properties page');
          router.push('/properties');
        } finally {
          setIsLoading(false);
        }
      };

      fetchProperty();
    }
  }, [id, initialData, isOwnerView, router]);

  // For public view, only show active properties (but don't redirect during render)
  useEffect(() => {
    if (!isOwnerView && property && !property.isActive) {
      router.push('/properties');
    }
  }, [isOwnerView, property, router]);

  // Navigation functions for image gallery
  const nextImage = () => {
    if (property?.images.length) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images.length) {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex - 1 + property.images.length) % property.images.length
      );
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-96 bg-stone-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-stone-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-stone-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-3 gap-6">
              <div className="h-10 bg-stone-200 rounded"></div>
              <div className="h-10 bg-stone-200 rounded"></div>
              <div className="h-10 bg-stone-200 rounded"></div>
            </div>
            <div className="h-40 bg-stone-200 rounded mt-6"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !property) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-error-50 border-l-4 border-error-400 p-4">
            <p className="text-error-700">{error || "Property not found"}</p>
          </div>
          <Link
            href={isOwnerView ? "/dashboard/properties" : "/properties"}
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 transition-colors"
          >
            ← Back to {isOwnerView ? "my properties" : "all properties"}
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-stone-50 py-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={isOwnerView ? "/dashboard/properties" : "/properties"}
            className="inline-block mb-6 text-primary-600 hover:text-primary-700 transition-colors"
          >
            ← Back to {isOwnerView ? "my properties" : "all properties"}
          </Link>

          {/* Show status for property owners */}
          {isOwnerView && (
            <div className="mb-6">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                property.isActive 
                  ? 'bg-success-50 text-success-600' 
                  : 'bg-warning-50 text-warning-600'
              }`}>
                {property.isActive ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Active - Visible to students
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Inactive - Hidden from students
                  </>
                )}
              </div>
            </div>
          )}

          {/* Success message for property owners who just created a listing */}
          {created && user?.userType === 'property_owner' && (
            <div className="mb-8 bg-success-50 border-l-4 border-green-400 p-4">
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
                    Your property listing has been successfully created! {!property.isActive && "Activate it from your dashboard to make it visible to students."}
                  </p>
                </div>
              </div>
            </div>
          )}


          <div className="bg-surface rounded-lg shadow-md overflow-hidden">
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
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-surface bg-opacity-80 p-2 rounded-full shadow-md hover:bg-opacity-100"
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
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-surface bg-opacity-80 p-2 rounded-full shadow-md hover:bg-opacity-100"
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
                      <div className="absolute bottom-16 right-4 bg-stone-50 bg-opacity-60 text-black px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {property.images.length}
                      </div>

                      {/* Thumbnail gallery */}
                      <div className="absolute bottom-4 left-0 right-0 px-4">
                        <div className="flex space-x-2 overflow-x-auto pb-2 justify-center">
                          {property.images.map((image, index) => (
                            <div
                              key={index}
                              className={`w-16 h-16 flex-shrink-0 cursor-pointer border-2 ${
                                currentImageIndex === index
                                  ? "border-primary-500"
                                  : "border-white border-opacity-50"
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
                <div className="bg-stone-200 h-full w-full flex items-center justify-center">
                  <span className="text-stone-400">No images available</span>
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-stone-900 mb-2">
                    {property.title}
                  </h1>
                  <p className="text-stone-600 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1 text-primary-500"
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
                  <div className="bg-primary-500 text-white px-6 py-3 rounded-lg shadow-md text-2xl font-bold">
                    ${new Intl.NumberFormat().format(property.rentAmount)}
                    <span className="text-sm font-normal ml-1">/ month</span>
                  </div>
                </div>
              </div>

              {/* Property Details Grid */}
              <div className="bg-surface p-6 rounded-lg shadow-sm mb-8">
                <h2 className="text-xl font-semibold text-stone-900 mb-4">
                  Property Details
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                  {/* Bedrooms */}
                  <div className="bg-stone-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-primary-600"
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
                      <p className="text-sm text-stone-500">Bedrooms</p>
                      <p className="font-medium text-stone-900">
                        {property.bedrooms}{" "}
                        {property.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
                      </p>
                    </div>
                  </div>

                  {/* Bathrooms */}
                  <div className="bg-stone-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-primary-600"
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
                      <p className="text-sm text-stone-500">Bathrooms</p>
                      <p className="font-medium text-stone-900">
                        {property.bathrooms}{" "}
                        {property.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
                      </p>
                    </div>
                  </div>

                  {/* Area */}
                  <div className="bg-stone-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-primary-600"
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
                      <p className="text-sm text-stone-500">Area</p>
                      <p className="font-medium text-stone-900">
                        {property.totalArea} m²
                      </p>
                    </div>
                  </div>

                  {/* Available from */}
                  <div className="bg-stone-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-primary-600"
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
                      <p className="text-sm text-stone-500">Available From</p>
                      <p className="font-medium text-stone-900">
                        {new Date(property.availableFrom).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Minimum stay */}
                  <div className="bg-stone-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-primary-600"
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
                      <p className="text-sm text-stone-500">Minimum Stay</p>
                      <p className="font-medium text-stone-900">
                        {property.minimumStay}{" "}
                        {property.minimumStay === 1 ? "month" : "months"}
                      </p>
                    </div>
                  </div>

                  {/* Furnished status */}
                  <div className="bg-stone-50 p-4 rounded-lg flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-primary-600"
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
                      <p className="text-sm text-stone-500">Furnishing</p>
                      <p className="font-medium text-stone-900">
                        {property.furnished ? "Furnished" : "Unfurnished"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-stone-900 mb-3">
                  Description
                </h2>
                <p className="text-stone-700">{property.description}</p>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-stone-900 mb-3">
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
              {property.universityProximities && property.universityProximities.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-stone-900 mb-3">
                    Nearby Universities
                  </h2>
                  <div className="space-y-3">
                    {property.universityProximities.map((prox, index) => (
                      <div key={index} className="flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-primary-500 mr-2 mt-0.5"
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
                          <div className="font-medium">{prox.university.name}</div>
                          <div className="text-sm text-stone-600">
                            {prox.distanceInMeters}m distance ({prox.walkingTimeMinutes} mins walking)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Owner */}
              <div className="bg-primary-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-stone-900 mb-3">
                  Contact Information
                </h2>
                <div className="flex items-start mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary-500 mr-2"
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
                    <div className="font-medium">
                      {property.owner.firstName && property.owner.lastName 
                        ? `${property.owner.firstName} ${property.owner.lastName}`
                        : property.owner.username}
                    </div>
                    <div className="text-sm text-stone-600">Property Owner</div>
                  </div>
                </div>
                {property.owner.phone && (
                  <div className="flex items-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-primary-500 mr-2"
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
                    <span>{property.owner.phone}</span>
                  </div>
                )}
                <button
                  className="w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                  onClick={async () => {
                    if (!isAuthenticated) {
                      router.push(`/login?redirect=/properties/${property.id}`);
                      return;
                    }

                    try {
                      const response = await apiService.messaging.startConversation(
                        property.owner.id,
                        property.id,
                        `Hi, I'm interested in "${property.title}". Is it still available?`
                      );

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
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}