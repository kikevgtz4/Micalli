"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import RoommateCard from "@/components/roommates/RoommateCard";
import ProfileCompletionPrompt from "@/components/roommates/ProfileCompletionPrompt";
import apiService from "@/lib/api";
import { RoommateProfile, RoommateMatch } from "@/types/api";
import {
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

export default function RoommatesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [profileState, setProfileState] = useState({
    completion: 0,
    hasProfile: false,
    matches: [] as (RoommateProfile | RoommateMatch)[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Load profile and matches
  const loadProfileAndMatches = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      let profileData = null;
      let matchesData = null;
      let hasProfile = false;

      try {
        const profileResponse = await apiService.roommates.getMyProfile();
        profileData = profileResponse.data;
        hasProfile = true;
      } catch (profileError: any) {
        if (profileError.response?.status === 404) {
          hasProfile = false;
        } else {
          throw profileError;
        }
      }

      if (hasProfile && profileData) {
        try {
          const matchesResponse = await apiService.roommates.findMatches({
            limit: 20,
          });
          matchesData = matchesResponse.data;
        } catch (matchError) {
          console.warn("Failed to load matches:", matchError);
          matchesData = { matches: [] };
        }
      }

      setProfileState({
        completion: profileData?.profileCompletionPercentage || 0,
        hasProfile: hasProfile,
        matches: matchesData?.matches || [],
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load roommate data");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProfileAndMatches();
  }, [loadProfileAndMatches]);

  // Filter and search matches
  const filteredMatches = useMemo(() => {
    let filtered = profileState.matches;

    // Apply compatibility filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter((match) => {
        const score = (match as RoommateMatch).matchDetails?.score || 0;
        if (selectedFilter === "excellent") return score >= 90;
        if (selectedFilter === "good") return score >= 70 && score < 90;
        if (selectedFilter === "fair") return score >= 50 && score < 70;
        return true;
      });
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter((match) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          match.user.firstName?.toLowerCase().includes(searchLower) ||
          match.user.lastName?.toLowerCase().includes(searchLower) ||
          match.major?.toLowerCase().includes(searchLower) ||
          match.bio?.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [profileState.matches, selectedFilter, searchQuery]);

  const handleProfileCardClick = useCallback(
    (profileId: number) => {
      if (!profileState.hasProfile) {
        setShowCompletionModal(true);
        return;
      }
      router.push(`/roommates/profile/${profileId}`);
    },
    [profileState.hasProfile, router]
  );

  // Non-authenticated view
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-stone-50 pt-20">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-accent-50">
            <div className="absolute inset-0 bg-pattern-dots opacity-10" />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
              <div className="text-center">
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
                    onClick={() => router.push("/signup")}
                    className="px-8 py-4 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl"
                  >
                    Get Started Free
                  </button>
                  <button
                    onClick={() => router.push("/login")}
                    className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-stone-50 transition-all shadow-lg hover:shadow-xl border-2 border-primary-200"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                {[
                  { icon: ShieldCheckIcon, stat: "100%", label: "Verified Students" },
                  { icon: UserGroupIcon, stat: "2,500+", label: "Active Members" },
                  { icon: SparklesIcon, stat: "89%", label: "Match Success Rate" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-md text-center">
                    <item.icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-stone-900">{item.stat}</div>
                    <div className="text-stone-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-3xl font-bold text-center text-stone-900 mb-12">
              How Roommate Matching Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Create Your Profile",
                  description: "Tell us about your lifestyle, habits, and preferences",
                },
                {
                  step: "2",
                  title: "Get Matched",
                  description: "Our algorithm finds compatible roommates based on 20+ factors",
                },
                {
                  step: "3",
                  title: "Connect & Chat",
                  description: "Message your matches and find your perfect roommate",
                },
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-2">{item.title}</h3>
                  <p className="text-stone-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Authenticated view
  return (
    <MainLayout>
      <div className="min-h-screen bg-stone-50 pt-20">
        {/* Header Section */}
        <div className="bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
                  <UserGroupIcon className="w-8 h-8 text-primary-500" />
                  Roommate Matches
                </h1>
                <p className="mt-1 text-stone-600">
                  {profileState.hasProfile
                    ? `${filteredMatches.length} compatible roommates found`
                    : "Create your profile to start matching"}
                </p>
              </div>

              {/* Profile Status Card */}
              <div className="bg-stone-50 rounded-lg p-4 min-w-[240px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone-600">Profile Status</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {profileState.completion}%
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      profileState.completion >= 80
                        ? "bg-primary-500"
                        : profileState.completion >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${profileState.completion}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  {profileState.completion >= 80 ? (
                    <>
                      <CheckBadgeIcon className="w-4 h-4 text-primary-500" />
                      <span className="text-primary-600">Full access</span>
                    </>
                  ) : (
                    <>
                      <ChartBarIcon className="w-4 h-4 text-stone-400" />
                      <span className="text-stone-600">
                        {80 - profileState.completion}% to unlock all
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            {profileState.hasProfile && (
              <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                {/* Search */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search by name, major, or interests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filters and View Options */}
                <div className="flex items-center gap-3">
                  {/* Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="appearance-none bg-white border border-stone-200 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">All Matches</option>
                      <option value="excellent">90%+ Match</option>
                      <option value="good">70-89% Match</option>
                      <option value="fair">50-69% Match</option>
                    </select>
                    <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
                  </div>

                  {/* View Toggle */}
                  <div className="flex bg-stone-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-1 rounded ${
                        viewMode === "grid"
                          ? "bg-white shadow-sm"
                          : "text-stone-600"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-1 rounded ${
                        viewMode === "list"
                          ? "bg-white shadow-sm"
                          : "text-stone-600"
                      }`}
                    >
                      List
                    </button>
                  </div>

                  {/* Edit Profile Button */}
                  <button
                    onClick={() => router.push("/roommates/profile/edit")}
                    className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            // Loading skeleton
            <div className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm p-6 animate-pulse"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-stone-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-stone-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-stone-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !profileState.hasProfile ? (
            // No profile state
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-100 rounded-full mb-6">
                <UserGroupIcon className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 mb-4">
                Create Your Roommate Profile
              </h2>
              <p className="text-stone-600 mb-8 max-w-md mx-auto">
                Tell us about yourself to get matched with compatible roommates
              </p>
              <button
                onClick={() => router.push("/roommates/profile/complete")}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all shadow-md hover:shadow-lg"
              >
                Create Profile
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
            // Matches grid/list
            <div className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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

      {/* Profile Completion Modal */}
      <ProfileCompletionPrompt
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        currentCompletion={profileState.completion}
        requiredCompletion={50}
        onStartProfile={() => router.push("/roommates/profile/complete")}
      />
    </MainLayout>
  );
}