// frontend/src/app/(main)/roommates/page.tsx

"use client";
import { useState, useEffect } from "react";
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

export default function RoommatesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [topMatches, setTopMatches] = useState<
    (RoommateProfile | RoommateMatch)[]
  >([]);

  useEffect(() => {
    if (isAuthenticated) {
      checkProfileAndLoadMatches();
    }
  }, [isAuthenticated]);

  const checkProfileAndLoadMatches = async () => {
    try {
      setIsLoading(true);

      // Try to get user's profile
      const profileResponse = await apiService.roommates.getMyProfile();
      const profile = profileResponse.data;

      // Calculate completion percentage
      const completion = calculateProfileCompletion(profile);
      setProfileCompletion(completion);
      setHasProfile(true);

      // Load limited matches regardless of completion
      const matchesResponse = await apiService.roommates.findMatches({
        limit: 10,
      });
      setTopMatches(matchesResponse.data.matches || []);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Profile doesn't exist
        setHasProfile(false);
        setProfileCompletion(0);

        // Still try to load some public profiles
        try {
          const publicProfiles = await apiService.roommates.getPublicProfiles({
            limit: 10,
          });
          // Map public profiles to have consistent structure
          const profilesWithoutMatch = publicProfiles.data.map((profile) => ({
            ...profile,
            // No matchDetails for public profiles
          }));
          setTopMatches(profilesWithoutMatch);
        } catch {
          // If this fails too, just show empty state
          setTopMatches([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfileCompletion = (profile: RoommateProfile): number => {
    const fields = [
      "sleepSchedule",
      "cleanliness",
      "noiseTolerance",
      "guestPolicy",
      "studyHabits",
      "major",
      "year",
      "hobbies",
      "socialActivities",
      "petFriendly",
      "smokingAllowed",
      "dietaryRestrictions",
      "preferredRoommateGender",
      "ageRangeMin",
      "ageRangeMax",
      "bio",
      "languages",
      "university",
    ];

    const completed = fields.filter((field) => {
      const value = profile[field as keyof RoommateProfile];
      return (
        value !== null &&
        value !== undefined &&
        (Array.isArray(value) ? value.length > 0 : true)
      );
    }).length;

    return Math.round((completed / fields.length) * 100);
  };

  const handleProfileCardClick = (profileId: number) => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/roommates");
      return;
    }

    if (profileCompletion < 50) {
      setShowCompletionModal(true);
      return;
    }

    // Full access - navigate to profile
    router.push(`/roommates/profile/${profileId}`);
  };

  const handleViewAllClick = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/roommates");
      return;
    }

    if (profileCompletion < 80) {
      setShowCompletionModal(true);
      return;
    }

    router.push("/roommates/browse");
  };

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

            {/* Show some public profiles as preview */}
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with completion status */}
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
              {hasProfile && (
                <div className="text-right">
                  <p className="text-sm text-stone-600 mb-1">
                    Profile Completion
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-stone-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          profileCompletion >= 80
                            ? "bg-green-500"
                            : profileCompletion >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {profileCompletion}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Completion Status Banner */}
            {profileCompletion < 80 && (
              <div
                className={`mt-6 p-4 rounded-lg flex items-center justify-between ${
                  profileCompletion === 0
                    ? "bg-red-50 border border-red-200"
                    : profileCompletion < 50
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-blue-50 border border-blue-200"
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {profileCompletion === 0 ? (
                      <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
                    ) : profileCompletion < 50 ? (
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                    ) : (
                      <InformationCircleIcon className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p
                      className={`text-sm font-medium ${
                        profileCompletion === 0
                          ? "text-red-800"
                          : profileCompletion < 50
                          ? "text-yellow-800"
                          : "text-blue-800"
                      }`}
                    >
                      {profileCompletion === 0
                        ? "Create your profile to start matching with roommates"
                        : profileCompletion < 50
                        ? "Complete at least 50% of your profile to view full profiles"
                        : profileCompletion < 80
                        ? "Complete 80% of your profile to unlock all features"
                        : "Your profile is complete!"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/roommates/profile/complete")}
                  className="ml-4 px-4 py-2 bg-white rounded-md text-sm font-medium text-primary-600 hover:bg-stone-50 border border-stone-200"
                >
                  {profileCompletion === 0
                    ? "Create Profile"
                    : "Complete Profile"}
                </button>
              </div>
            )}
          </div>

          {/* Matches Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-stone-200 h-64 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topMatches
                  .slice(0, profileCompletion < 50 ? 6 : 9)
                  .map((match, index) => (
                    <div
                      key={match.id}
                      className={`relative ${
                        profileCompletion < 50 && index >= 3 ? "opacity-60" : ""
                      }`}
                    >
                      <RoommateProfileTeaser
                        profile={match}
                        isBlurred={profileCompletion < 50 && index >= 3}
                        onClick={() => handleProfileCardClick(match.id)}
                      />

                      {/* Lock overlay for restricted profiles */}
                      {profileCompletion < 50 && index >= 3 && (
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
                  ))}
              </div>

              {/* View All Button */}
              <div className="mt-12 text-center">
                <button
                  onClick={handleViewAllClick}
                  className={`px-8 py-3 rounded-lg font-medium transition-all ${
                    profileCompletion >= 80
                      ? "bg-primary-500 text-white hover:bg-primary-600"
                      : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                  }`}
                >
                  {profileCompletion >= 80
                    ? "Browse All Roommates"
                    : `Complete Profile to View All (${
                        80 - profileCompletion
                      }% more needed)`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Completion Modal */}
      <ProfileCompletionPrompt
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        currentCompletion={profileCompletion}
        requiredCompletion={profileCompletion < 50 ? 50 : 80}
        onStartProfile={() => router.push("/roommates/profile/complete")}
      />
    </MainLayout>
  );
}
