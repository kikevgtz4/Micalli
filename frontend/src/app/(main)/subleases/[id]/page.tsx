// frontend/src/app/(main)/subleases/[id]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import PropertyImage from "@/components/common/PropertyImage";
import PropertyLocationMap from "@/components/map/PropertyLocationMap";
import ContactOwnerModal from "@/components/messaging/ContactOwnerModal";
import UrgencyBadge from "@/components/subleases/UrgencyBadge";
import SubleaseCard from "@/components/subleases/SubleaseCard";
import SubleaseImageGallery from "@/components/subleases/SubleaseImageGallery";
import SubleaseBookingCard from "@/components/subleases/SubleaseBookingCard";
import apiService from "@/lib/api";
import { formatters } from "@/utils/formatters";
import toast from "react-hot-toast";
import {
  MapPinIcon,
  CalendarIcon,
  HomeIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  EyeIcon,
  ClockIcon,
  BoltIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CameraIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  UserIcon,
  DocumentCheckIcon,
  WifiIcon,
  TvIcon,
  FireIcon,
  CubeIcon,
  BeakerIcon,
  AdjustmentsHorizontalIcon,
  SunIcon,
  KeyIcon,
  BuildingStorefrontIcon,
  Square3Stack3DIcon,
  RectangleGroupIcon,
  HeartIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import type { Sublease } from "@/types/sublease";
import { calculateDurationMonths } from "@/types/sublease";

// Amenity icon mapping
const amenityIcons: Record<string, any> = {
  'WiFi': WifiIcon,
  'WiFi de alta velocidad': WifiIcon,
  'Aire acondicionado': AdjustmentsHorizontalIcon,
  'Calefacción': FireIcon,
  'Lavadora': BeakerIcon,
  'Secadora': SunIcon,
  'Cocina equipada': CubeIcon,
  'Microondas': CubeIcon,
  'Refrigerador': Square3Stack3DIcon,
  'Televisión': TvIcon,
  'TV': TvIcon,
  'Escritorio': RectangleGroupIcon,
  'Gimnasio': HeartIcon,
  'Alberca': SparklesIcon,
  'Estacionamiento': KeyIcon,
  'Parking': KeyIcon,
  'Seguridad 24/7': ShieldCheckIcon,
  'Terraza': SunIcon,
  'Jardín': SparklesIcon,
  'Elevador': BuildingOfficeIcon,
  'Amueblado': HomeIcon,
  'Closet amplio': Square3Stack3DIcon,
  'Balcón': SunIcon,
};

export default function SubleaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const subleaseId = Number(params.id);

  // State
  const [sublease, setSublease] = useState<Sublease | null>(null);
  const [similarSubleases, setSimilarSubleases] = useState<Sublease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  // Load sublease data
  useEffect(() => {
    const loadSublease = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.subleases.getById(subleaseId);
        setSublease(response.data);
        setIsSaved(response.data.isSaved || false);
        loadSimilarSubleases(response.data);
      } catch (error) {
        console.error("Failed to load sublease:", error);
        toast.error("Error loading sublease");
        router.push("/roommates");
      } finally {
        setIsLoading(false);
      }
    };

    if (subleaseId) {
      loadSublease();
    }
  }, [subleaseId]);

  const loadSimilarSubleases = async (currentSublease: Sublease) => {
    try {
      const response = await apiService.subleases.getAll({
        subleaseType: currentSublease.subleaseType,
        pageSize: 5,
      });
      const filtered = response.data.results.filter(s => s.id !== currentSublease.id).slice(0, 4);
      setSimilarSubleases(filtered);
    } catch (error) {
      console.error("Failed to load similar subleases:", error);
    }
  };

  // Handlers
  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to save");
      router.push("/login");
      return;
    }

    try {
      const response = await apiService.subleases.toggleSave(subleaseId);
      setIsSaved(response.data.isSaved);
      
      if (sublease) {
        setSublease({
          ...sublease,
          savedCount: response.data.isSaved 
            ? sublease.savedCount + 1 
            : Math.max(0, sublease.savedCount - 1)
        });
      }
      
      toast.success(response.data.isSaved ? "Saved to favorites" : "Removed from favorites");
    } catch (error) {
      toast.error("Error saving sublease");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/subleases/${subleaseId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: sublease?.title,
          text: `Check out this sublease: ${sublease?.title}`,
          url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const handleContactClick = () => {
    if (!isAuthenticated) {
      toast.error("Please login to contact");
      router.push(`/login?redirect=/subleases/${subleaseId}`);
      return;
    }
    setShowContactModal(true);
  };

  const handleContactSuccess = (conversationId: number) => {
    router.push(`/messages/${conversationId}`);
  };

  const getAmenityIcon = (amenity: string) => {
    const Icon = amenityIcons[amenity] || SparklesIcon;
    return Icon;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="animate-pulse">
            <div className="h-[500px] bg-gray-200"></div>
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-32 bg-gray-200 rounded-xl"></div>
                  <div className="h-64 bg-gray-200 rounded-xl"></div>
                </div>
                <div className="lg:col-span-1">
                  <div className="h-96 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!sublease) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <HomeIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Sublease not found</h2>
          </div>
        </div>
      </MainLayout>
    );
  }

  const images = sublease.images || [];
  const duration = calculateDurationMonths(sublease.startDate, sublease.endDate);

  return (
    <MainLayout>
      <div className="min-h-screen bg-white pt-18">
        {/* Image Gallery */}
          <SubleaseImageGallery 
            images={images} 
            title={sublease.title} 
          />
          
          {/* Main Content */}
<div className="max-w-7xl mx-auto px-6 py-8">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Left Column - Main Content */}
    <div className="lg:col-span-2 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <UrgencyBadge urgencyLevel={sublease.urgencyLevel} size="lg" />
          {sublease.isVerified && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-200">
              <CheckBadgeIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Verified</span>
            </div>
          )}
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {sublease.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-primary-600" />
            <span>{sublease.displayNeighborhood || sublease.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <EyeIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm">{sublease.viewsCount} views</span>
          </div>
          <div className="flex items-center gap-2">
            <HeartIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm">{sublease.savedCount} saved</span>
          </div>
        </div>
      </div>

      {/* Key Features - Redesigned with proper priority */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-2">
            <HomeIcon className="h-6 w-6 text-primary-600" />
          </div>
          <p className="text-xs text-gray-600">Bedrooms</p>
          <p className="font-semibold text-gray-900">{sublease.bedrooms || 1}</p>
        </div>
        
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-2">
            <SparklesIcon className="h-6 w-6 text-primary-600" />
          </div>
          <p className="text-xs text-gray-600">Bathrooms</p>
          <p className="font-semibold text-gray-900">{sublease.bathrooms || 1}</p>
        </div>
        
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-2">
            <Square3Stack3DIcon className="h-6 w-6 text-primary-600" />
          </div>
          <p className="text-xs text-gray-600">Area</p>
          <p className="font-semibold text-gray-900">
            {sublease.totalArea ? `${sublease.totalArea}m²` : 'N/A'}
          </p>
        </div>
        
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-2">
            <CalendarDaysIcon className="h-6 w-6 text-primary-600" />
          </div>
          <p className="text-xs text-gray-600">Duration</p>
          <p className="font-semibold text-gray-900">
            {duration} {duration === 1 ? 'mo' : 'mos'}
          </p>
        </div>
        
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-2">
            <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
          </div>
          <p className="text-xs text-gray-600">Type</p>
          <p className="font-semibold text-gray-900">
            {sublease.subleaseType === 'entire_place' ? 'Entire' : 
             sublease.subleaseType === 'private_room' ? 'Private Room' : 'Shared Room'}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">About this sublease</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {sublease.description}
        </p>
        
        {sublease.additionalInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-1">
              Additional Information
            </p>
            <p className="text-sm text-gray-700">{sublease.additionalInfo}</p>
          </div>
        )}
      </div>

      {/* Available Dates */}
      <div className="bg-primary-50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary-600" />
          Available Dates
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Move-in</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatters.date.full(sublease.startDate)}
            </p>
            {sublease.availableImmediately && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                <BoltIcon className="h-3 w-3" />
                Available Now
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Move-out</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatters.date.full(sublease.endDate)}
            </p>
            {sublease.isFlexible && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                <CheckBadgeIcon className="h-3 w-3" />
                Flexible ±{sublease.flexibilityRangeDays} days
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Roommates Section */}
      {(sublease.subleaseType === 'shared_room' || sublease.currentRoommates) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserGroupIcon className="h-6 w-6 text-primary-600" />
            Roommate Information
          </h2>
          
          {sublease.currentRoommates !== undefined && sublease.totalRoommates && (
            <div className="bg-primary-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {sublease.currentRoommates}/{sublease.totalRoommates}
                  </p>
                  <p className="text-sm text-gray-600">spaces occupied</p>
                </div>
                {sublease.subleaseType === 'shared_room' && (
                  <div className="bg-white px-3 py-1 rounded-full text-sm font-medium text-primary-700 border border-primary-200">
                    Shared bedroom
                  </div>
                )}
              </div>
            </div>
          )}

          {sublease.roommateDescription && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">About your roommates</p>
              <p className="text-gray-900">{sublease.roommateDescription}</p>
            </div>
          )}
        </div>
      )}

      {/* Amenities */}
      {sublease.amenities && sublease.amenities.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What this place offers</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sublease.amenities.slice(0, showAllAmenities ? undefined : 9).map((amenity, idx) => {
              const Icon = getAmenityIcon(amenity);
              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary-600" />
                  </div>
                  <span className="text-sm text-gray-700">{amenity}</span>
                </div>
              );
            })}
          </div>
          {sublease.amenities.length > 9 && !showAllAmenities && (
            <button
              onClick={() => setShowAllAmenities(true)}
              className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              Show all {sublease.amenities.length} amenities
            </button>
          )}
        </div>
      )}

      {/* Utilities & Rules */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Utilities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-primary-600" />
            Utilities Included
          </h3>
          {sublease.utilitiesIncluded && sublease.utilitiesIncluded.length > 0 ? (
            <div className="space-y-2">
              {sublease.utilitiesIncluded.map((utility, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 text-primary-600" />
                  </div>
                  <span className="text-gray-700">{utility}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No utilities included</p>
          )}
        </div>

        {/* House Rules */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
            House Rules
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                sublease.petFriendly ? 'bg-primary-100' : 'bg-gray-100'
              }`}>
                {sublease.petFriendly ? (
                  <CheckIcon className="h-3 w-3 text-primary-600" />
                ) : (
                  <XMarkIcon className="h-3 w-3 text-gray-400" />
                )}
              </div>
              <span className="text-gray-700">
                {sublease.petFriendly ? 'Pets allowed' : 'No pets'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                sublease.smokingAllowed ? 'bg-primary-100' : 'bg-gray-100'
              }`}>
                {sublease.smokingAllowed ? (
                  <CheckIcon className="h-3 w-3 text-primary-600" />
                ) : (
                  <XMarkIcon className="h-3 w-3 text-gray-400" />
                )}
              </div>
              <span className="text-gray-700">
                {sublease.smokingAllowed ? 'Smoking allowed' : 'No smoking'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legal & Compliance */}
      {sublease.landlordConsentStatus && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DocumentCheckIcon className="h-5 w-5 text-primary-600" />
            Legal & Compliance
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckBadgeIcon className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Landlord Consent</p>
                <p className="text-sm text-gray-600">
                  {sublease.landlordConsentStatus === 'confirmed' ? 'Confirmed and documented' :
                   sublease.landlordConsentStatus === 'documented' ? 'Written consent available' :
                   sublease.landlordConsentStatus === 'verified' ? 'Verified by platform' :
                   'Pending verification'}
                </p>
              </div>
            </div>
            {sublease.leaseTransferAllowed && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <DocumentCheckIcon className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Lease Transfer</p>
                  <p className="text-sm text-gray-600">Full lease transfer available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Where you'll be</h2>
        <p className="text-gray-600 mb-4">
          {sublease.displayNeighborhood}, {sublease.displayArea}
        </p>
        
        <PropertyLocationMap
          latitude={sublease.approxLatitude || sublease.latitude || 25.6866}
          longitude={sublease.approxLongitude || sublease.longitude || -100.3161}
          privacyRadius={250}
          title={sublease.title}
          height="450px"
        />

        {/* University Proximities */}
        {sublease.universityProximities && sublease.universityProximities.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-medium text-gray-900">Nearby Universities</h3>
            {sublease.universityProximities
              .sort((a, b) => a.distanceInMeters - b.distanceInMeters)
              .map((proximity) => (
              <div key={proximity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <AcademicCapIcon className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {proximity.university.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {proximity.walkingTimeMinutes} min walk • {formatters.distance(proximity.distanceInMeters)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <SubleaseBookingCard
                sublease={sublease}
                isSaved={isSaved}
                onSave={handleSave}
                onShare={handleShare}
                onContact={handleContactClick}
              />
            </div>
          </div>

          {/* Similar Subleases */}
          {similarSubleases.length > 0 && (
            <div className="mt-16 border-t pt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar subleases</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarSubleases.map((similar) => (
                  <SubleaseCard
                    key={similar.id}
                    sublease={similar}
                    onSave={async () => false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Full Screen Image Gallery Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all z-10"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            <button
              onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
              className="absolute left-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
              disabled={selectedImageIndex === 0}
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>

            <button
              onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))}
              className="absolute right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
              disabled={selectedImageIndex === images.length - 1}
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>

            <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-auto px-4">
              <PropertyImage
                image={images[selectedImageIndex]}
                alt={`${sublease.title} - ${selectedImageIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
              {selectedImageIndex + 1} / {images.length}
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && sublease && (
          <ContactOwnerModal
            property={{
              id: sublease.id,
              title: sublease.title,
              address: sublease.address,
              rentAmount: sublease.subleaseRent,
              owner: sublease.user,
            } as any}
            isOpen={showContactModal}
            onClose={() => setShowContactModal(false)}
            onSuccess={handleContactSuccess}
          />
        )}
      </div>
    </MainLayout>
  );
}