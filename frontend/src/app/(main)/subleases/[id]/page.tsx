// frontend/src/app/(main)/subleases/[id]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import PropertyImage from "@/components/common/PropertyImage";
import ContactOwnerModal from "@/components/messaging/ContactOwnerModal";
import UrgencyBadge from "@/components/subleases/UrgencyBadge";
import SubleaseCard from "@/components/subleases/SubleaseCard";
import apiService from "@/lib/api";
import { formatters } from "@/utils/formatters";
import toast from "react-hot-toast";
import {
  HeartIcon,
  ShareIcon,
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
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import type { Sublease } from "@/types/sublease";
import { calculateDurationMonths } from "@/types/sublease";

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

  // Load sublease data
  useEffect(() => {
    const loadSublease = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.subleases.getById(subleaseId);
        setSublease(response.data);
        
        // Use the isSaved field directly from the response
        setIsSaved(response.data.isSaved || false);
        
        // Load similar subleases
        loadSimilarSubleases(response.data);
      } catch (error) {
        console.error("Failed to load sublease:", error);
        toast.error("Error al cargar el subarriendo");
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
        // Exclude current sublease manually by filtering results
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
    toast("Inicia sesión para guardar", { icon: "🔐" });
    router.push("/login");
    return;
  }

  try {
    const response = await apiService.subleases.toggleSave(subleaseId);
    setIsSaved(response.data.isSaved);
    
    // Update the sublease object's saved count for UI consistency
    if (sublease) {
      setSublease({
        ...sublease,
        savedCount: response.data.isSaved 
          ? sublease.savedCount + 1 
          : Math.max(0, sublease.savedCount - 1)
      });
    }
    
    toast.success(response.data.isSaved ? "Guardado" : "Eliminado de guardados");
  } catch (error) {
    toast.error("Error al guardar");
  }
};

  const handleShare = async () => {
    const url = `${window.location.origin}/subleases/${subleaseId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: sublease?.title,
          text: `Mira este subarriendo: ${sublease?.title}`,
          url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    }
  };

  const handleContactClick = () => {
    if (!isAuthenticated) {
      toast("Inicia sesión para contactar", { icon: "🔒" });
      router.push(`/login?redirect=/subleases/${subleaseId}`);
      return;
    }
    setShowContactModal(true);
  };

  const handleWhatsApp = () => {
    if (!sublease?.user?.phone) {
      toast.error("Número no disponible");
      return;
    }
    const message = `Hola! Vi tu anuncio de subarriendo "${sublease.title}" en Micalli y me interesa.`;
    const whatsappUrl = `https://wa.me/52${sublease.user.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCall = () => {
    if (!sublease?.user?.phone) {
      toast.error("Número no disponible");
      return;
    }
    window.location.href = `tel:+52${sublease.user.phone}`;
  };

  const handleContactSuccess = (conversationId: number) => {
    router.push(`/messages/${conversationId}`);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200"></div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!sublease) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Subarriendo no encontrado</h2>
        </div>
      </MainLayout>
    );
  }

  const images = sublease.images || [];
  const mainImage = images[selectedImageIndex] || images[0];
  const duration = calculateDurationMonths(sublease.startDate, sublease.endDate);

  return (
    <MainLayout>
      <div className="min-h-screen bg-white">
        {/* Image Gallery Section */}
        <div className="relative bg-black">
          <div className="max-w-7xl mx-auto">
            <div className="relative h-[60vh] md:h-[70vh]">
              {images.length > 0 ? (
                <>
                  <div className="relative w-full h-full cursor-pointer" onClick={() => setShowImageModal(true)}>
                    <PropertyImage
                      image={mainImage}
                      alt={sublease.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  
                  {/* Image Navigation */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10"
                        disabled={selectedImageIndex === 0}
                      >
                        <ChevronLeftIcon className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1));
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10"
                        disabled={selectedImageIndex === images.length - 1}
                      >
                        <ChevronRightIcon className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg">
                    {selectedImageIndex + 1} / {images.length}
                  </div>

                  {/* View All Photos Button */}
                  <button
                    onClick={() => setShowImageModal(true)}
                    className="absolute bottom-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    Ver todas las fotos
                  </button>
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <HomeIcon className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === selectedImageIndex ? "border-white" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <PropertyImage
                        image={img}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <UrgencyBadge urgencyLevel={sublease.urgencyLevel} size="sm" />
                      {sublease.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          <CheckBadgeIcon className="w-4 h-4" />
                          Verificado
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {sublease.title}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {sublease.displayNeighborhood || sublease.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        {sublease.viewsCount} vistas
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="p-2 rounded-lg border hover:bg-gray-50 transition-all"
                    >
                      {isSaved ? (
                        <HeartIconSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 rounded-lg border hover:bg-gray-50 transition-all"
                    >
                      <ShareIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Key Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <p className="font-medium">
                      {sublease.subleaseType === 'entire_place' ? 'Lugar completo' : 
                       sublease.subleaseType === 'private_room' ? 'Cuarto privado' : 
                       'Cuarto compartido'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duración</p>
                    <p className="font-medium">{duration} {duration === 1 ? 'mes' : 'meses'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Habitaciones</p>
                    <p className="font-medium">{sublease.bedrooms || 1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Baños</p>
                    <p className="font-medium">{sublease.bathrooms || 1}</p>
                  </div>
                </div>
              </div>

              {/* Dates Section */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Fechas disponibles
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Check-in</p>
                    <p className="font-semibold">{formatters.date.full(sublease.startDate)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Check-out</p>
                    <p className="font-semibold">{formatters.date.full(sublease.endDate)}</p>
                  </div>
                </div>
                {sublease.isFlexible && (
                  <p className="mt-3 text-sm text-green-600 flex items-center gap-1">
                    <CheckBadgeIcon className="w-4 h-4" />
                    Fechas flexibles
                    {sublease.flexibilityRangeDays && ` - ±${sublease.flexibilityRangeDays} días`}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Descripción</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{sublease.description}</p>
                
                {sublease.additionalInfo && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Información adicional
                    </p>
                    <p className="text-sm text-blue-700">{sublease.additionalInfo}</p>
                  </div>
                )}
              </div>

              {/* Roommates Section (if shared) */}
              {(sublease.subleaseType === 'shared_room' || (sublease.currentRoommates && sublease.currentRoommates > 0)) && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-primary" />
                    Compañeros de cuarto
                  </h2>
                  
                  <div className="space-y-4">
                    {sublease.currentRoommates && sublease.totalRoommates && (
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-blue-900">
                            {sublease.currentRoommates} de {sublease.totalRoommates} espacios ocupados
                          </p>
                          {sublease.subleaseType === 'shared_room' && (
                            <p className="text-sm text-blue-700 mt-1">
                              ⚠️ Compartirás habitación con otra persona
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {sublease.roommateGenders && (
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Género de compañeros:</p>
                        <p className="font-medium">
                          {sublease.roommateGenders === 'all_male' ? 'Todos hombres' :
                           sublease.roommateGenders === 'all_female' ? 'Todas mujeres' :
                           sublease.roommateGenders === 'mixed' ? 'Mixto' : 'No especificado'}
                        </p>
                      </div>
                    )}

                    {sublease.roommateDescription && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Información de compañeros:</p>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-gray-700">{sublease.roommateDescription}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {sublease.amenities && sublease.amenities.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Amenidades incluidas</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {sublease.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-700">
                        <CheckBadgeIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Utilities & Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Utilities */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BoltIcon className="w-5 h-5 text-primary" />
                    Servicios incluidos
                  </h3>
                  <div className="space-y-2">
                    {sublease.utilitiesIncluded && sublease.utilitiesIncluded.length > 0 ? (
                      sublease.utilitiesIncluded.map((utility, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckBadgeIcon className="w-4 h-4 text-green-500" />
                          {utility}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">Servicios no incluidos</p>
                    )}
                  </div>
                </div>

                {/* House Rules */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-primary" />
                    Reglas de la casa
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      {sublease.petFriendly ? (
                        <CheckBadgeIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <XMarkIcon className="w-4 h-4 text-red-500" />
                      )}
                      {sublease.petFriendly ? 'Mascotas permitidas' : 'No se permiten mascotas'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      {sublease.smokingAllowed ? (
                        <CheckBadgeIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <XMarkIcon className="w-4 h-4 text-red-500" />
                      )}
                      {sublease.smokingAllowed ? 'Se permite fumar' : 'No fumar'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Info */}
              {sublease.landlordConsentStatus !== 'not_required' && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Información legal</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-gray-700">
                        Consentimiento del arrendador: {
                          sublease.landlordConsentStatus === 'confirmed' ? 'Confirmado' :
                          sublease.landlordConsentStatus === 'documented' ? 'Documentado' :
                          sublease.landlordConsentStatus === 'verified' ? 'Verificado' :
                          'No requerido'
                        }
                      </span>
                    </div>
                    {sublease.leaseTransferAllowed && (
                      <div className="flex items-center gap-2">
                        <CheckBadgeIcon className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-700">Transferencia de contrato permitida</span>
                      </div>
                    )}
                    {sublease.subleaseAgreementRequired && (
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm text-gray-700">Se requiere acuerdo de subarriendo</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Ubicación</h2>
                <div className="mb-4">
                  <p className="text-gray-600 mb-2">
                    <MapPinIcon className="w-4 h-4 inline mr-1" />
                    {sublease.displayArea || sublease.displayNeighborhood}
                  </p>
                  {sublease.universityProximities && sublease.universityProximities.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {sublease.universityProximities.map((proximity) => (
                        <div key={proximity.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <AcademicCapIcon className="w-4 h-4 text-primary" />
                          {proximity.university.name} - {proximity.distanceInKm || `${proximity.distanceInMeters}m`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Privacy Notice */}
                <div className="p-3 bg-blue-50 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    <ShieldCheckIcon className="w-4 h-4 inline mr-1" />
                    La ubicación exacta se compartirá después de la confirmación
                  </p>
                </div>

                {/* Map Placeholder */}
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Mapa interactivo próximamente</p>
                </div>
              </div>
            </div>

            {/* Right Column - Contact & Price */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Price Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-primary">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-gray-900">
                      ${formatters.number(sublease.subleaseRent)}
                      <span className="text-lg font-normal text-gray-600">/mes</span>
                    </p>
                    {sublease.depositAmount && sublease.depositAmount > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Depósito: ${formatters.number(sublease.depositAmount)}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {sublease.utilitiesIncluded?.length ? 'Servicios incluidos' : 'Sin servicios'} • {duration} {duration === 1 ? 'mes' : 'meses'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleWhatsApp}
                      className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Contactar por WhatsApp
                    </button>
                    
                    <button
                      onClick={handleContactClick}
                      className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-all"
                    >
                      Enviar Mensaje
                    </button>
                    
                    <button
                      onClick={handleCall}
                      className="w-full bg-white text-primary border-2 border-primary py-3 rounded-lg font-medium hover:bg-primary-50 transition-all"
                    >
                      Llamar
                    </button>
                  </div>
                </div>

                {/* Owner Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">Anunciado por</h3>
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {sublease.user?.profilePicture ? (
                        <PropertyImage
                          image={sublease.user.profilePicture}
                          alt={sublease.user.firstName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xl font-semibold text-primary">
                            {sublease.user?.firstName?.[0]}
                          </span>
                        </div>
                      )}
                      {sublease.user?.emailVerified && (
                        <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-5 h-5 text-green-500 bg-white rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold">
                        {sublease.user?.firstName} {sublease.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {typeof sublease.user?.university === 'object' 
                          ? sublease.user.university.name 
                          : 'Universidad'} • {sublease.user?.graduationYear || '2025'}
                      </p>
                      <div className="mt-2 space-y-1">
                        {sublease.user?.program && (
                          <p className="text-xs text-gray-500">
                            Estudiante de {sublease.user.program}
                          </p>
                        )}
                      </div>
                      
                      {/* Response time */}
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>Responde en ~15 minutos</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t text-center">
                    <button
                      onClick={() => router.push(`/profile/${sublease.user?.id}`)}
                      className="text-sm text-primary hover:underline"
                    >
                      Ver perfil completo
                    </button>
                  </div>
                </div>

                {/* Report */}
                <div className="text-center">
                  <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    Reportar este anuncio
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Subleases */}
          {similarSubleases.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Subarriendos similares</h2>
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

        {/* Image Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <PropertyImage
                image={images[selectedImageIndex]}
                alt={sublease.title}
                fill
                className="object-contain"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                    className="absolute left-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full"
                    disabled={selectedImageIndex === 0}
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))}
                    className="absolute right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full"
                    disabled={selectedImageIndex === images.length - 1}
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>
                </>
              )}
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