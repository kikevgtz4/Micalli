import Image from "next/image";
import { RoommateProfile, RoommateMatch } from "@/types/api";
import { getImageUrl } from "@/utils/imageUrls";
import {
  AcademicCapIcon,
  MapPinIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ChevronRightIcon,
  CalendarIcon,
  BookOpenIcon,
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
  const { user } = useAuth();
  const isCurrentUser = !!(user && user.id && profile.user.id === user.id);

  const matchScore = (() => {
    if (isCurrentUser) return undefined;
    if (!("matchDetails" in profile)) return undefined;
    const match = profile as RoommateMatch;
    return match.matchDetails?.score;
  })();

  const imageUrl = getImageUrl(profile.user.profilePicture);

  // Get display name (nickname or first name)
  const displayName = profile.nickname || profile.firstName || profile.user.firstName || "Student";
  
  // Calculate age from user's date of birth
  const age = profile.user.age || profile.age;

  // Get top 3 most important attributes
  const getTopAttributes = () => {
    const attributes = [];
    
    // Core lifestyle attributes with their importance
    if (profile.sleepSchedule) {
      attributes.push({
        label: profile.sleepSchedule === "early_bird" ? "Early Bird" : 
               profile.sleepSchedule === "night_owl" ? "Night Owl" : "Flexible Sleep",
        icon: profile.sleepSchedule === "early_bird" ? "🌅" : 
              profile.sleepSchedule === "night_owl" ? "🌙" : "😴",
        priority: 1
      });
    }
    
    if (profile.cleanliness) {
      const cleanlinessLabels = ["Relaxed", "Tidy", "Clean", "Very Clean", "Spotless"];
      attributes.push({
        label: cleanlinessLabels[profile.cleanliness - 1],
        icon: ["🌪️", "🧹", "✨", "🌟", "💎"][profile.cleanliness - 1],
        priority: 2
      });
    }
    
    if (profile.studyHabits) {
      attributes.push({
        label: profile.studyHabits === "quiet" ? "Quiet Study" : 
               profile.studyHabits === "social" ? "Social Study" : "Flexible Study",
        icon: profile.studyHabits === "quiet" ? "📚" : 
              profile.studyHabits === "social" ? "👥" : "📖",
        priority: 3
      });
    }
    
    if (profile.guestPolicy) {
      attributes.push({
        label: profile.guestPolicy === "rarely" ? "Few Guests" : 
               profile.guestPolicy === "occasionally" ? "Some Guests" : "Social",
        icon: profile.guestPolicy === "rarely" ? "🚪" : 
              profile.guestPolicy === "occasionally" ? "👋" : "🎉",
        priority: 4
      });
    }
    
    if (profile.petFriendly) {
      attributes.push({
        label: "Pet Friendly",
        icon: "🐾",
        priority: 5
      });
    }
    
    if (profile.smokingAllowed === false) {
      attributes.push({
        label: "No Smoking",
        icon: "🚭",
        priority: 6
      });
    }
    
    // Sort by priority and take top 3
    return attributes.sort((a, b) => a.priority - b.priority).slice(0, 3);
  };

  const topAttributes = getTopAttributes();

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
                  alt={displayName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-medium text-stone-400">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg text-stone-900 flex items-center gap-2">
                  {displayName}
                  {profile.user.studentIdVerified && (
                    <CheckBadgeIcon className="w-5 h-5 text-primary-500" />
                  )}
                </h3>
                
                {/* Academic Info Line */}
                <div className="flex items-center gap-3 text-sm text-stone-600 mt-1">
                  {age && (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {age} years
                    </span>
                  )}
                  {profile.gender && (
                    <span>
                      {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                    </span>
                  )}
                  {profile.major && (
                    <span className="flex items-center gap-1">
                      <BookOpenIcon className="w-4 h-4" />
                      {profile.major}
                    </span>
                  )}
                  {profile.graduationYear && (
                    <span>Class of {profile.graduationYear}</span>
                  )}
                </div>
                
                {/* University */}
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

            {/* Top Attributes */}
            <div className="flex items-center gap-3 mt-3">
              {topAttributes.map((attr, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-md">
                  <span className="text-lg">{attr.icon}</span>
                  <span className="text-xs text-stone-700 font-medium">{attr.label}</span>
                </div>
              ))}
            </div>
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
      {/* Profile Image Container */}
      <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-medium text-stone-400">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Match Score Badge */}
        {matchScore !== undefined && (
          <div className="absolute top-3 right-3">
            <div
              className={`px-3 py-1 rounded-full text-sm font-semibold border backdrop-blur-sm ${getScoreColor(
                matchScore
              )}`}
            >
              {matchScore}%
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Name and Verification */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg text-stone-900 flex items-center gap-2">
            {displayName}
            {profile.user.studentIdVerified && (
              <CheckBadgeIcon className="w-5 h-5 text-primary-500" />
            )}
          </h3>
        </div>

        {/* Academic Info */}
        <div className="space-y-1 text-sm text-stone-600 mb-3">
          <div className="flex items-center gap-2">
            {age && <span>{age} years</span>}
            {age && profile.gender && <span>•</span>}
            {profile.gender && <span>{profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}</span>}
            {(age || profile.gender) && profile.major && <span>•</span>}
            {profile.major && <span>{profile.major}</span>}
          </div>
          {profile.graduationYear && (
            <div className="flex items-center gap-1">
              <AcademicCapIcon className="w-4 h-4" />
              <span>Class of {profile.graduationYear}</span>
            </div>
          )}
          {profile.university && (
            <div className="flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" />
              <span className="truncate">{profile.university.name}</span>
            </div>
          )}
        </div>

        {/* Top 3 Attributes */}
        <div className="space-y-2">
          {topAttributes.map((attr, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-stone-50 px-2 py-1.5 rounded-md"
            >
              <span className="text-base">{attr.icon}</span>
              <span className="text-xs text-stone-700 font-medium">{attr.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}