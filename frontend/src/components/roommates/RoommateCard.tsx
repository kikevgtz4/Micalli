import Image from "next/image";
import { RoommateProfile, RoommateMatch } from "@/types/api";
import { getImageUrl } from "@/utils/imageUrls";
import {
  AcademicCapIcon,
  MapPinIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface RoommateCardProps {
  profile: RoommateProfile | RoommateMatch;
  viewMode: "grid" | "list";
  onClick: () => void;
}

export default function RoommateCard({
  profile,
  viewMode,
  onClick,
}: RoommateCardProps) {
  const { user } = useAuth(); // Get current user from auth context
  // Check if this profile belongs to the current user FIRST
  // Add null check and ensure proper type checking
  // This ensures isCurrentUser is always a boolean, never undefined
  const isCurrentUser = !!(user && user.id && profile.user.id === user.id);

  // This ensures matchScore is only set when:
  // 1. It's NOT the current user
  // 2. The profile actually has matchDetails (is a RoommateMatch type)
  // 3. The score exists
  const matchScore = (() => {
    if (isCurrentUser) return undefined;
    if (!("matchDetails" in profile)) return undefined;
    const match = profile as RoommateMatch;
    return match.matchDetails?.score;
  })();

  const imageUrl = getImageUrl(profile.user.profilePicture);

  // Lifestyle indicators
  const lifestyleIcons = [
    {
      label: profile.sleepSchedule?.replace("_", " ") || "Sleep",
      icon:
        profile.sleepSchedule === "early_bird"
          ? "🌅"
          : profile.sleepSchedule === "night_owl"
          ? "🌙"
          : "😴",
    },
    {
      label: `Clean ${profile.cleanliness || "?"}`,
      icon: ["🌪️", "🧹", "✨", "🌟", "💎"][
        profile.cleanliness ? profile.cleanliness - 1 : 2
      ],
    },
    {
      label: profile.petFriendly ? "Pet OK" : "No Pets",
      icon: profile.petFriendly ? "🐾" : "🚫",
    },
  ];

  // Match score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 70) return "text-primary-600 bg-primary-50 border-primary-200";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-stone-600 bg-stone-50 border-stone-200";
  };

  if (viewMode === "list") {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        <div className="p-6 flex items-center gap-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-stone-100">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={profile.user.firstName || "Profile"}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {profile.user.firstName?.[0] || "?"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                  {profile.user.firstName} {profile.user.lastName?.[0]}.
                  {profile.user.studentIdVerified && (
                    <CheckBadgeIcon className="w-5 h-5 text-primary-500" />
                  )}
                </h3>
                <p className="text-stone-600 flex items-center gap-2 mt-1">
                  <AcademicCapIcon className="w-4 h-4" />
                  {profile.major || "Student"} •{" "}
                  {profile.graduationYear || "Year ?"}
                </p>
                {profile.university && (
                  <p className="text-sm text-stone-500 flex items-center gap-2 mt-1">
                    <MapPinIcon className="w-4 h-4" />
                    {profile.university.name}
                  </p>
                )}
              </div>
              {/* Match Score */}
              {matchScore !== undefined && (
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(
                    matchScore
                  )}`}
                >
                  {matchScore}% Match
                </div>
              )}
            </div>

            {/* Lifestyle Icons */}
            <div className="flex items-center gap-4 mt-3">
              {lifestyleIcons.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs text-stone-600">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Bio Preview */}
            {profile.bio && (
              <p className="text-sm text-stone-600 mt-3 line-clamp-1">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Arrow */}
          <ChevronRightIcon className="w-5 h-5 text-stone-400" />
        </div>
      </motion.div>
    );
  }

  // Grid view (default)
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden relative"
      onClick={onClick}
    >
      {/* Profile Image Container with badge */}
      <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
        {/* Profile Image FIRST */}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={profile.user.firstName || "Profile"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
            <svg
              className="w-20 h-20 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        {/* Image count indicators */}
        {profile.imageCount > 1 && (
          <div className="absolute bottom-3 left-3 flex gap-1">
            {[...Array(Math.min(profile.imageCount, 5))].map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === 0 ? "bg-white" : "bg-white/60"
                } shadow-sm`}
              />
            ))}
            {profile.imageCount > 5 && (
              <div className="text-white text-xs font-medium ml-1">
                +{profile.imageCount - 5}
              </div>
            )}
          </div>
        )}

        {/* Match Score Badge - with explicit visibility */}
        {matchScore !== undefined && matchScore > 0 && (
          <div
            className="absolute top-3 right-3 z-30 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold border border-yellow-200 shadow-md pointer-events-none"
            style={{
              opacity: 1,
              visibility: "visible",
              display: "block",
            }}
          >
            {Math.round(matchScore)}%
          </div>
        )}

        {/* Verified Badge */}
        {profile.user.studentIdVerified && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 z-10">
            <CheckBadgeIcon className="w-4 h-4 text-primary-500" />
            <span className="text-xs font-medium">Verified</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-stone-900 mb-1">
          {profile.user.firstName} {profile.user.lastName?.[0]}.
        </h3>

        <p className="text-sm text-stone-600 flex items-center gap-2 mb-3">
          <AcademicCapIcon className="w-4 h-4" />
          {profile.major || "Student"} • {profile.graduationYear || "Year ?"}
        </p>

        {/* Lifestyle Quick View */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {lifestyleIcons.map((item, idx) => (
            <div key={idx} className="bg-stone-50 rounded-lg p-2 text-center">
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-xs text-stone-600">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Interests Preview */}
        {profile.hobbies && profile.hobbies.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {profile.hobbies.slice(0, 3).map((hobby, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-full"
              >
                {hobby}
              </span>
            ))}
            {profile.hobbies.length > 3 && (
              <span className="px-2 py-1 text-stone-500 text-xs">
                +{profile.hobbies.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* View Profile Link */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <span className="text-sm font-medium text-primary-600">
            View Profile
          </span>
          <ChevronRightIcon className="w-4 h-4 text-primary-600" />
        </div>
      </div>
    </motion.div>
  );
}
