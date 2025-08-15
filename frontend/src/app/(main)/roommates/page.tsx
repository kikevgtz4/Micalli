// frontend/src/app/(main)/roommates/page.tsx
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import RoommateCard from "@/components/roommates/RoommateCard";
import ProfileCompletionPrompt from "@/components/roommates/ProfileCompletionPrompt";
import SubleaseCard from "@/components/subleases/SubleaseCard";
import SubleaseFilters from "@/components/subleases/SubleaseFilters";
import { Tab } from "@headlessui/react";
import apiService from "@/lib/api";
import { RoommateProfile, RoommateMatch } from "@/types/api";
import { OnboardingStatusResponse } from "@/types/roommates";
import {
  useSubleases,
  useSubleaseFilters,
} from "@/hooks/subleases/useSubleases";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  HomeIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const COMPLETION_THRESHOLDS = {
  VIEW_FULL_PROFILES: 60,
  UNLOCK_ALL_FEATURES: 80,
} as const;

export default function RoommatesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // ========== State Management ==========
  const [selectedTab, setSelectedTab] = useState(0); // Track active tab
  const [profileState, setProfileState] = useState({
    completion: 0,
    hasProfile: false,
    onboardingCompleted: false,
    matches: [] as (RoommateProfile | RoommateMatch)[],
  });

  const [isLoadingRoommates, setIsLoadingRoommates] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sampleProfiles, setSampleProfiles] = useState<RoommateProfile[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // ========== Sublease Hooks ==========
  const {
    filters: subleaseFilters,
    updateFilter: updateSubleaseFilter,
    clearFilters: clearSubleaseFilters,
  } = useSubleaseFilters();

  const {
    subleases,
    isLoading: subleasesLoading,
    error: subleasesError,
  } = useSubleases({
    filters: subleaseFilters,
    autoFetch: true,
  });

  // ========== Load Profiles ==========
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

  // ========== Handlers ==========
  const handleSaveSublease = async (id: number) => {
    if (!isAuthenticated) {
      toast("Sign in to save subleases", {
        icon: "🔒",
        style: {
          background: "#FEF2F2",
          color: "#991B1B",
        },
      });
      router.push("/login");
      return false;
    }

    try {
      const response = await apiService.subleases.toggleSave(id);
      toast.success(
        response.data.isSaved ? "Sublease saved!" : "Removed from saved",
        {
          style: {
            background: "#458468",
            color: "#FFFFFF",
          },
        }
      );
      return response.data.isSaved;
    } catch (error) {
      console.error("Failed to save sublease:", error);
      toast.error("Failed to save sublease");
      return false;
    }
  };

  const handleProfileCardClick = useCallback(
    (profileId: number) => {
      if (!isAuthenticated) {
        toast("Sign in to view full profiles and send messages", {
          icon: "🔒",
          style: {
            background: "#EFF6FF",
            color: "#1E40AF",
          },
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
    [
      isAuthenticated,
      user,
      profileState.hasProfile,
      profileState.completion,
      router,
    ]
  );

  // ========== Filter Matches ==========
  const filteredMatches = useMemo(() => {
    const profilesToFilter =
      profileState.hasProfile && profileState.matches.length > 0
        ? profileState.matches
        : sampleProfiles;

    // Filter out any invalid profiles
    const validProfiles = profilesToFilter.filter(profile => 
      profile && 
      profile.id && 
      profile.user && 
      (profile.user.id || profile.id)
    );

    if (!searchQuery) return profilesToFilter;

    const searchLower = searchQuery.toLowerCase();
    return validProfiles.filter(
      (match) =>
        match.user?.firstName?.toLowerCase().includes(searchLower) ||
        match.user?.lastName?.toLowerCase().includes(searchLower) ||
        match.major?.toLowerCase().includes(searchLower) ||
        match.bio?.toLowerCase().includes(searchLower)
    );
  }, [
    profileState.matches,
    profileState.hasProfile,
    sampleProfiles,
    searchQuery,
  ]);

  // ========== Render Component ==========
  return (
    <MainLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Student Housing & Roommates
            </h1>
            <p className="text-gray-600">
              {isAuthenticated
                ? "Find compatible roommates and sublease opportunities"
                : "Browse roommates and sublease opportunities in Monterrey"}
            </p>
          </motion.div>

          {/* Tabs Container */}
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex space-x-1 rounded-xl bg-primary/20 p-1 mb-8">
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200
                  ${
                    selected
                      ? "bg-white text-primary shadow-sm"
                      : "text-cream-100 hover:bg-white/[0.12] hover:text-white"
                  }`
                }
              >
                <span className="flex items-center justify-center gap-2">
                  <UserGroupIcon className="w-4 h-4" />
                  Find Roommates
                </span>
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200
                  ${
                    selected
                      ? "bg-white text-primary shadow-sm"
                      : "text-cream-100 hover:bg-white/[0.12] hover:text-white"
                  }`
                }
              >
                <span className="flex items-center justify-center gap-2">
                  <HomeIcon className="w-4 h-4" />
                  Sublease Opportunities
                </span>
              </Tab>
            </Tab.List>

            <AnimatePresence mode="wait">
              <Tab.Panels>
                {/* ========== Roommates Tab ========== */}
                <Tab.Panel>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Search and Action Bar */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name, major, or interests..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="flex gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                          <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded transition-all ${
                              viewMode === "grid"
                                ? "bg-primary text-white"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            <Squares2X2Icon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded transition-all ${
                              viewMode === "list"
                                ? "bg-primary text-white"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            <ListBulletIcon className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Profile Actions */}
                        {isAuthenticated && user?.userType === "student" && (
                          <>
                            {profileState.hasProfile ? (
                              <button
                                onClick={() =>
                                  router.push("/roommates/profile/edit")
                                }
                                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
                              >
                                Edit Profile
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  router.push("/roommates/onboarding")
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
                              >
                                <PlusIcon className="w-5 h-5" />
                                Create Profile
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Info Banner for Guests */}
                    {!isAuthenticated && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4"
                      >
                        <p className="text-blue-900 font-medium">
                          Sign in to get personalized matches and connect with
                          roommates
                        </p>
                        <div className="mt-2 flex gap-3">
                          <button
                            onClick={() => router.push("/login")}
                            className="text-sm text-blue-700 hover:text-blue-800 font-medium underline"
                          >
                            Sign In
                          </button>
                          <button
                            onClick={() => router.push("/signup")}
                            className="text-sm text-blue-700 hover:text-blue-800 font-medium underline"
                          >
                            Create Account
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Roommate Profiles Grid */}
                    {isLoadingRoommates ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="bg-gray-200 rounded-2xl h-64"></div>
                            <div className="mt-4 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredMatches.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-2xl">
                        <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No roommates found
                        </h3>
                        <p className="text-gray-600">
                          {searchQuery
                            ? "Try adjusting your search terms"
                            : "Check back later for new profiles"}
                        </p>
                      </div>
                    ) : (
                      <>
                        {profileState.hasProfile && (
                          <div className="mb-4 text-sm text-gray-600">
                            Showing {filteredMatches.length}{" "}
                            {profileState.hasProfile ? "matched" : "available"}{" "}
                            roommate{filteredMatches.length !== 1 ? "s" : ""}
                          </div>
                        )}
                        <div
                          className={`grid gap-6 ${
                            viewMode === "grid"
                              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                              : "grid-cols-1"
                          }`}
                        >
                          {filteredMatches
                            .filter(
                              (profile) => profile && profile.id && profile.user
                            ) // Add safety filter
                            .map((profile) => (
                              <motion.div
                                key={profile.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <RoommateCard
                                  profile={profile}
                                  viewMode={viewMode}
                                  onClick={() =>
                                    handleProfileCardClick(profile.id)
                                  }
                                />
                              </motion.div>
                            ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                </Tab.Panel>

                {/* ========== Subleases Tab ========== */}
                <Tab.Panel>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Mobile Filter Button */}
                      <button
                        onClick={() => setShowMobileFilters(true)}
                        className="lg:hidden flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <FunnelIcon className="w-5 h-5" />
                        Filters
                      </button>

                      {/* Filters Sidebar - Desktop */}
                      <div className="hidden lg:block lg:w-80">
                        <div className="sticky top-4">
                          <SubleaseFilters
                            filters={subleaseFilters}
                            onFilterChange={updateSubleaseFilter}
                            onClearFilters={clearSubleaseFilters}
                            className="bg-white rounded-xl border border-gray-200"
                          />
                        </div>
                      </div>

                      {/* Mobile Filters Drawer */}
                      <AnimatePresence>
                        {showMobileFilters && (
                          <>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="lg:hidden fixed inset-0 bg-black/50 z-40"
                              onClick={() => setShowMobileFilters(false)}
                            />
                            <motion.div
                              initial={{ x: "-100%" }}
                              animate={{ x: 0 }}
                              exit={{ x: "-100%" }}
                              transition={{ type: "tween" }}
                              className="lg:hidden fixed left-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto"
                            >
                              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">
                                  Filters
                                </h3>
                                <button
                                  onClick={() => setShowMobileFilters(false)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <XMarkIcon className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="p-4">
                                <SubleaseFilters
                                  filters={subleaseFilters}
                                  onFilterChange={updateSubleaseFilter}
                                  onClearFilters={clearSubleaseFilters}
                                />
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>

                      {/* Sublease Grid */}
                      <div className="flex-1">
                        {/* Header */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-bold text-gray-900">
                              Available Subleases
                            </h2>
                            {isAuthenticated &&
                              user?.userType === "student" && (
                                <button
                                  onClick={() =>
                                    router.push("/subleases/create")
                                  }
                                  className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-600 transition-colors shadow-sm"
                                >
                                  <PlusIcon className="w-5 h-5" />
                                  List Your Space
                                </button>
                              )}
                          </div>
                          <p className="text-gray-600">
                            Find short-term housing opportunities from students
                          </p>

                          {!isAuthenticated && (
                            <p className="text-sm text-blue-600 mt-2">
                              <button
                                onClick={() => router.push("/login")}
                                className="hover:underline"
                              >
                                Sign in
                              </button>{" "}
                              to save listings and contact owners
                            </p>
                          )}
                        </div>

                        {/* Loading State */}
                        {subleasesLoading && (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                              <div key={i} className="animate-pulse">
                                <div className="bg-gray-200 rounded-2xl aspect-[4/3]"></div>
                                <div className="mt-4 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Error State */}
                        {subleasesError && !subleasesLoading && (
                          <div className="text-center py-12 bg-white rounded-2xl">
                            <p className="text-red-600 mb-4">
                              {subleasesError}
                            </p>
                            <button
                              onClick={() => window.location.reload()}
                              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
                            >
                              Try Again
                            </button>
                          </div>
                        )}

                        {/* Results */}
                        {!subleasesLoading && !subleasesError && (
                          <>
                            {subleases.length === 0 ? (
                              <div className="text-center py-12 bg-white rounded-2xl">
                                <HomeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">
                                  No subleases found
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  Try adjusting your filters or check back later
                                  for new listings.
                                </p>
                                {isAuthenticated &&
                                  user?.userType === "student" && (
                                    <button
                                      onClick={() =>
                                        router.push("/subleases/create")
                                      }
                                      className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
                                    >
                                      Be the first to list
                                    </button>
                                  )}
                              </div>
                            ) : (
                              <>
                                <div className="mb-4 text-sm text-gray-600">
                                  Found {subleases.length} sublease
                                  {subleases.length !== 1 ? "s" : ""}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                  {subleases.map((sublease) => (
                                    <motion.div
                                      key={sublease.id}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <SubleaseCard
                                        sublease={sublease}
                                        onSave={handleSaveSublease}
                                      />
                                    </motion.div>
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </Tab.Panel>
              </Tab.Panels>
            </AnimatePresence>
          </Tab.Group>
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
