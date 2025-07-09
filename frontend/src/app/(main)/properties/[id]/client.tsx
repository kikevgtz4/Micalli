// frontend/src/app/(main)/properties/[id]/client.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import PropertyImage from "@/components/common/PropertyImage";
import PropertyMap from "@/components/map/PropertyMap";
import ViewingRequestForm from "@/components/property/ViewingRequestForm";
import apiService from "@/lib/api";
import { Property } from "@/types/api";
import { formatters } from "@/utils/formatters";
import { toast } from "react-hot-toast";
import {
  HeartIcon,
  ShareIcon,
  MapPinIcon,
  HomeIcon,
  SparklesIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  VideoCameraIcon,
  CameraIcon,
  CheckBadgeIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import PropertyLocationMap from "@/components/map/PropertyLocationMap";

interface PropertyDetailsClientProps {
  propertyId: string;
  initialData?: Property; // Add optional initial data prop
}

export default function PropertyDetailsClient({
  propertyId,
  initialData
}: PropertyDetailsClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showViewingForm, setShowViewingForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'location' | 'reviews'>('overview');
  const [isOwnerView, setIsOwnerView] = useState(false);

  // Animation refs
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If we have initial data, check if user is owner
    if (initialData && user?.userType === "property_owner" && initialData.owner?.id === user.id) {
      setIsOwnerView(true);
    }

    // Only fetch if we don't have initial data
    if (!initialData) {
      const fetchProperty = async () => {
        try {
          let response;
          if (user?.userType === "property_owner") {
            try {
              response = await apiService.properties.getByIdAsOwner(
                parseInt(propertyId)
              );
              setIsOwnerView(true);
            } catch (ownerError: any) {
              if (ownerError.response?.status === 404) {
                response = await apiService.properties.getById(
                  parseInt(propertyId)
                );
                setIsOwnerView(false);
              } else {
                throw ownerError;
              }
            }
          } else {
            response = await apiService.properties.getById(parseInt(propertyId));
            setIsOwnerView(false);
          }

          setProperty(response.data);
        } catch (err: any) {
          console.error("Error fetching property:", err);
          setError(
            err.response?.data?.detail || "Failed to load property details"
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchProperty();
    }
  }, [propertyId, user, initialData]);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        heroRef.current.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (property?.images?.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === (property?.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: property?.title,
        text: `Check out this property: ${property?.title}`,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      toast.error("Please login to save properties");
      router.push("/login");
      return;
    }
    
    setIsFavorited(!isFavorited);
    // TODO: Implement API call to save favorite
    toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
          {/* Skeleton loader with animations */}
          <div className="animate-pulse">
            <div className="h-[70vh] bg-stone-200"></div>
            <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="h-8 bg-stone-200 rounded-lg w-3/4 mb-4"></div>
                <div className="h-4 bg-stone-200 rounded w-1/2 mb-8"></div>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-stone-200 rounded-xl"></div>
                  ))}
                </div>
                <div className="h-40 bg-stone-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !property) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="mb-8">
              <BuildingOfficeIcon className="h-24 w-24 text-stone-300 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              Property Not Found
            </h2>
            <p className="text-stone-600 mb-8">
              {error || "The property you're looking for doesn't exist."}
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all hover:scale-105"
            >
              Browse Properties
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const amenityIcons: Record<string, any> = {
    'WiFi': <SparklesIcon className="h-5 w-5" />,
    'Air Conditioning': <SparklesIcon className="h-5 w-5" />,
    'Parking': <SparklesIcon className="h-5 w-5" />,
    'Gym': <SparklesIcon className="h-5 w-5" />,
    'Swimming Pool': <SparklesIcon className="h-5 w-5" />,
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
        {/* Hero Image Section */}
        <div className="relative h-[70vh] overflow-hidden">
          <div ref={heroRef} className="absolute inset-0">
            {property.images && property.images.length > 0 ? (
              <PropertyImage
                image={property.images[currentImageIndex]}
                alt={property.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="bg-gradient-to-br from-stone-200 to-stone-300 h-full w-full flex items-center justify-center">
                <CameraIcon className="h-24 w-24 text-stone-400" />
              </div>
            )}
          </div>

          {/* Dark overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

          {/* Navigation Controls */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
            <button
              onClick={() => router.back()}
              className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
            >
              <ChevronLeftIcon className="h-6 w-6 text-stone-700" />
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
              >
                <ShareIcon className="h-6 w-6 text-stone-700" />
              </button>
              <button
                onClick={handleFavorite}
                className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
              >
                {isFavorited ? (
                  <HeartSolidIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <HeartIcon className="h-6 w-6 text-stone-700" />
                )}
              </button>
            </div>
          </div>

          {/* Image Gallery Controls */}
          {property.images && property.images.length > 1 && (
            <>
              <button
                onClick={handlePreviousImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
              >
                <ChevronLeftIcon className="h-6 w-6 text-stone-700" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
              >
                <ChevronRightIcon className="h-6 w-6 text-stone-700" />
              </button>

              {/* Image indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {property.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? "bg-white w-8"
                        : "bg-white/60 w-2 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* View All Photos Button */}
          {property.images && property.images.length > 1 && (
            <button
              onClick={() => setIsImageGalleryOpen(true)}
              className="absolute bottom-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-white transition-all hover:scale-105 flex items-center gap-2"
            >
              <CameraIcon className="h-5 w-5" />
              <span className="font-medium">View All {property.images.length} Photos</span>
            </button>
          )}
        </div>

        {/* Main Content */}
        <div ref={contentRef} className="max-w-7xl mx-auto px-4 -mt-32 relative z-10 pb-20">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Property Header */}
            <div className="p-8 border-b border-stone-100">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-4xl font-bold text-stone-900">
                      {property.title}
                    </h1>
                    {property.isVerified && (
                      <CheckBadgeIcon className="h-8 w-8 text-primary-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 text-stone-600">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-5 w-5 text-primary-500" />
                      <span>{property.address}</span>
                    </div>
                    {property.universityProximities?.[0] && (
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="h-5 w-5 text-primary-500" />
                        <span className="text-sm">
                          {property.universityProximities[0].walkingTimeMinutes} min walk to{" "}
                          {property.universityProximities[0].university.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-2xl shadow-lg">
                    <div className="text-3xl font-bold">
                      ${formatters.number(property.rentAmount)}
                    </div>
                    <div className="text-sm opacity-90">per month</div>
                  </div>
                  
                  {isOwnerView && (
                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          property.isActive
                            ? "bg-success-50 text-success-600"
                            : "bg-warning-50 text-warning-600"
                        }`}
                      >
                        {property.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-stone-50">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl mb-3">
                  <HomeIcon className="h-7 w-7" />
                </div>
                <div className="text-2xl font-bold text-stone-900">
                  {property.bedrooms}
                </div>
                <div className="text-sm text-stone-600">
                  {property.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl mb-3">
                  <SparklesIcon className="h-7 w-7" />
                </div>
                <div className="text-2xl font-bold text-stone-900">
                  {property.bathrooms}
                </div>
                <div className="text-sm text-stone-600">
                  {property.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl mb-3">
                  <CalendarIcon className="h-7 w-7" />
                </div>
                <div className="text-2xl font-bold text-stone-900">
                  {new Date(property.availableFrom).toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="text-sm text-stone-600">Available</div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl mb-3">
                  <ClockIcon className="h-7 w-7" />
                </div>
                <div className="text-2xl font-bold text-stone-900">
                  {property.minimumStay}
                </div>
                <div className="text-sm text-stone-600">Min. Months</div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-stone-200">
              <div className="flex gap-8 px-8">
                {(['overview', 'amenities', 'location', 'reviews'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-2 border-b-2 font-medium transition-all capitalize ${
                      activeTab === tab
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900 mb-4">
                      About this property
                    </h2>
                    <p className="text-stone-600 leading-relaxed">
                      {property.description || "No description available."}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-stone-50 rounded-2xl p-6">
                      <h3 className="font-semibold text-stone-900 mb-4">Property Features</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-600">Type</span>
                          <span className="font-medium text-stone-900 capitalize">
                            {property.propertyType}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-600">Total Area</span>
                          <span className="font-medium text-stone-900">
                            {property.totalArea} m²
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-600">Furnished</span>
                          <span className="font-medium text-stone-900">
                            {property.furnished ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-stone-50 rounded-2xl p-6">
                      <h3 className="font-semibold text-stone-900 mb-4">Rental Terms</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-600">Deposit</span>
                          <span className="font-medium text-stone-900">
                            ${formatters.number(property.depositAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-600">Payment</span>
                          <span className="font-medium text-stone-900 capitalize">
                            {property.paymentFrequency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-600">Max Stay</span>
                          <span className="font-medium text-stone-900">
                            {property.maximumStay ? `${property.maximumStay} months` : "No limit"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Amenities Tab */}
              {activeTab === 'amenities' && (
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-6">
                    Amenities & Features
                  </h2>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {property.amenities?.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                          {amenityIcons[amenity] || <SparklesIcon className="h-5 w-5" />}
                        </div>
                        <span className="font-medium text-stone-900">{amenity}</span>
                      </div>
                    ))}
                  </div>

                  {property.includedUtilities && property.includedUtilities.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold text-stone-900 mb-4">
                        Included Utilities
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {property.includedUtilities.map((utility) => (
                          <span
                            key={utility}
                            className="px-4 py-2 bg-success-50 text-success-700 rounded-xl font-medium"
                          >
                            {utility}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Location Tab */}
{activeTab === 'location' && (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-stone-900 mb-2">
        Location
      </h2>
      <p className="text-stone-600 mb-6">
        Exact location will be provided after booking confirmation
      </p>
    </div>

    {/* Map Container with new component */}
    <PropertyLocationMap
      latitude={property.latitude || 25.6866}
      longitude={property.longitude || -100.3161}
      privacyRadius={property.privacyRadius}
      title={property.title}
      height="450px"
    />

    {/* Neighborhood Information */}
    {(property.displayNeighborhood || property.displayArea) && (
      <div className="bg-stone-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          Neighborhood
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {property.displayNeighborhood && (
            <div>
              <p className="text-sm text-stone-600 mb-1">Area</p>
              <p className="font-medium text-stone-900">
                {property.displayNeighborhood}
              </p>
            </div>
          )}
          {property.displayArea && (
            <div>
              <p className="text-sm text-stone-600 mb-1">District</p>
              <p className="font-medium text-stone-900">
                {property.displayArea}
              </p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* University Proximities with enhanced design */}
    {property.universityProximities && property.universityProximities.length > 0 && (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
          Nearby Universities
        </h3>
        <div className="space-y-3">
          {property.universityProximities
            .sort((a, b) => a.distanceInMeters - b.distanceInMeters)
            .map((proximity) => (
            <div
              key={proximity.id}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-stone-900">
                    {proximity.university.name}
                  </h4>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-1 text-stone-600">
                      <MapPinIcon className="h-4 w-4" />
                      <span>{formatters.distance(proximity.distanceInMeters)}</span>
                    </div>
                    {proximity.walkingTimeMinutes && (
                      <div className="flex items-center gap-1 text-stone-600">
                        <ClockIcon className="h-4 w-4" />
                        <span>{proximity.walkingTimeMinutes} min walk</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-700">
                      {proximity.distanceInMeters < 1000 
                        ? `${proximity.distanceInMeters}m` 
                        : `${(proximity.distanceInMeters / 1000).toFixed(1)}km`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Getting Around section */}
    <div className="border-t border-stone-200 pt-6">
      <h3 className="text-lg font-semibold text-stone-900 mb-4">
        Getting Around
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-stone-900">Public Transport</p>
            <p className="text-sm text-stone-600 mt-1">
              Multiple bus routes and metro stations nearby
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-stone-900">Walkable Area</p>
            <p className="text-sm text-stone-600 mt-1">
              Restaurants, shops, and services within walking distance
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="text-center py-12">
                  <StarIcon className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-stone-900 mb-2">
                    No reviews yet
                  </h3>
                  <p className="text-stone-600">
                    Be the first to review this property
                  </p>
                </div>
              )}
            </div>

            {/* Contact Section */}
            <div className="border-t border-stone-200 p-8 bg-stone-50">
              <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-stone-900">
                        {property.owner?.firstName && property.owner?.lastName 
                          ? `${property.owner.firstName} ${property.owner.lastName}`
                          : property.owner?.username || "Property Owner"}
                      </h3>
                      <div className="flex items-center gap-2 text-stone-600">
                        <ShieldCheckIcon className="h-5 w-5 text-primary-500" />
                        <span>Verified Owner</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => {
                        if (!user) {
                          toast.error("Please login to message the owner");
                          router.push("/login");
                          return;
                        }
                        router.push(`/messages?propertyId=${property.id}`);
                      }}
                      className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105"
                    >
                      Message Owner
                    </button>
                  </div>

                  <p className="text-center text-sm text-stone-500 mt-4">
                    <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
                    Contact information is shared through our secure messaging system
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Screen Image Gallery */}
        {isImageGalleryOpen && property.images && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <button
              onClick={() => setIsImageGalleryOpen(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            <button
              onClick={handlePreviousImage}
              className="absolute left-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>

            <button
              onClick={handleNextImage}
              className="absolute right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>

            <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-auto px-4">
              <PropertyImage
                image={property.images[currentImageIndex]}
                alt={`${property.title} - ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}