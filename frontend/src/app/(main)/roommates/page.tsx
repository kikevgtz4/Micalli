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
  SparklesIcon,
  HeartIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  LockClosedIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

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
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

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
            limit: 12,
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

  // Filter matches based on compatibility
  const filteredMatches = useMemo(() => {
    if (selectedFilter === "all") return profileState.matches;
    if (selectedFilter === "high") {
      return profileState.matches.filter(
        (match) => (match as RoommateMatch).matchDetails?.score >= 80
      );
    }
    if (selectedFilter === "medium") {
      return profileState.matches.filter(
        (match) => {
          const score = (match as RoommateMatch).matchDetails?.score || 0;
          return score >= 60 && score < 80;
        }
      );
    }
    return profileState.matches;
  }, [profileState.matches, selectedFilter]);

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

  // Render for non-authenticated users
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute top-20 left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
            />
            <motion.div
              animate={{
                x: [0, -100, 0],
                y: [0, 100, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute bottom-20 right-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
            />
          </div>

          {/* Hero Section */}
          <div className="relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-8"
                >
                  <UserGroupIcon className="w-12 h-12 text-white" />
                </motion.div>

                <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
                  Find Your Perfect Roommate
                </h1>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                  Our AI-powered matching algorithm analyzes your lifestyle, habits, and preferences
                  to connect you with compatible students.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/signup")}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all"
                  >
                    Start Matching
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/login")}
                    className="px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all border-2 border-purple-200"
                  >
                    Sign In
                  </motion.button>
                </div>
              </motion.div>

              {/* Features Grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-3 gap-8 mt-20"
              >
                {[
                  {
                    icon: HeartIcon,
                    title: "Smart Compatibility",
                    description: "Advanced algorithm matches you based on 20+ lifestyle factors",
                    gradient: "from-pink-400 to-red-400",
                  },
                  {
                    icon: ShieldCheckIcon,
                    title: "Verified Students",
                    description: "All users verified through university credentials for safety",
                    gradient: "from-blue-400 to-purple-400",
                  },
                  {
                    icon: ChatBubbleLeftRightIcon,
                    title: "Secure Messaging",
                    description: "Connect and chat with potential roommates safely",
                    gradient: "from-green-400 to-teal-400",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ y: -10 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                    <div className="relative bg-white rounded-3xl p-8 shadow-xl">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl mb-6`}
                      >
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Demo Cards */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-20"
              >
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
                  See How It Works
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      className="relative group cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                      <div className="relative bg-white rounded-3xl overflow-hidden shadow-xl">
                        <div className="h-32 bg-gradient-to-r from-purple-400 to-pink-400" />
                        <div className="p-6 filter blur-sm">
                          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto -mt-16 mb-4" />
                          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                          <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto mb-4" />
                          <div className="flex justify-center gap-2">
                            <div className="w-16 h-8 bg-gray-100 rounded" />
                            <div className="w-16 h-8 bg-gray-100 rounded" />
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center text-white">
                            <LockClosedIcon className="w-12 h-12 mx-auto mb-3" />
                            <p className="font-semibold">Sign up to view</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Render for authenticated users
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section for authenticated users */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-12"
          >
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <motion.div
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div>
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-4xl font-bold mb-3 flex items-center gap-3"
                    >
                      <UserGroupIcon className="w-10 h-10" />
                      Your Roommate Matches
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xl text-purple-100"
                    >
                      {profileState.hasProfile
                        ? "Discover students who match your lifestyle"
                        : "Create your profile to start matching"}
                    </motion.p>
                  </div>

                  {profileState.hasProfile && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 min-w-[280px]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-purple-100">
                          Profile Strength
                        </span>
                        <span className="text-3xl font-bold">
                          {profileState.completion}%
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3 mb-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${profileState.completion}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            profileState.completion >= 80
                              ? "bg-gradient-to-r from-green-400 to-green-500"
                              : profileState.completion >= 50
                              ? "bg-gradient-to-r from-yellow-400 to-orange-400"
                              : "bg-gradient-to-r from-red-400 to-pink-400"
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {profileState.completion >= 80 ? (
                          <>
                            <CheckCircleIcon className="w-5 h-5 text-green-300" />
                            <span className="text-sm">Full access unlocked!</span>
                          </>
                        ) : (
                          <>
                            <ChartBarIcon className="w-5 h-5 text-yellow-300" />
                            <span className="text-sm">
                              {80 - profileState.completion}% more for full access
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-3 mt-6"
                >
                  {!profileState.hasProfile ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push("/roommates/profile/complete")}
                      className="px-6 py-3 bg-white text-purple-600 rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <PlusCircleIcon className="w-5 h-5" />
                      Create Your Profile
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push("/roommates/profile/edit")}
                      className="px-6 py-3 bg-white/20 backdrop-blur-lg text-white rounded-full font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
                    >
                      Edit Profile
                    </motion.button>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Filters (only show if has profile) */}
          {profileState.hasProfile && profileState.matches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-gray-600 font-medium">Filter by compatibility:</span>
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "All Matches" },
                    { value: "high", label: "80%+ Match" },
                    { value: "medium", label: "60-79% Match" },
                  ].map((filter) => (
                    <motion.button
                      key={filter.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedFilter(filter.value)}
                      className={`px-4 py-2 rounded-full font-medium transition-all ${
                        selectedFilter === filter.value
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                          : "bg-white text-gray-600 shadow-md hover:shadow-lg"
                      }`}
                    >
                      {filter.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl animate-pulse"
                />
              ))}
            </div>
          ) : !profileState.hasProfile ? (
            // No Profile State
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-8"
              >
                <UserGroupIcon className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Welcome to Roommate Matching!
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                Create your profile to discover compatible roommates and start connecting
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/roommates/profile/complete")}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-3"
              >
                <PlusCircleIcon className="w-6 h-6" />
                Create Your Profile
              </motion.button>

              {/* Demo Cards for users without profile */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => setShowCompletionModal(true)}
                    className="relative group cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                    <div className="relative bg-white rounded-3xl overflow-hidden shadow-xl transform transition-transform group-hover:scale-105">
                      <div className="h-32 bg-gradient-to-r from-purple-400 to-pink-400" />
                      <div className="p-6 filter blur-sm">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto -mt-16 mb-4" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto mb-4" />
                        <div className="flex justify-center gap-2">
                          <div className="w-16 h-8 bg-gray-100 rounded" />
                          <div className="w-16 h-8 bg-gray-100 rounded" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-center text-white">
                          <LockClosedIcon className="w-12 h-12 mx-auto mb-3" />
                          <p className="font-semibold">Create profile to view</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : filteredMatches.length === 0 ? (
            // No Matches State
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mb-8"
              >
                <UserGroupIcon className="w-16 h-16 text-gray-400" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                No Matches Found
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                {selectedFilter !== "all"
                  ? "Try adjusting your filters to see more matches"
                  : "Check back later or update your preferences"}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/roommates/profile/edit")}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all"
              >
                Update Profile
              </motion.button>
            </motion.div>
          ) : (
            // Matches Grid
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  variants={itemVariants}
                  onHoverStart={() => setHoveredCard(match.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  onClick={() => handleProfileCardClick(match.id)}
                  className="cursor-pointer"
                >
                  <RoommateCard
                    profile={match}
                    isHovered={hoveredCard === match.id}
                  />
                </motion.div>
              ))}
            </motion.div>
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