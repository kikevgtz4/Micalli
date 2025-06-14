import { motion } from "framer-motion";
import Image from "next/image";
import { RoommateProfile, RoommateMatch } from "@/types/api";
import { getImageUrl } from "@/utils/imageUrls";
import {
  SparklesIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  MapPinIcon,
  AcademicCapIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

interface RoommateCardProps {
  profile: RoommateProfile | RoommateMatch;
  isHovered: boolean;
}

export default function RoommateCard({ profile, isHovered }: RoommateCardProps) {
  const matchScore = (profile as RoommateMatch)?.matchDetails?.score;
  const imageUrl = getImageUrl(profile.user.profilePicture);

  const getMatchColor = (score: number) => {
    if (score >= 80) return "from-green-400 to-emerald-500";
    if (score >= 70) return "from-blue-400 to-indigo-500";
    if (score >= 60) return "from-yellow-400 to-orange-500";
    return "from-gray-400 to-gray-500";
  };

  const getSleepIcon = () => {
    if (profile.sleepSchedule === "early_bird") return <SunIcon className="w-4 h-4" />;
    if (profile.sleepSchedule === "night_owl") return <MoonIcon className="w-4 h-4" />;
    return null;
  };

  const getCleanlinessEmoji = (level?: number) => {
    if (!level) return "🏠";
    const emojis = ["🌪️", "🧹", "✨", "🌟", "💎"];
    return emojis[level - 1] || "🏠";
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className={`relative bg-white rounded-3xl overflow-hidden shadow-lg transition-all duration-300 ${
        isHovered ? "shadow-2xl" : ""
      }`}
    >
      {/* Match Score Badge */}
      {matchScore && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`absolute top-4 right-4 z-20 bg-gradient-to-r ${getMatchColor(
            matchScore
          )} text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg`}
        >
          {matchScore}% Match
        </motion.div>
      )}

      {/* Header with gradient */}
      <div className="relative h-32 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
        <motion.div
          animate={{
            backgroundPosition: isHovered ? ["0% 0%", "100% 100%"] : "0% 0%",
          }}
          transition={{ duration: 3, ease: "linear" }}
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.3'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Profile Image */}
      <motion.div
        animate={{ scale: isHovered ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="relative z-10 -mt-16 mb-4"
      >
        <div className="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={profile.user.firstName || "Profile"}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {profile.user.firstName?.[0] || "?"}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-6 pb-6">
        <h3 className="text-xl font-bold text-gray-800 text-center mb-1">
          {profile.user.firstName} {profile.user.lastName?.[0]}.
        </h3>
        
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
          <AcademicCapIcon className="w-4 h-4" />
          <span>{profile.major || "Student"}</span>
          {profile.graduationYear && (
            <>
              <span className="text-gray-400">•</span>
              <span>Class of {profile.graduationYear}</span>
            </>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center"
          >
            <div className="text-2xl mb-1">{getSleepIcon() || "😴"}</div>
            <div className="text-xs text-gray-600">
              {profile.sleepSchedule?.replace("_", " ") || "Sleep"}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-3 text-center"
          >
            <div className="text-2xl mb-1">{getCleanlinessEmoji(profile.cleanliness)}</div>
            <div className="text-xs text-gray-600">
              Clean {profile.cleanliness || "?"}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl p-3 text-center"
          >
            <div className="text-2xl mb-1">
              {profile.hobbies?.length || 0 > 0 ? "🎯" : "💭"}
            </div>
            <div className="text-xs text-gray-600">
              {profile.hobbies?.length || 0} hobbies
            </div>
          </motion.div>
        </div>

        {/* Bio preview */}
        {profile.bio && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            "{profile.bio}"
          </p>
        )}

        {/* View Profile Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>View Profile</span>
          <motion.div
            animate={{ x: isHovered ? 5 : 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            →
          </motion.div>
        </motion.button>
      </div>

      {/* Hover effect overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent pointer-events-none"
      />
    </motion.div>
  );
}