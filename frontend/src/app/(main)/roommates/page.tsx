// frontend/src/app/(main)/roommates/page.tsx
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import RoommateCard from "@/components/roommates/RoommateCard";
import ProfileCompletionPrompt from "@/components/roommates/ProfileCompletionPrompt";
import SubleaseCard from "@/components/subleases/SubleaseCard";
import PropertyFiltersPanel from "@/components/property/PropertyFiltersPanel";
import RoommateFiltersPanel from "@/components/roommates/RoommateFiltersPanel";
import PropertySortDropdown from "@/components/property/PropertySortDropdown";
import apiService from "@/lib/api";
import { RoommateProfile, RoommateMatch } from "@/types/api";
import { PropertyFilters, SortOption } from "@/types/filters";
import {
  useSubleases,
  useSubleaseFilters,
} from "@/hooks/subleases/useSubleases";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  HomeIcon,
  Squares2X2Icon,
  Bars3Icon,
  MapIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const COMPLETION_THRESHOLDS = {
  VIEW_FULL_PROFILES: 60,
  UNLOCK_ALL_FEATURES: 80,
} as const;

// Separate sort options for each tab
const ROOMMATE_SORT_OPTIONS = [
  { value: 'compatibility', label: 'Mejor Compatibilidad' },
  { value: 'newest', label: 'Más Reciente' },
  { value: 'age_asc', label: 'Edad: Menor a Mayor' },
  { value: 'age_desc', label: 'Edad: Mayor a Menor' },
];

const SUBLEASE_SORT_OPTIONS = [
  { value: 'newest', label: 'Más Reciente' },
  { value: 'price_asc', label: 'Precio: Menor a Mayor' },
  { value: 'price_desc', label: 'Precio: Mayor a Menor' },
  { value: 'urgency', label: 'Más Urgente' },
  { value: 'duration', label: 'Duración Más Corta' },
];

