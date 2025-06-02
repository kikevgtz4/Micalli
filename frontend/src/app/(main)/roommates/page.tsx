// frontend/src/app/(main)/roommates/page.tsx

"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import RoommateProfileTeaser from "@/components/roommates/RoommateProfileTeaser";
import ProfileCompletionPrompt from "@/components/roommates/ProfileCompletionPrompt";
import apiService from "@/lib/api";
import { RoommateProfile, RoommateMatch } from "@/types/api";
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

// Constants
const PROFILE_FIELDS = [
  'sleepSchedule',
  'cleanliness',
  'noiseTolerance',
  'guestPolicy',
  'studyHabits',
  'major',
  'year',
  'bio',
  'petFriendly',
  'smokingAllowed',
  'hobbies',
  'socialActivities',
  'dietaryRestrictions',
  'languages',
  'preferredRoommateGender',
  'ageRangeMin',
  'ageRangeMax',
  'university'
] as const;

const COMPLETION_THRESHOLDS = {
  VIEW_FULL_PROFILES: 50,
  UNLOCK_ALL_FEATURES: 80,
} as const;

const PROFILE_LIMITS = {
  NO_PROFILE: 3,
  INCOMPLETE: 6,
  PARTIAL: 9,
} as const;

interface ProfileState {
  completion: number;
  hasProfile: boolean;
  matches: (RoommateProfile | RoommateMatch)[];
}

