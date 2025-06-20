// frontend/src/components/roommates/EnhancedProfilePreview.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { RoommateProfile } from "@/types/api";
import { getImageUrl } from "@/utils/imageUrls";
import {
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  UserGroupIcon,
  SparklesIcon,
  HeartIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckBadgeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

interface EnhancedProfilePreviewProps {
  profile: RoommateProfile;
  isOwnProfile?: boolean;
}

export default function EnhancedProfilePreview({
  profile,
  isOwnProfile = false,
}: EnhancedProfilePreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);

  // Get display name - prioritize nickname, then firstName from user, then username
  const displayName = profile.nickname || profile.user?.firstName || profile.firstName || "Student";
  const fullName = `${profile.user?.firstName || profile.firstName || ""} ${profile.user?.lastName || profile.lastName || ""}`.trim();
  
  // Format budget
  const formatBudget = (min: number, max: number) => {
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()} MXN/month`;
    } else if (min) {
      return `From $${min.toLocaleString()} MXN/month`;
    } else if (max) {
      return `Up to $${max.toLocaleString()} MXN/month`;
    }
    return "Budget flexible";
  };

  // Get lifestyle emoji
  const getLifestyleEmoji = (value: string) => {
    const emojis: Record<string, string> = {
      early_bird: "🌅",
      night_owl: "🦉",
      average: "😊",
      home: "🏠",
      library: "📚",
      moderate: "⚖️",
      never: "🚫",
      occasionally: "👥",
      often: "🎉",
    };
    return emojis[value] || "";
  };

  const hasImages = profile.images && profile.images.length > 0;
  const mainImage = hasImages ? profile.images.find(img => img.isPrimary) || profile.images[0] : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section with Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Image Gallery */}
        {hasImages ? (
          <div className="relative h-96 bg-gradient-to-br from-primary-100 to-secondary-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <Image
                  src={getImageUrl(profile.images[currentImageIndex].image)}
                  alt={`${displayName}'s photo`}
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
            
            {/* Gallery Controls */}
            {profile.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((prev) => 
                    prev === 0 ? profile.images.length - 1 : prev - 1
                  )}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-stone-700" />
                </button>
                
                <button
                  onClick={() => setCurrentImageIndex((prev) => 
                    prev === profile.images.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
                >
                  <ChevronRightIcon className="w-5 h-5 text-stone-700" />
                </button>
                
                {/* Image Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {profile.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "w-8 bg-white"
                          : "bg-white/50 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
                
                {/* View All Photos Button */}
                <button
                  onClick={() => setShowFullGallery(true)}
                  className="absolute top-4 right-4 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all text-sm font-medium"
                >
                  View All ({profile.images.length})
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="h-96 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto bg-white/50 rounded-full flex items-center justify-center mb-4">
                <UserGroupIcon className="w-16 h-16 text-primary-400" />
              </div>
              <p className="text-stone-600">No photos uploaded yet</p>
            </div>
          </div>
        )}

        {/* Profile Content */}
        <div className="p-8">
          {/* Name and Basic Info */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-stone-900 mb-1">
                  {displayName}
                  {profile.isVerified && (
                    <CheckBadgeIcon className="inline-block w-7 h-7 text-primary-500 ml-2" />
                  )}
                </h1>
                {displayName !== fullName && fullName && (
                  <p className="text-stone-600">{fullName}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-stone-600">
                  {profile.age && (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {profile.age} years old
                    </span>
                  )}
                  {profile.gender && (
                    <span className="capitalize">
                      {profile.gender.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Match Score (if not own profile) */}
              {!isOwnProfile && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-lg">
                    <span className="text-2xl font-bold">92%</span>
                  </div>
                  <p className="text-sm text-stone-600 mt-1">Match</p>
                </div>
              )}
            </div>

            {/* University and Program */}
            {(profile.university || profile.major) && (
              <div className="flex items-center gap-4 text-stone-700 bg-primary-50 rounded-xl p-4">
                <BookOpenIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <div>
                  {profile.university && (
                    <p className="font-medium">{profile.university.name}</p>
                  )}
                  {profile.major && (
                    <p className="text-sm text-stone-600">{profile.major}</p>
                  )}
                  {profile.graduationYear && (
                    <p className="text-sm text-stone-600">
                      Graduating in {profile.graduationYear}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bio Section */}
          {profile.bio && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-primary-500" />
                About Me
              </h2>
              <p className="text-stone-700 leading-relaxed bg-stone-50 rounded-xl p-4">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {profile.sleepSchedule && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">
                  {getLifestyleEmoji(profile.sleepSchedule)}
                </div>
                <p className="text-sm font-medium text-blue-900">
                  {profile.sleepSchedule === "early_bird" ? "Early Bird" :
                   profile.sleepSchedule === "night_owl" ? "Night Owl" :
                   "Regular Sleep"}
                </p>
              </div>
            )}
            
            {profile.cleanliness && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-1">
                  {[...Array(Math.round(profile.cleanliness / 2))].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-green-500" />
                  ))}
                </div>
                <p className="text-sm font-medium text-green-900">
                  Cleanliness
                </p>
              </div>
            )}
            
            {profile.noiseTolerance && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">
                  {profile.noiseTolerance > 7 ? "🎉" : profile.noiseTolerance > 4 ? "🎵" : "🤫"}
                </div>
                <p className="text-sm font-medium text-purple-900">
                  {profile.noiseTolerance > 7 ? "Social" : profile.noiseTolerance > 4 ? "Moderate" : "Quiet"}
                </p>
              </div>
            )}
            
            {profile.guestPolicy && (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">
                  {getLifestyleEmoji(profile.guestPolicy)}
                </div>
                <p className="text-sm font-medium text-orange-900">
                  {profile.guestPolicy === "never" ? "No Guests" :
                   profile.guestPolicy === "occasionally" ? "Some Guests" :
                   "Guest Friendly"}
                </p>
              </div>
            )}
          </div>

          {/* Housing Preferences */}
          {(profile.budgetMin || profile.budgetMax || profile.moveInDate || profile.housingType) && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <HomeIcon className="w-5 h-5 text-primary-500" />
                Housing Preferences
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(profile.budgetMin || profile.budgetMax) && (
                  <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-4">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-stone-600">Budget</p>
                      <p className="font-medium text-stone-900">
                        {formatBudget(profile.budgetMin, profile.budgetMax)}
                      </p>
                    </div>
                  </div>
                )}
                
                {profile.moveInDate && (
                  <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-4">
                    <CalendarIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-stone-600">Move-in Date</p>
                      <p className="font-medium text-stone-900">
                        {new Date(profile.moveInDate).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {profile.housingType && (
                  <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-4">
                    <HomeIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-stone-600">Preferred Housing</p>
                      <p className="font-medium text-stone-900 capitalize">
                        {profile.housingType.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                )}
                
                {profile.preferredLocations && profile.preferredLocations.length > 0 && (
                  <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-4">
                    <MapPinIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-stone-600">Preferred Areas</p>
                      <p className="font-medium text-stone-900">
                        {profile.preferredLocations.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interests and Activities */}
          {((profile.hobbies && profile.hobbies.length > 0) || 
            (profile.socialActivities && profile.socialActivities.length > 0)) && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <HeartIcon className="w-5 h-5 text-primary-500" />
                Interests & Activities
              </h2>
              <div className="space-y-3">
                {profile.hobbies && profile.hobbies.length > 0 && (
                  <div>
                    <p className="text-sm text-stone-600 mb-2">Hobbies</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.hobbies.map((hobby, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium"
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {profile.socialActivities && profile.socialActivities.length > 0 && (
                  <div>
                    <p className="text-sm text-stone-600 mb-2">Social Activities</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.socialActivities.map((activity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Languages */}
          {profile.languages && profile.languages.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5 text-primary-500" />
                Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((language, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Roommate Preferences */}
          {(profile.preferredRoommateGender || profile.ageRangeMin || profile.ageRangeMax) && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-primary-500" />
                Roommate Preferences
              </h2>
              <div className="bg-secondary-50 rounded-xl p-4 space-y-2">
                {profile.preferredRoommateGender && profile.preferredRoommateGender !== "no_preference" && (
                  <p className="text-stone-700">
                    <span className="font-medium">Gender Preference:</span>{" "}
                    <span className="capitalize">
                      {profile.preferredRoommateGender.replace("_", " ")}
                    </span>
                  </p>
                )}
                {(profile.ageRangeMin || profile.ageRangeMax) && (
                  <p className="text-stone-700">
                    <span className="font-medium">Age Range:</span>{" "}
                    {profile.ageRangeMin || 18} - {profile.ageRangeMax || "Any"} years
                  </p>
                )}
                {profile.preferredRoommateCount && (
                  <p className="text-stone-700">
                    <span className="font-medium">Looking for:</span>{" "}
                    {profile.preferredRoommateCount} roommate{profile.preferredRoommateCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Deal Breakers */}
          {profile.dealBreakers && profile.dealBreakers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <XMarkIcon className="w-5 h-5 text-red-500" />
                Deal Breakers
              </h2>
              <div className="bg-red-50 rounded-xl p-4">
                <ul className="space-y-2">
                  {profile.dealBreakers.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-red-900">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Contact Options (if not own profile) */}
          {!isOwnProfile && (
            <div className="mt-8 pt-8 border-t border-stone-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2">
                  <HeartIcon className="w-5 h-5" />
                  Send Match Request
                </button>
                <button className="flex-1 px-6 py-3 bg-white text-primary-600 border-2 border-primary-200 rounded-xl font-medium hover:bg-primary-50 transition-all flex items-center justify-center gap-2">
                  <UserGroupIcon className="w-5 h-5" />
                  Message
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Full Gallery Modal */}
      <AnimatePresence>
        {showFullGallery && hasImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFullGallery(false)}
          >
            <button
              onClick={() => setShowFullGallery(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <div className="max-w-6xl w-full">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                      setShowFullGallery(false);
                    }}
                  >
                    <Image
                      src={getImageUrl(image.image)}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover hover:scale-110 transition-transform duration-300"
                    />
                    {image.isPrimary && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs rounded-full">
                        Main
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}