export default function RoommatesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // State Management
  const [activeTab, setActiveTab] = useState<'roommates' | 'subleases'>('roommates');
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Separate view modes for each tab
  const [roommateViewMode, setRoommateViewMode] = useState<'grid' | 'list'>('grid');
  const [subleaseViewMode, setSubleaseViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  
  // Separate sort options
  const [roommateSortOption, setRoommateSortOption] = useState('compatibility');
  const [subleaseSortOption, setSubleaseSortOption] = useState<SortOption>('newest');
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // Roommate state
  const [profileState, setProfileState] = useState({
    completion: 0,
    hasProfile: false,
    onboardingCompleted: false,
    matches: [] as (RoommateProfile | RoommateMatch)[],
  });
  
  const [isLoadingRoommates, setIsLoadingRoommates] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [sampleProfiles, setSampleProfiles] = useState<RoommateProfile[]>([]);

  // Roommate filters
  const [roommateFilters, setRoommateFilters] = useState({
    ageMin: 18,
    ageMax: 35,
    gender: '',
    major: '',
    lifestyle: [] as string[],
    habits: [] as string[],
    interests: [] as string[],
  });

  // Sublease filters using property filter structure
  const [subleaseFilters, setSubleaseFilters] = useState<PropertyFilters>({
    priceMin: 0,
    priceMax: 50000,
    propertyType: '',
    bedrooms: undefined,
    bathrooms: undefined,
    furnished: false,
    petFriendly: false,
    smokingAllowed: false,
    amenities: [],
    universityId: undefined,
    maxDistance: undefined,
  });

  const updateRoommateFilter = <K extends keyof typeof roommateFilters>(
    key: K,
    value: typeof roommateFilters[K]
  ) => {
    setRoommateFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateSubleaseFilter = <K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    setSubleaseFilters(prev => ({ ...prev, [key]: value }));
  };

  // Sublease data
  const {
    subleases,
    isLoading: subleasesLoading,
    error: subleasesError,
  } = useSubleases({
    filters: subleaseFilters as any,
    autoFetch: true,
  });

  // Load profiles effect (same as before)
  useEffect(() => {
    const loadProfiles = async () => {
      setIsLoadingRoommates(true);
      try {
        if (isAuthenticated && user?.userType === "student") {
          try {
            const response = await apiService.roommates.getOnboardingStatus();
            if (response.data.hasProfile) {
              const [profileResult, matchesResult] = await Promise.allSettled([
                apiService.roommates.getMyProfile(),
                apiService.roommates.findMatches({ limit: 20 }),
              ]);

              let completion = 0;
              let hasProfile = false;

              if (profileResult.status === "fulfilled") {
                const profile = profileResult.value.data;
                completion = profile.profileCompletionPercentage || 0;
                hasProfile = true;
              }

              let matches: (RoommateProfile | RoommateMatch)[] = [];
              if (matchesResult.status === "fulfilled") {
                matches = matchesResult.value.data.matches || [];
              }

              setProfileState({
                completion,
                hasProfile,
                onboardingCompleted: response.data.onboardingCompleted,
                matches,
              });
            } else {
              await loadSampleProfiles();
            }
          } catch (error) {
            console.error("Failed to load profile/matches:", error);
            await loadSampleProfiles();
          }
        } else {
          await loadSampleProfiles();
        }
      } catch (error) {
        console.error("Failed to load profiles:", error);
      } finally {
        setIsLoadingRoommates(false);
      }
    };

    loadProfiles();
  }, [isAuthenticated, user]);

  const loadSampleProfiles = async () => {
    try {
      const response = await apiService.roommates.getPublicProfiles({
        limit: 20,
      });
      setSampleProfiles(response.data || []);
    } catch (error) {
      console.error("Failed to load sample profiles:", error);
      setSampleProfiles([]);
    }
  };

  // Handlers
  const handleSaveSublease = async (id: number) => {
    if (!isAuthenticated) {
      toast("Inicia sesión para guardar subarriendos", {
        icon: "🔒",
      });
      router.push("/login");
      return false;
    }

    try {
      const response = await apiService.subleases.toggleSave(id);
      toast.success(
        response.data.isSaved ? "Subarriendo guardado!" : "Removido de guardados"
      );
      return response.data.isSaved;
    } catch (error) {
      console.error("Failed to save sublease:", error);
      toast.error("Error al guardar subarriendo");
      return false;
    }
  };

  const handleProfileCardClick = useCallback(
    (profileId: number) => {
      if (!isAuthenticated) {
        toast("Inicia sesión para ver perfiles completos", {
          icon: "🔒",
        });
        router.push("/login");
        return;
      }

      if (user?.userType !== "student") {
        toast("Solo estudiantes pueden ver perfiles de roommates", {
          icon: "📚",
        });
        return;
      }

      if (!profileState.hasProfile) {
        setShowCompletionModal(true);
        return;
      }

      if (profileState.completion < COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES) {
        setShowCompletionModal(true);
        return;
      }

      router.push(`/roommates/profile/${profileId}`);
    },
    [isAuthenticated, user, profileState.hasProfile, profileState.completion, router]
  );

  // Filter matches
  const filteredMatches = useMemo(() => {
    const profilesToFilter =
      profileState.hasProfile && profileState.matches.length > 0
        ? profileState.matches
        : sampleProfiles;

    const validProfiles = profilesToFilter.filter(
      (profile) => profile && profile.id && profile.user && (profile.user.id || profile.id)
    );

    if (!searchQuery) return validProfiles;

    const searchLower = searchQuery.toLowerCase();
    return validProfiles.filter(
      (match) =>
        match.user?.firstName?.toLowerCase().includes(searchLower) ||
        match.user?.lastName?.toLowerCase().includes(searchLower) ||
        match.major?.toLowerCase().includes(searchLower) ||
        match.bio?.toLowerCase().includes(searchLower)
    );
  }, [profileState.matches, profileState.hasProfile, sampleProfiles, searchQuery]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 pt-18">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Encuentra tu espacio perfecto
            </h1>
            <p className="text-gray-600">
              Conecta con compañeros de cuarto ideales o encuentra subarriendos temporales en Monterrey
            </p>
            
            {/* Tabs - Left aligned for better hierarchy */}
            <div className="mt-6">
              <div className="inline-flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('roommates')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'roommates'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserGroupIcon className="w-4 h-4" />
                  Compañeros de Cuarto
                </button>
                <button
                  onClick={() => setActiveTab('subleases')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'subleases'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  Subarriendos
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Controls Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'roommates'
                      ? "Buscar por nombre, carrera o intereses..."
                      : "Buscar por ubicación, tipo o amenidades..."
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Controls - Different per tab */}
              <div className="flex items-center gap-2">
                {/* Filters Button */}
                <button
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setShowMobileFilters(!showMobileFilters);
                    } else {
                      setShowFilters(!showFilters);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                    showFilters || showMobileFilters
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Filtros</span>
                </button>

                {/* View Mode Toggle - Different for each tab */}
                <div className="flex bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => {
                      if (activeTab === 'roommates') {
                        setRoommateViewMode('grid');
                      } else {
                        setSubleaseViewMode('grid');
                      }
                    }}
                    className={`p-2.5 rounded-l-lg ${
                      (activeTab === 'roommates' ? roommateViewMode : subleaseViewMode) === 'grid'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (activeTab === 'roommates') {
                        setRoommateViewMode('list');
                      } else {
                        setSubleaseViewMode('list');
                      }
                    }}
                    className={`p-2.5 ${
                      (activeTab === 'roommates' ? roommateViewMode : subleaseViewMode) === 'list'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    } ${activeTab === 'roommates' ? 'rounded-r-lg' : ''}`}
                  >
                    <Bars3Icon className="w-5 h-5" />
                  </button>
                  
                  {/* Map view only for subleases */}
                  {activeTab === 'subleases' && (
                    <button
                      onClick={() => setSubleaseViewMode('map')}
                      className={`p-2.5 rounded-r-lg ${
                        subleaseViewMode === 'map'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <MapIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Sort Dropdown - Different options per tab */}
                {activeTab === 'roommates' ? (
                  <select
                    value={roommateSortOption}
                    onChange={(e) => setRoommateSortOption(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {ROOMMATE_SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <PropertySortDropdown 
                    value={subleaseSortOption} 
                    onChange={setSubleaseSortOption} 
                  />
                )}

                {/* Add Listing Button */}
                {isAuthenticated && user?.userType === 'student' && (
                  <button
                    onClick={() => {
                      if (activeTab === 'roommates') {
                        if (profileState.hasProfile) {
                          router.push('/roommates/profile/edit');
                        } else {
                          router.push('/roommates/onboarding');
                        }
                      } else {
                        router.push('/subleases/create');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span className="hidden lg:inline">
                      {activeTab === 'roommates' 
                        ? (profileState.hasProfile ? 'Editar Perfil' : 'Crear Perfil')
                        : 'Publicar Subarriendo'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* Desktop Filters Sidebar - Different component per tab */}
            {showFilters && (
              <div className="hidden lg:block w-80 flex-shrink-0">
                <div className="sticky top-28">
                  {activeTab === 'roommates' ? (
                    <RoommateFiltersPanel
                      filters={roommateFilters}
                      onFilterChange={updateRoommateFilter}
                      onClose={() => setShowFilters(false)}
                    />
                  ) : (
                    <PropertyFiltersPanel
                      filters={subleaseFilters}
                      universities={[]} // Load your universities here
                      onFilterChange={updateSubleaseFilter}
                      onClose={() => setShowFilters(false)}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Mobile Filters Drawer */}
            <AnimatePresence>
              {showMobileFilters && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMobileFilters(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    className="lg:hidden fixed left-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto"
                  >
                    {activeTab === 'roommates' ? (
                      <RoommateFiltersPanel
                        filters={roommateFilters}
                        onFilterChange={updateRoommateFilter}
                        onClose={() => setShowMobileFilters(false)}
                        isMobile
                      />
                    ) : (
                      <PropertyFiltersPanel
                        filters={subleaseFilters}
                        universities={[]}
                        onFilterChange={updateSubleaseFilter}
                        onClose={() => setShowMobileFilters(false)}
                        isMobile
                      />
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Content Area */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {activeTab === 'roommates' ? (
                  <motion.div
                    key="roommates"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Roommates Content */}
                    <div className="mb-4 text-sm text-gray-600">
                      {filteredMatches.length} compañeros disponibles
                    </div>
                    
                    {isLoadingRoommates ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="bg-gray-200 rounded-2xl h-64"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`grid gap-6 ${
                        roommateViewMode === 'grid'
                          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                          : 'grid-cols-1'
                      }`}>
                        {filteredMatches.map((profile) => (
                          <RoommateCard
                            key={profile.id}
                            profile={profile}
                            viewMode={roommateViewMode}
                            onClick={() => handleProfileCardClick(profile.id)}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="subleases"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Subleases Content */}
                    <div className="mb-4 text-sm text-gray-600">
                      {subleases.length} subarriendos disponibles
                    </div>

                    {subleasesLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="bg-gray-200 rounded-2xl aspect-[4/3]"></div>
                          </div>
                        ))}
                      </div>
                    ) : subleases.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl">
                        <HomeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">
                          No hay subarriendos disponibles
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Intenta ajustar tus filtros o vuelve más tarde
                        </p>
                      </div>
                    ) : (
                      <div className={`grid gap-6 ${
                        subleaseViewMode === 'grid'
                          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                          : subleaseViewMode === 'list'
                          ? 'grid-cols-1'
                          : 'hidden' // Hide grid when in map view
                      }`}>
                        {subleases.map((sublease) => (
                          <SubleaseCard
                            key={sublease.id}
                            sublease={sublease}
                            onSave={handleSaveSublease}
                            variant={subleaseViewMode === 'map' ? 'grid' : subleaseViewMode}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Map view placeholder */}
                    {subleaseViewMode === 'map' && !subleasesLoading && (
                      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">Vista de mapa próximamente</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Modal */}
      {isAuthenticated && user?.userType === "student" && (
        <ProfileCompletionPrompt
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          currentCompletion={profileState.completion}
          requiredCompletion={COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES}
          onStartProfile={() => {
            setShowCompletionModal(false);
            if (!profileState.hasProfile) {
              router.push("/roommates/onboarding");
            } else {
              router.push("/roommates/profile/edit");
            }
          }}
        />
      )}
    </MainLayout>
  );
}