export default function RoommatesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Combined state for better performance
  const [profileState, setProfileState] = useState<ProfileState>({
    completion: 0,
    hasProfile: false,
    matches: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized calculations
  const profileLimit = useMemo(() => {
    if (profileState.completion < COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES) {
      return PROFILE_LIMITS.INCOMPLETE;
    }
    return PROFILE_LIMITS.PARTIAL;
  }, [profileState.completion]);

  const completionStatus = useMemo(() => {
    if (profileState.completion === 0) {
      return {
        type: 'error' as const,
        message: "Create your profile to start matching with roommates",
        icon: ExclamationCircleIcon,
        colorClass: "bg-red-50 border-red-200",
        textClass: "text-red-800",
        iconClass: "text-red-600",
        action: "Create Profile"
      };
    }
    if (profileState.completion < COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES) {
      return {
        type: 'warning' as const,
        message: "Complete at least 50% of your profile to view full profiles",
        icon: ExclamationTriangleIcon,
        colorClass: "bg-yellow-50 border-yellow-200",
        textClass: "text-yellow-800",
        iconClass: "text-yellow-600",
        action: "Complete Profile"
      };
    }
    if (profileState.completion < COMPLETION_THRESHOLDS.UNLOCK_ALL_FEATURES) {
      return {
        type: 'info' as const,
        message: "Complete 80% of your profile to unlock all features",
        icon: InformationCircleIcon,
        colorClass: "bg-blue-50 border-blue-200",
        textClass: "text-blue-800",
        iconClass: "text-blue-600",
        action: "Complete Profile"
      };
    }
    return null;
  }, [profileState.completion]);

  // Optimized profile completion calculation
  const calculateProfileCompletion = useCallback((profile: RoommateProfile): number => {
    const completed = PROFILE_FIELDS.filter((field) => {
      const value = profile[field as keyof RoommateProfile];
      
      // Handle boolean fields
      if (field === 'petFriendly' || field === 'smokingAllowed') {
        return value !== null && value !== undefined;
      }
      
      // Handle array fields
      if (Array.isArray(value)) {
        // dietaryRestrictions can be empty array
        if (field === 'dietaryRestrictions') {
          return value !== null && value !== undefined;
        }
        return value.length > 0;
      }
      
      // Handle string fields
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      
      // Handle other types
      return value !== null && value !== undefined;
    }).length;

    return Math.round((completed / PROFILE_FIELDS.length) * 100);
  }, []);

  // Load profile and matches
  const loadProfileAndMatches = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Use Promise.allSettled for parallel fetching
      const [profileResult, matchesResult] = await Promise.allSettled([
        apiService.roommates.getMyProfile(),
        apiService.roommates.findMatches({ limit: 10 })
      ]);

      // Handle profile result
      let completion = 0;
      let hasProfile = false;
      
      if (profileResult.status === 'fulfilled') {
        const profile = profileResult.value.data;
        completion = profile.profileCompletionPercentage || calculateProfileCompletion(profile);
        hasProfile = true;
      } else if (profileResult.reason?.response?.status === 404) {
        // No profile exists yet
        hasProfile = false;
      } else {
        // Other error
        throw new Error('Failed to load profile');
      }

      // Handle matches result
      let matches: (RoommateProfile | RoommateMatch)[] = [];
      
      if (matchesResult.status === 'fulfilled') {
        matches = matchesResult.value.data.matches || [];
      } else if (!hasProfile || completion < COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES) {
        // Try to load public profiles as fallback
        try {
          const publicResponse = await apiService.roommates.getPublicProfiles({ 
            limit: PROFILE_LIMITS.NO_PROFILE 
          });
          matches = publicResponse.data;
        } catch {
          // If public profiles also fail, just show empty
          matches = [];
        }
      }

      // Update state in one go
      setProfileState({
        completion,
        hasProfile,
        matches
      });
      
    } catch (error) {
      console.error("Profile loading error:", error);
      setError("Failed to load profiles. Please try again later.");
      toast.error("Failed to load profiles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, calculateProfileCompletion]);

  // Load data on mount/auth change
  useEffect(() => {
    loadProfileAndMatches();
  }, [loadProfileAndMatches]);

  // Handlers
  const handleProfileCardClick = useCallback((profileId: number) => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/roommates");
      return;
    }

    if (profileState.completion < COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES) {
      setShowCompletionModal(true);
      return;
    }

    router.push(`/roommates/profile/${profileId}`);
  }, [isAuthenticated, profileState.completion, router]);

  const handleViewAllClick = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/roommates");
      return;
    }

    if (profileState.completion < COMPLETION_THRESHOLDS.UNLOCK_ALL_FEATURES) {
      setShowCompletionModal(true);
      return;
    }

    router.push("/roommates/browse");
  }, [isAuthenticated, profileState.completion, router]);

  const handleRetry = useCallback(() => {
    loadProfileAndMatches();
  }, [loadProfileAndMatches]);

  // Render unauthenticated view
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-stone-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-stone-900 mb-4">
                Find Your Perfect Roommate
              </h1>
              <p className="text-xl text-stone-600 mb-8">
                Join our community to connect with compatible roommates
              </p>
              <button
                onClick={() => router.push("/signup")}
                className="px-8 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Preview profiles */}
            <div className="mt-16">
              <h2 className="text-2xl font-semibold text-stone-900 mb-6 text-center">
                Preview Our Community
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative">
                    <RoommateProfileTeaser isBlurred={true} />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <p className="text-white font-medium">Sign up to view</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Main authenticated view
  return (
    <MainLayout>
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-stone-900">
                  Find Your Perfect Roommate
                </h1>
                <p className="text-xl text-stone-600 mt-2">
                  Connect with compatible students in your area
                </p>
              </div>

              {/* Profile Completion Indicator */}
              {profileState.hasProfile && (
                <div className="text-right">
                  <p className="text-sm text-stone-600 mb-1">
                    Profile Completion
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-stone-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          profileState.completion >= COMPLETION_THRESHOLDS.UNLOCK_ALL_FEATURES
                            ? "bg-green-500"
                            : profileState.completion >= COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${profileState.completion}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {profileState.completion}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Completion Status Banner */}
            {completionStatus && (
              <div
                className={`mt-6 p-4 rounded-lg flex items-center justify-between border ${completionStatus.colorClass}`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <completionStatus.icon className={`h-6 w-6 ${completionStatus.iconClass}`} />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${completionStatus.textClass}`}>
                      {completionStatus.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/roommates/profile/complete")}
                  className="ml-4 px-4 py-2 bg-white rounded-md text-sm font-medium text-primary-600 hover:bg-stone-50 border border-stone-200"
                >
                  {completionStatus.action}
                </button>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={handleRetry}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Matches Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-stone-200 h-64 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profileState.matches
                  .slice(0, profileLimit)
                  .map((match, index) => {
                    const isLocked = profileState.completion < COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES && 
                                   index >= PROFILE_LIMITS.NO_PROFILE;
                    
                    return (
                      <div
                        key={match.id}
                        className={`relative ${isLocked ? "opacity-60" : ""}`}
                      >
                        <RoommateProfileTeaser
                          profile={match}
                          isBlurred={isLocked}
                          onClick={() => handleProfileCardClick(match.id)}
                        />

                        {/* Lock overlay */}
                        {isLocked && (
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg flex items-end justify-center pb-6 cursor-pointer"
                            onClick={() => setShowCompletionModal(true)}
                          >
                            <div className="text-center">
                              <LockClosedIcon className="h-8 w-8 text-white mx-auto mb-2" />
                              <p className="text-white font-medium">
                                Complete profile to unlock
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* View All Button */}
              {profileState.matches.length > 0 && (
                <div className="mt-12 text-center">
                  <button
                    onClick={handleViewAllClick}
                    className={`px-8 py-3 rounded-lg font-medium transition-all ${
                      profileState.completion >= COMPLETION_THRESHOLDS.UNLOCK_ALL_FEATURES
                        ? "bg-primary-500 text-white hover:bg-primary-600"
                        : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                    }`}
                  >
                    {profileState.completion >= COMPLETION_THRESHOLDS.UNLOCK_ALL_FEATURES
                      ? "Browse All Roommates"
                      : `Complete Profile to View All (${
                          COMPLETION_THRESHOLDS.UNLOCK_ALL_FEATURES - profileState.completion
                        }% more needed)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Profile Completion Modal */}
      <ProfileCompletionPrompt
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        currentCompletion={profileState.completion}
        requiredCompletion={
          profileState.completion < COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES
            ? COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES
            : COMPLETION_THRESHOLDS.UNLOCK_ALL_FEATURES
        }
        onStartProfile={() => router.push("/roommates/profile/complete")}
      />
    </MainLayout>
  );
}