"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import RoommateCard from "@/components/roommates/RoommateCard";
import ProfileCompletionPrompt from "@/components/roommates/ProfileCompletionPrompt";
import OnboardingCheck from "@/components/roommates/OnboardingCheck";
import apiService from "@/lib/api";
import { RoommateProfile, RoommateMatch } from "@/types/api";
import { OnboardingStatusResponse } from "@/types/roommates";
import {
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowRightIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const COMPLETION_THRESHOLDS = {
  VIEW_FULL_PROFILES: 60,
  UNLOCK_ALL_FEATURES: 80,
} as const;

export default function RoommatesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [profileState, setProfileState] = useState({
    completion: 0,
    hasProfile: false,
    onboardingCompleted: false,
    matches: [] as (RoommateProfile | RoommateMatch)[],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatusResponse | null>(null);
  const [sampleProfiles, setSampleProfiles] = useState<RoommateProfile[]>([]);
  // NEW: Track if user has seen/dismissed the onboarding prompt
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);
  const [hasSkippedOnboarding, setHasSkippedOnboarding] = useState(false);

  // Check onboarding status first
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated || user?.userType !== 'student') return;
      
      try {
        const response = await apiService.roommates.getOnboardingStatus();
        setOnboardingStatus(response.data);
        
        // Check if they've dismissed the modal before (stored in localStorage)
        const hasSkipped = localStorage.getItem('roommate_onboarding_skipped') === 'true';
        setHasSkippedOnboarding(hasSkipped);
        
        if (!response.data.onboardingCompleted && !response.data.hasProfile) {
          // Only show modal if they haven't skipped before
          setShowOnboardingPrompt(!hasSkipped);
          // Load sample profiles for preview
          await loadSampleProfiles();
        } else {
          // Load actual profile and matches
          await loadProfileAndMatches();
        }
      } catch (error) {
        console.error('Failed to check onboarding:', error);
        setIsLoading(false);
      }
    };
    
    checkOnboarding();
  }, [isAuthenticated, user]);

  // Handle skip action
  const handleSkipOnboarding = () => {
    localStorage.setItem('roommate_onboarding_skipped', 'true');
    setHasSkippedOnboarding(true);
    setShowOnboardingPrompt(false);
  };

  // Handle start onboarding
  const handleStartOnboarding = () => {
    router.push('/roommates/onboarding');
  };

  // Load sample profiles regardless of onboarding status
  const loadSampleProfiles = async () => {
    try {
      // Load more profiles (10-12 instead of 6)
      const response = await apiService.roommates.getPublicProfiles({ limit: 12 });
      setSampleProfiles(response.data || []);
    } catch (error) {
      console.error('Failed to load sample profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfileAndMatches = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load profile and matches in parallel
      const [profileResult, matchesResult] = await Promise.allSettled([
        apiService.roommates.getMyProfile(),
        apiService.roommates.findMatches({ limit: 20 })
      ]);

      let completion = 0;
      let hasProfile = false;
      
      if (profileResult.status === 'fulfilled') {
        const profile = profileResult.value.data;
        completion = profile.profileCompletionPercentage || 0;
        hasProfile = true;
      }

      let matches: (RoommateProfile | RoommateMatch)[] = [];
      if (matchesResult.status === 'fulfilled') {
        matches = matchesResult.value.data.matches || [];
      }

      setProfileState({
        completion,
        hasProfile,
        onboardingCompleted: onboardingStatus?.onboardingCompleted || false,
        matches
      });
      
    } catch (error) {
      console.error("Profile loading error:", error);
      toast.error("Failed to load profiles");
    } finally {
      setIsLoading(false);
    }
  }, [onboardingStatus]);

  // Filter matches based on search and filters
  const filteredMatches = useMemo(() => {
    let filtered = [...profileState.matches];

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(match => 
        match.user.firstName?.toLowerCase().includes(searchLower) ||
        match.user.lastName?.toLowerCase().includes(searchLower) ||
        match.major?.toLowerCase().includes(searchLower) ||
        match.bio?.toLowerCase().includes(searchLower)
      );
    }

    // Apply other filters
    if (selectedFilter !== "all") {
      // Add filter logic based on your needs
    }

    return filtered;
  }, [profileState.matches, selectedFilter, searchQuery]);

  const handleProfileCardClick = useCallback((profileId: number) => {
    if (!profileState.hasProfile) {
      setShowCompletionModal(true);
      return;
    }
    
    if (profileState.completion < COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES) {
      setShowCompletionModal(true);
      return;
    }
    
    router.push(`/roommates/profile/${profileId}`);
  }, [profileState.hasProfile, profileState.completion, router]);

  // Non-authenticated view
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 pt-12">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-8">
                  <UserGroupIcon className="w-10 h-10 text-primary-600" />
                </div>
                
                <h1 className="text-5xl font-bold text-stone-900 mb-6">
                  Find Your Perfect Roommate Match
                </h1>
                <p className="text-xl text-stone-600 mb-10 max-w-2xl mx-auto">
                  Our smart matching algorithm connects you with compatible students based on 
                  lifestyle, study habits, and personal preferences.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/signup')}
                    className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                  >
                    Get Started - It's Free
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-8 py-4 bg-white text-stone-700 rounded-xl font-semibold border-2 border-stone-200 hover:border-primary-300 transition-all"
                  >
                    Sign In
                  </button>
                </div>
              </motion.div>

              {/* Feature highlights */}
              <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <SparklesIcon className="w-8 h-8 text-primary-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-stone-900 mb-2">60-Second Setup</h3>
                  <p className="text-stone-600 text-sm">
                    Quick onboarding focused on what really matters for roommate compatibility
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <ChartBarIcon className="w-8 h-8 text-primary-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-stone-900 mb-2">Smart Matching</h3>
                  <p className="text-stone-600 text-sm">
                    Research-based algorithm focusing on the 5 core compatibility factors
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <ShieldCheckIcon className="w-8 h-8 text-primary-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-stone-900 mb-2">Verified Students</h3>
                  <p className="text-stone-600 text-sm">
                    Connect with real students from universities in Monterrey
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    );
  }

  // Show preview for users without profiles
  if (!profileState.hasProfile && (showOnboardingPrompt || hasSkippedOnboarding)) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-primary-50/20 pt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Banner - only show if they've skipped the modal */}
            {hasSkippedOnboarding && !showOnboardingPrompt && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-8 rounded-2xl mb-8 shadow-xl"
              >
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="text-center lg:text-left">
                    <h1 className="text-3xl font-bold mb-2">Find Your Perfect Roommate Match!</h1>
                    <p className="text-xl opacity-90">Complete your profile to unlock all matches and connect with students</p>
                  </div>
                  <button 
                    onClick={handleStartOnboarding}
                    className="bg-white text-primary-600 px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    Complete Profile →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Section header */}
            {hasSkippedOnboarding && !showOnboardingPrompt && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-stone-900 mb-2">
                  Students Looking for Roommates
                </h2>
                <p className="text-stone-600">
                  Complete your profile to see all {sampleProfiles.length}+ matches and connect with them
                </p>
              </div>
            )}

            {/* Profile grid with selective blur */}
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sampleProfiles.length > 0 ? (
                  sampleProfiles.map((profile, index) => {
                    // Show first 3-4 profiles clearly, blur the rest
                    const shouldBlur = hasSkippedOnboarding && !showOnboardingPrompt ? index >= 3 : showOnboardingPrompt;
                    
                    return (
                      <div key={profile.id} className="relative">
                        <div className={shouldBlur ? 'filter blur-[2px]' : ''}>
                          <RoommateCard 
                            profile={profile} 
                            viewMode="grid"
                            onClick={() => {
                              if (shouldBlur || !profileState.hasProfile) {
                                setShowOnboardingPrompt(true);
                              }
                            }}
                          />
                        </div>
                        
                        {/* Lock icon overlay for blurred cards */}
                        {shouldBlur && hasSkippedOnboarding && !showOnboardingPrompt && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/80 rounded-full p-3">
                              <LockClosedIcon className="w-6 h-6 text-stone-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Loading placeholders
                  Array.from({ length: 9 }).map((_, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
                      <div className="h-32 bg-stone-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-stone-200 rounded mb-2"></div>
                      <div className="h-4 bg-stone-200 rounded w-2/3"></div>
                    </div>
                  ))
                )}
              </div>

              {/* "View More" section at the bottom if they've skipped */}
              {hasSkippedOnboarding && !showOnboardingPrompt && sampleProfiles.length > 6 && (
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center justify-center space-x-2 text-stone-600">
                    <LockClosedIcon className="w-5 h-5" />
                    <span className="text-lg font-medium">
                      {sampleProfiles.length - 3}+ more profiles available
                    </span>
                  </div>
                  <p className="text-stone-500 mt-2">
                    Complete your profile to unlock all matches
                  </p>
                  <button
                    onClick={handleStartOnboarding}
                    className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Unlock All Profiles
                  </button>
                </div>
              )}

              {/* Modal overlay - only when showOnboardingPrompt is true */}
              {showOnboardingPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                      <UserGroupIcon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Create Your Roommate Profile</h3>
                    <p className="text-stone-600 mb-6">
                      Answer 5 quick questions about your lifestyle to connect with compatible roommates
                    </p>
                    
                    <div className="space-y-3">
                      <button
                        onClick={handleStartOnboarding}
                        className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                      >
                        Get Started - 60 seconds
                      </button>
                      
                      <button
                        onClick={handleSkipOnboarding}
                        className="w-full bg-stone-100 text-stone-600 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
                      >
                        Browse First
                      </button>
                    </div>
                    
                    <p className="text-sm text-stone-500 mt-4">
                      100% free • No credit card required
                    </p>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Main authenticated view with profile
  return (
    <MainLayout>
      <div className="min-h-screen bg-white pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="bg-gradient-to-r from-primary-500 to-secondary-300 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Find Your Perfect Roommate
                  </h1>
                  <p className="text-stone-100">
                    {profileState.hasProfile 
                      ? `${profileState.matches.length} compatible matches found`
                      : 'Complete your profile to see matches'}
                  </p>
                </div>
                
                {!profileState.hasProfile && (
                  <button
                    onClick={() => router.push('/roommates/onboarding')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Create Profile
                  </button>
                )}
                
                {profileState.hasProfile && profileState.completion < 100 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {profileState.completion}% Complete
                    </div>
                    <button
                      onClick={() => router.push('/roommates/profile/edit')}
                      className="text-sm text-white hover:text-primary-700 font-medium"
                    >
                      Complete Profile →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          {profileState.hasProfile && (
            <div className="mb-8 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by name, major, or interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="px-4 py-3 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-gray-400"
                >
                  {viewMode === 'grid' ? 'List View' : 'Grid View'}
                </button>
                
                <button className="flex items-center gap-2 px-4 py-3 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-gray-400">
                  <FunnelIcon className="w-5 h-5" />
                  Filters
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            {!profileState.hasProfile ? (
              // No profile state
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-100 rounded-full mb-6">
                  <UserGroupIcon className="w-12 h-12 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4">
                  Create Your Roommate Profile
                </h2>
                <p className="text-stone-600 mb-8 max-w-md mx-auto">
                  Tell us about yourself in just 60 seconds to get matched with compatible roommates
                </p>
                <button
                  onClick={() => router.push("/roommates/onboarding")}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Start Quick Setup
                </button>
              </div>
            ) : filteredMatches.length === 0 ? (
              // No matches state
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-stone-100 rounded-full mb-6">
                  <MagnifyingGlassIcon className="w-12 h-12 text-stone-400" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-4">
                  No Matches Found
                </h2>
                <p className="text-stone-600 mb-8">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Check back later or update your preferences"}
                </p>
                <button
                  onClick={() => router.push("/roommates/profile/edit")}
                  className="px-6 py-3 bg-primary-50 text-primary-700 rounded-lg font-semibold hover:bg-primary-100 transition-colors"
                >
                  Update Preferences
                </button>
              </div>
            ) : (
              // Matches grid
              <div className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}>
                {filteredMatches.map((match) => (
                  <RoommateCard
                    key={match.id}
                    profile={match}
                    viewMode={viewMode}
                    onClick={() => handleProfileCardClick(match.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Completion Modal */}
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
    </MainLayout>
  );
}