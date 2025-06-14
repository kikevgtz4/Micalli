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
  UserGroupIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ChartBarIcon,
  LockClosedIcon,
  PlusIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

// Constants remain the same...
const PROFILE_FIELDS = [
  "sleepSchedule",
  "cleanliness",
  "noiseTolerance",
  "guestPolicy",
  "studyHabits",
  "major",
  "year",
  "bio",
  "petFriendly",
  "smokingAllowed",
  "hobbies",
  "socialActivities",
  "dietaryRestrictions",
  "languages",
  "preferredRoommateGender",
  "ageRangeMin",
  "ageRangeMax",
  "university",
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
    matches: [],
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

  // Load profile and matches
  const loadProfileAndMatches = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);

      let profileData = null;
      let matchesData = null;
      let hasProfile = false;

      // Try to load profile
      try {
        const profileResponse = await apiService.roommates.getMyProfile();
        profileData = profileResponse.data;
        hasProfile = true;
        console.log(
          "Profile loaded successfully, completion:",
          profileData.profileCompletionPercentage
        );
      } catch (profileError: any) {
        // Check for expected 404 error
        if (
          profileError.response?.status === 404 &&
          profileError.response?.data?.code === "profile_not_found"
        ) {
          // This is expected - user hasn't created a profile yet
          console.log(
            "User has no profile yet - showing create profile prompt"
          );
          hasProfile = false;
        } else {
          // This is an unexpected error
          console.error("Unexpected error loading profile:", profileError);
          throw profileError;
        }
      }

      // Only load matches if profile exists
      if (hasProfile && profileData) {
        try {
          const matchesResponse = await apiService.roommates.findMatches({
            limit: 10,
          });
          matchesData = matchesResponse.data;
          console.log("Matches loaded:", matchesData.matches.length);
        } catch (matchError: any) {
          console.warn("Failed to load matches:", matchError);
          matchesData = { matches: [] };
        }
      }

      // Update state
      setProfileState({
        completion: profileData?.profileCompletionPercentage || 0,
        hasProfile: hasProfile,
        matches: matchesData?.matches || [],
      });
    } catch (error: any) {
      console.error("Critical error in loadProfileAndMatches:", error);

      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        "Failed to load profile data. Please try again.";

      setError(errorMessage);
      toast.error(errorMessage);

      // Set default state on error
      setProfileState({
        completion: 0,
        hasProfile: false,
        matches: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load data on mount/auth change
  useEffect(() => {
    loadProfileAndMatches();
  }, [loadProfileAndMatches]);

  // Handlers
  const handleProfileCardClick = useCallback(
    (profileId: number) => {
      if (!isAuthenticated) {
        router.push("/login?redirect=/roommates");
        return;
      }

      if (profileState.completion < COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES) {
        setShowCompletionModal(true);
        return;
      }

      router.push(`/roommates/profile/${profileId}`);
    },
    [isAuthenticated, profileState.completion, router]
  );

  // Render unauthenticated view
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-accent-100/20" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-xl">
                    <UserGroupIcon className="h-16 w-16 text-white" />
                  </div>
                </div>
                <h1 className="text-5xl font-bold text-stone-900 mb-6 gradient-text">
                  Find Your Perfect Roommate
                </h1>
                <p className="text-xl text-stone-600 mb-8 max-w-2xl mx-auto">
                  Connect with compatible students who share your lifestyle and
                  values. Our smart matching algorithm helps you find the ideal
                  living companion.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push("/signup")}
                    className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Get Started Free
                  </button>
                  <button
                    onClick={() => router.push("/login")}
                    className="px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold border-2 border-primary-200 hover:bg-primary-50 transition-all duration-200"
                  >
                    Sign In
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: SparklesIcon,
                    title: "Smart Matching",
                    description:
                      "Our algorithm analyzes lifestyle preferences to find your ideal roommate",
                  },
                  {
                    icon: ShieldCheckIcon,
                    title: "Verified Profiles",
                    description:
                      "All students are verified through their university credentials",
                  },
                  {
                    icon: AcademicCapIcon,
                    title: "Student-Focused",
                    description:
                      "Designed specifically for university students in Monterrey",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary-100 rounded-xl">
                        <feature.icon className="h-8 w-8 text-primary-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-stone-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-stone-600">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="py-16 bg-gradient-to-b from-stone-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-stone-900 mb-8 text-center">
                Join Our Growing Community
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
                      <RoommateProfileTeaser isBlurred={true} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center pb-6">
                        <div className="text-center">
                          <LockClosedIcon className="h-8 w-8 text-white mx-auto mb-2" />
                          <p className="text-white font-medium">
                            Sign up to view
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
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
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-primary-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <UserGroupIcon className="h-10 w-10" />
                    <h1 className="text-4xl font-bold">Find Your Roommate</h1>
                  </div>
                  <p className="text-xl text-primary-100 max-w-2xl">
                    Discover compatible students who match your lifestyle and
                    preferences
                  </p>
                </div>

                {/* Profile Completion Card */}
                {profileState.hasProfile && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 min-w-[280px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-primary-100">
                        Profile Strength
                      </span>
                      <span className="text-2xl font-bold">
                        {profileState.completion}%
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3 mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${profileState.completion}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-3 rounded-full ${
                          profileState.completion >= 80
                            ? "bg-gradient-to-r from-green-400 to-green-500"
                            : profileState.completion >= 50
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                            : "bg-gradient-to-r from-red-400 to-red-500"
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {profileState.completion >= 80 ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 text-green-300" />
                          <span className="text-sm text-primary-100">
                            Full access unlocked!
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-5 w-5 text-yellow-300" />
                          <span className="text-sm text-primary-100">
                            {80 - profileState.completion}% more for full access
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 mt-6">
                {!profileState.hasProfile ? (
                  <button
                    onClick={() => router.push("/roommates/profile/complete")}
                    className="px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-all flex items-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Create Profile
                  </button>
                ) : profileState.completion < 80 ? (
                  <button
                    onClick={() => router.push("/roommates/profile/complete")}
                    className="px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-all flex items-center gap-2"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                    Complete Profile
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/roommates/profile/edit")}
                    className="px-6 py-3 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-all flex items-center gap-2"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircleIcon className="h-6 w-6 text-red-500" />
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
                <button
                  onClick={loadProfileAndMatches}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          )}

          {/* Matches Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-stone-200 h-80 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : profileState.matches.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <UserGroupIcon className="h-24 w-24 text-stone-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-stone-700 mb-3">
                {profileState.hasProfile
                  ? "No Matches Found"
                  : "Welcome to Roommate Matching!"}
              </h3>
              <p className="text-stone-600 mb-6 max-w-md mx-auto">
                {profileState.hasProfile
                  ? "We couldn't find any matches yet. Check back later or update your preferences."
                  : "Create your profile to start finding compatible roommates who match your lifestyle and preferences."}
              </p>
              <button
                onClick={() =>
                  router.push(
                    profileState.hasProfile
                      ? "/roommates/profile/edit"
                      : "/roommates/profile/complete"
                  )
                }
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                {profileState.hasProfile
                  ? "Update Profile"
                  : "Create Your Profile"}
              </button>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profileState.matches
                  .slice(0, profileLimit)
                  .map((match, index) => {
                    const isLocked =
                      profileState.completion <
                        COMPLETION_THRESHOLDS.VIEW_FULL_PROFILES &&
                      index >= PROFILE_LIMITS.NO_PROFILE;

                    return (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className={`relative ${isLocked ? "opacity-75" : ""}`}
                      >
                        <RoommateProfileTeaser
                          profile={match}
                          isBlurred={isLocked}
                          onClick={() => handleProfileCardClick(match.id)}
                        />

                        {/* Lock overlay */}
                        {isLocked && (
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent rounded-xl flex items-end justify-center pb-8 cursor-pointer backdrop-blur-sm"
                            onClick={() => setShowCompletionModal(true)}
                          >
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-center"
                            >
                              <LockClosedIcon className="h-10 w-10 text-white mx-auto mb-3" />
                              <p className="text-white font-semibold text-lg">
                                Complete profile to unlock
                              </p>
                            </motion.div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>

              {/* View All Button */}
              {profileState.matches.length > profileLimit && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-12 text-center"
                >
                  <button
                    onClick={() => {
                      if (
                        profileState.completion >=
                        COMPLETION_THRESHOLDS.UNLOCK_ALL_FEATURES
                      ) {
                        router.push("/roommates/browse");
                      } else {
                        setShowCompletionModal(true);
                      }
                    }}
                    className={`group px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 mx-auto ${
                      profileState.completion >=
                      COMPLETION_THRESHOLDS.UNLOCK_ALL_FEATURES
                        ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg transform hover:scale-105"
                        : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                    }`}
                  >
                    {profileState.completion >=
                    COMPLETION_THRESHOLDS.UNLOCK_ALL_FEATURES ? (
                      <>
                        Browse All Roommates
                        <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className="h-5 w-5" />
                        Complete Profile to View All (
                        {80 - profileState.completion}% more)
                      </>
                    )}
                  </button>
                </motion.div>
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
