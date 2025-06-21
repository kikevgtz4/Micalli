// frontend/src/app/(main)/roommates/page.tsx
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
  VIEW_FULL_PROFILES: 60, // Updated to match core 5 completion
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

  // Check onboarding status first
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isAuthenticated || user?.userType !== 'student') return;
      
      try {
        const response = await apiService.roommates.getOnboardingStatus();
        setOnboardingStatus(response.data);
        
        // If not onboarded, redirect to onboarding
        if (!response.data.onboardingCompleted && !response.data.hasProfile) {
          router.push('/roommates/onboarding');
          return;
        }
        
        // Otherwise load profile and matches
        await loadProfileAndMatches();
      } catch (error) {
        console.error('Failed to check onboarding:', error);
        setIsLoading(false);
      }
    };
    
    checkOnboarding();
  }, [isAuthenticated, user]);

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
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 pt-20">
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

  // Main authenticated view
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-primary-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-stone-900 mb-2">
                    Find Your Perfect Roommate
                  </h1>
                  <p className="text-stone-600">
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
                    <div className="text-2xl font-bold text-primary-600 mb-1">
                      {profileState.completion}% Complete
                    </div>
                    <button
                      onClick={() => router.push('/roommates/profile/edit')}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
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
                  className="px-4 py-3 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  {viewMode === 'grid' ? 'List View' : 'Grid View'}
                </button>
                
                <button className="flex items-center gap-2 px-4 py-3 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors">
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