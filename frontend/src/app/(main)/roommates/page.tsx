// frontend/src/app/(main)/roommates/page.tsx
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import RoommateCard from "@/components/roommates/RoommateCard";
import ProfileCompletionPrompt from "@/components/roommates/ProfileCompletionPrompt";
import RoommateFiltersPanel from "@/components/roommates/RoommateFiltersPanel";
import apiService from "@/lib/api";
import { RoommateProfile, RoommateMatch } from "@/types/api";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  Squares2X2Icon,
  Bars3Icon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const COMPLETION_THRESHOLDS = {
  VIEW_FULL_PROFILES: 60,
  UNLOCK_ALL_FEATURES: 80,
} as const;

const SORT_OPTIONS = [
  { value: 'compatibility', label: 'Best Match' },
  { value: 'newest', label: 'Most Recent' },
  { value: 'age_asc', label: 'Age: Low to High' },
  { value: 'age_desc', label: 'Age: High to Low' },
];

export default function RoommatesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // State Management
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState('compatibility');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Profile state
  const [profileState, setProfileState] = useState({
    completion: 0,
    hasProfile: false,
    onboardingCompleted: false,
    matches: [] as (RoommateProfile | RoommateMatch)[],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [sampleProfiles, setSampleProfiles] = useState<RoommateProfile[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 35,
    gender: '',
    major: '',
    lifestyle: [] as string[],
    habits: [] as string[],
    interests: [] as string[],
  });

  const updateFilter = <K extends keyof typeof filters>(
    key: K,
    value: typeof filters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Load profiles
  useEffect(() => {
    const loadProfiles = async () => {
      setIsLoading(true);
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
        setIsLoading(false);
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

  const handleProfileCardClick = useCallback(
    (profileId: number) => {
      if (!isAuthenticated) {
        toast("Please login to view full profiles", {
          icon: "🔒",
        });
        router.push("/login");
        return;
      }

      if (user?.userType !== "student") {
        toast("Only students can view roommate profiles", {
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
      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Find Your Perfect Roommate
                </h1>
                <p className="mt-2 text-gray-600">
                  Connect with compatible students in Monterrey
                </p>
              </div>
              
              {/* Quick Navigation */}
              <div className="mt-4 md:mt-0 flex gap-3">
                <button
                  onClick={() => router.push('/subleases')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <HomeIcon className="w-4 h-4" />
                  Browse Subleases
                </button>
                {isAuthenticated && user?.userType === 'student' && (
                  <button
                    onClick={() => {
                      if (profileState.hasProfile) {
                        router.push('/roommates/profile/edit');
                      } else {
                        router.push('/roommates/onboarding');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    {profileState.hasProfile ? 'Edit Profile' : 'Create Profile'}
                  </button>
                )}
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
                  placeholder="Search by name, major, or interests..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Controls */}
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
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Filters</span>
                </button>

                {/* View Mode Toggle */}
                <div className="flex bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-l-lg ${
                      viewMode === 'grid'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-r-lg ${
                      viewMode === 'list'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Bars3Icon className="w-5 h-5" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* Desktop Filters Sidebar */}
            {showFilters && (
              <div className="hidden lg:block w-80 flex-shrink-0">
                <div className="sticky top-28">
                  <RoommateFiltersPanel
                    filters={filters}
                    onFilterChange={updateFilter}
                    onClose={() => setShowFilters(false)}
                  />
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
                    <RoommateFiltersPanel
                      filters={filters}
                      onFilterChange={updateFilter}
                      onClose={() => setShowMobileFilters(false)}
                      isMobile
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Content Area */}
            <div className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {filteredMatches.length} roommates available
                </p>
                {profileState.hasProfile && (
                  <p className="text-sm text-primary-600 font-medium">
                    Profile {profileState.completion}% complete
                  </p>
                )}
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-2xl h-64"></div>
                    </div>
                  ))}
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">
                    No roommates found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your filters or search criteria
                  </p>
                </div>
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  {filteredMatches.map((profile) => (
                    <RoommateCard
                      key={profile.id}
                      profile={profile}
                      viewMode={viewMode}
                      onClick={() => handleProfileCardClick(profile.id)}
                    />
                  ))}
                </div>
              )}
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