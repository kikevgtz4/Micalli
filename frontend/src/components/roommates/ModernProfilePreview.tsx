// frontend/src/components/roommates/ModernProfilePreview.tsx
import React from "react";
import { RoommateProfile } from "@/types/api";
import { motion } from "framer-motion";
import {
  MapPinIcon,
  AcademicCapIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  HeartIcon,
  SparklesIcon,
  UserGroupIcon,
  ClockIcon,
  MoonIcon,
  SunIcon,
  UsersIcon,
  LanguageIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  FireIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

interface ModernProfilePreviewProps {
  profile: RoommateProfile;
  isOwnProfile?: boolean;
  editMode?: boolean;
  onEdit?: (section: string) => void;
}

export default function ModernProfilePreview({
  profile,
  isOwnProfile,
  editMode = false,
  onEdit,
}: ModernProfilePreviewProps) {
  // Helper functions
  const hasContent = (value: any) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  };

  const formatSchedule = (schedule?: string) => {
    if (!schedule) return null;
    return schedule.split("_").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  const getScheduleIcon = (schedule?: string) => {
    switch (schedule) {
      case "early_bird": return <SunIcon className="w-5 h-5 text-amber-500" />;
      case "night_owl": return <MoonIcon className="w-5 h-5 text-indigo-500" />;
      default: return <ClockIcon className="w-5 h-5 text-neutral-500" />;
    }
  };

  // Calculate what sections have content
  const hasBasicInfo = profile.bio || profile.age || profile.gender;
  const hasLifestyle = profile.sleepSchedule || profile.cleanliness || 
                      profile.noiseTolerance || profile.guestPolicy;
  const hasHousing = profile.budgetMin || profile.budgetMax || 
                    profile.moveInDate || hasContent(profile.preferredLocations);
  const hasInterests = hasContent(profile.hobbies) || hasContent(profile.socialActivities);
  const hasPreferences = profile.preferredRoommateGender || profile.ageRangeMin;
  
  // Component for section headers with edit button
  const SectionHeader = ({ icon, title, onEdit }: any) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {editMode && onEdit && (
        <button
          onClick={onEdit}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Edit
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        {/* Cover Image or Gradient */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 relative">
          {isOwnProfile && (
            <div className="absolute top-4 right-4">
              <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-sm">
                {profile.completionPercentage || 0}% Complete
              </span>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-12">
            {/* Profile Picture */}
            <div className="flex items-end gap-4">
              <div className="relative">
                {profile.images?.[0] ? (
                  <img
                    src={profile.images[0].url}
                    alt="Profile"
                    className="w-24 h-24 rounded-xl border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl border-4 border-white shadow-lg bg-neutral-200 flex items-center justify-center">
                    <UserGroupIcon className="w-12 h-12 text-neutral-400" />
                  </div>
                )}
                {profile.images && profile.images.length > 1 && (
                  <div className="absolute -bottom-2 -right-2 bg-neutral-900 text-white text-xs px-2 py-1 rounded-full">
                    +{profile.images.length - 1}
                  </div>
                )}
              </div>
              
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-neutral-900">
                  {profile.user?.firstName} {profile.user?.lastName}
                </h1>
                {profile.user?.username && (
                  <p className="text-neutral-600">@{profile.user.username}</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {editMode && (
              <button
                onClick={() => onEdit?.('basic')}
                className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Key Info Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.university && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                <AcademicCapIcon className="w-4 h-4" />
                {profile.university.name}
              </span>
            )}
            {profile.major && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                📚 {profile.major}
              </span>
            )}
            {profile.age && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm">
                {profile.age} years old
              </span>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 text-neutral-700 leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>
      </motion.div>

      {/* Image Gallery - Only if multiple images */}
      {profile.images && profile.images.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <SectionHeader 
            icon={<SparklesIcon className="w-5 h-5 text-blue-600" />}
            title="Photos"
            onEdit={() => onEdit?.('images')}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {profile.images.map((image, index) => (
              <div
                key={`img-${image.id || index}`}
                className="aspect-square rounded-lg overflow-hidden bg-neutral-100"
              >
                <img
                  src={image.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Lifestyle Section */}
      {hasLifestyle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <SectionHeader 
            icon={<HomeIcon className="w-5 h-5 text-blue-600" />}
            title="Lifestyle"
            onEdit={() => onEdit?.('lifestyle')}
          />
          
          <div className="grid grid-cols-2 gap-4">
            {profile.sleepSchedule && (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                {getScheduleIcon(profile.sleepSchedule)}
                <div>
                  <p className="text-sm text-neutral-600">Sleep Schedule</p>
                  <p className="font-medium text-neutral-900">
                    {formatSchedule(profile.sleepSchedule)}
                  </p>
                </div>
              </div>
            )}
            
            {profile.cleanliness && (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <span className="text-2xl">🧹</span>
                <div>
                  <p className="text-sm text-neutral-600">Cleanliness</p>
                  <p className="font-medium text-neutral-900">
                    {['Very Messy', 'Messy', 'Average', 'Clean', 'Very Clean'][profile.cleanliness - 1]}
                  </p>
                </div>
              </div>
            )}
            
            {profile.noiseTolerance && (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <span className="text-2xl">🔊</span>
                <div>
                  <p className="text-sm text-neutral-600">Noise Level</p>
                  <p className="font-medium text-neutral-900">
                    {['Very Quiet', 'Quiet', 'Moderate', 'Loud', 'Very Loud'][profile.noiseTolerance - 1]}
                  </p>
                </div>
              </div>
            )}
            
            {profile.guestPolicy && (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <UsersIcon className="w-8 h-8 text-neutral-600 p-1" />
                <div>
                  <p className="text-sm text-neutral-600">Guests</p>
                  <p className="font-medium text-neutral-900 capitalize">
                    {profile.guestPolicy}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Housing Preferences */}
      {hasHousing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <SectionHeader 
            icon={<MapPinIcon className="w-5 h-5 text-blue-600" />}
            title="Housing Preferences"
            onEdit={() => onEdit?.('housing')}
          />
          
          <div className="space-y-4">
            {(profile.budgetMin || profile.budgetMax) && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Budget Range</span>
                <span className="font-semibold text-neutral-900">
                  ${profile.budgetMin || 0} - ${profile.budgetMax || 'No limit'} MXN
                </span>
              </div>
            )}
            
            {profile.moveInDate && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Move-in Date</span>
                <span className="font-semibold text-neutral-900">
                  {new Date(profile.moveInDate).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {hasContent(profile.preferredLocations) && (
              <div>
                <span className="text-neutral-600 text-sm">Preferred Areas</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.preferredLocations?.map((location, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Interests & Activities */}
      {hasInterests && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <SectionHeader 
            icon={<SparklesIcon className="w-5 h-5 text-blue-600" />}
            title="Interests & Activities"
            onEdit={() => onEdit?.('interests')}
          />
          
          <div className="space-y-4">
            {hasContent(profile.hobbies) && (
              <div>
                <p className="text-sm text-neutral-600 mb-2">Hobbies</p>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies?.map((hobby, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {hasContent(profile.socialActivities) && (
              <div>
                <p className="text-sm text-neutral-600 mb-2">Social Activities</p>
                <div className="flex flex-wrap gap-2">
                  {profile.socialActivities?.map((activity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Deal Breakers - Only if they exist */}
      {hasContent(profile.dealBreakers) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-red-50 border border-red-200 rounded-xl p-6"
        >
          <SectionHeader 
            icon={<ExclamationTriangleIcon className="w-5 h-5 text-red-600" />}
            title="Deal Breakers"
            onEdit={() => onEdit?.('preferences')}
          />
          
          <div className="flex flex-wrap gap-2">
            {profile.dealBreakers?.map((breaker, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
              >
                {breaker}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Looking to Share - Only if they exist */}
      {hasContent(profile.sharedInterests) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6"
        >
          <SectionHeader 
            icon={<HeartIcon className="w-5 h-5 text-green-600" />}
            title="Looking to Share"
            onEdit={() => onEdit?.('preferences')}
          />
          
          <div className="flex flex-wrap gap-2">
            {profile.sharedInterests?.map((interest, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
              >
                {interest}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Profile Completion CTA */}
      {isOwnProfile && profile.completionPercentage && profile.completionPercentage < 100 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 text-center"
        >
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Complete Your Profile
          </h3>
          <p className="text-neutral-600 mb-4">
            Add more details to get better roommate matches
          </p>
          <button
            onClick={() => onEdit?.('all')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusCircleIcon className="w-5 h-5" />
            Add More Details
          </button>
        </motion.div>
      )}
    </div>
  );
}