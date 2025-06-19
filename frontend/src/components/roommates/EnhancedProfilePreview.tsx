// frontend/src/components/roommates/EnhancedProfilePreview.tsx
import React from 'react';
import { RoommateProfile } from '@/types/api';
import { motion } from 'framer-motion';
import {
  MapPinIcon,
  AcademicCapIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  HeartIcon,
  XCircleIcon,
  SparklesIcon,
  UserGroupIcon,
  ClockIcon,
  MoonIcon,
  SunIcon,
  VolumeUpIcon,
  TrashIcon,
  UsersIcon,
  LanguageIcon,
  FireIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface EnhancedProfilePreviewProps {
  profile: RoommateProfile;
  isOwnProfile?: boolean;
}

export default function EnhancedProfilePreview({ profile, isOwnProfile }: EnhancedProfilePreviewProps) {
  const images = profile.images || [];
  const mainImage = images.find(img => img.isPrimary) || images[0];
  const secondaryImages = images.filter(img => !img.isPrimary);
  
  // Distribute images throughout sections
  const imagePositions = {
    hero: secondaryImages.slice(0, 2),
    lifestyle: secondaryImages[2],
    interests: secondaryImages[3],
    compatibility: secondaryImages[4],
    footer: secondaryImages.slice(5, 7),
  };

  const getAgeFromUser = () => {
    return profile.user?.age || profile.age || null;
  };

  const getSleepIcon = (schedule?: string) => {
    switch (schedule) {
      case 'early_bird': return <SunIcon className="w-5 h-5" />;
      case 'night_owl': return <MoonIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getCleanlinessLabel = (level?: number) => {
    const labels = ['Very Messy', 'Somewhat Messy', 'Average', 'Clean', 'Very Clean'];
    return labels[(level || 3) - 1];
  };

  const getNoiseToleranceLabel = (level?: number) => {
    const labels = ['Need Silence', 'Prefer Quiet', 'Moderate', 'Tolerant', 'Party Animal'];
    return labels[(level || 3) - 1];
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section with Main Image and Basic Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl overflow-hidden mb-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 lg:p-8">
          {/* Left: Main Image and Secondary Images */}
          <div className="space-y-4">
            {mainImage && (
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg">
                <img
                  src={mainImage.url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-primary-600">
                  Primary Photo
                </div>
              </div>
            )}
            
            {imagePositions.hero.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {imagePositions.hero.map((img, index) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                    className="aspect-square rounded-lg overflow-hidden shadow-md"
                  >
                    <img
                      src={img.url}
                      alt={`Profile ${index + 2}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Basic Info */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 mb-2">
                {profile.user?.firstName} {profile.user?.lastName}
              </h1>
              <div className="flex flex-wrap gap-3 text-stone-600">
                {getAgeFromUser() && (
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {getAgeFromUser()} years old
                  </span>
                )}
                {profile.gender && (
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="w-4 h-4" />
                    {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                  </span>
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-stone-700 leading-relaxed">{profile.bio}</p>
            )}

            <div className="space-y-3">
              {profile.university && (
                <div className="flex items-center gap-2 text-stone-700">
                  <AcademicCapIcon className="w-5 h-5 text-primary-600" />
                  <span>{profile.university.name}</span>
                </div>
              )}
              {profile.major && (
                <div className="flex items-center gap-2 text-stone-700">
                  <span className="text-2xl">📚</span>
                  <span>{profile.major} • Class of {profile.graduationYear}</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/70 rounded-lg">
                <div className="text-2xl mb-1">{getSleepIcon(profile.sleepSchedule)}</div>
                <div className="text-xs text-stone-600">
                  {profile.sleepSchedule?.replace('_', ' ').charAt(0).toUpperCase() + 
                   profile.sleepSchedule?.slice(1).replace('_', ' ')}
                </div>
              </div>
              <div className="text-center p-3 bg-white/70 rounded-lg">
                <div className="text-2xl mb-1">🧹</div>
                <div className="text-xs text-stone-600">
                  {getCleanlinessLabel(profile.cleanliness)}
                </div>
              </div>
              <div className="text-center p-3 bg-white/70 rounded-lg">
                <div className="text-2xl mb-1">🔊</div>
                <div className="text-xs text-stone-600">
                  {getNoiseToleranceLabel(profile.noiseTolerance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Housing Preferences with Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-6"
      >
        <h2 className="text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <HomeIcon className="w-6 h-6 text-primary-600" />
          Housing Preferences
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-stone-600 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5" />
                  <span className="font-medium">Budget Range</span>
                </div>
                <p className="text-lg font-semibold text-stone-900">
                  ${profile.budgetMin?.toLocaleString()} - ${profile.budgetMax?.toLocaleString()} MXN
                </p>
              </div>
              
              <div className="bg-stone-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-stone-600 mb-2">
                  <CalendarIcon className="w-5 h-5" />
                  <span className="font-medium">Move-in Date</span>
                </div>
                <p className="text-lg font-semibold text-stone-900">
                  {profile.moveInDate ? new Date(profile.moveInDate).toLocaleDateString() : 'Flexible'}
                </p>
              </div>
            </div>
            
            {profile.preferredLocations && profile.preferredLocations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-stone-600 mb-2">
                  <MapPinIcon className="w-5 h-5" />
                  <span className="font-medium">Preferred Locations</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.preferredLocations.map((location, index) => (
                    <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {imagePositions.lifestyle && (
            <div className="aspect-square rounded-lg overflow-hidden shadow-md">
              <img
                src={imagePositions.lifestyle.url}
                alt="Lifestyle"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Deal Breakers - Emphasized Section */}
      {profile.dealBreakers && profile.dealBreakers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl shadow-sm p-6 mb-6 border-2 border-red-200"
        >
          <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            Deal Breakers
          </h2>
          <div className="flex flex-wrap gap-3">
            {profile.dealBreakers.map((dealBreaker, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-full font-medium flex items-center gap-2"
              >
                <XCircleIcon className="w-4 h-4" />
                {dealBreaker}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Interests & Activities with Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-6"
      >
        <h2 className="text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-primary-600" />
          Interests & Activities
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {imagePositions.interests && (
            <div className="aspect-square rounded-lg overflow-hidden shadow-md lg:order-2">
              <img
                src={imagePositions.interests.url}
                alt="Interests"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="lg:col-span-2 lg:order-1 space-y-4">
            {profile.hobbies && profile.hobbies.length > 0 && (
              <div>
                <h3 className="font-medium text-stone-700 mb-2">Hobbies</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gradient-to-r from-primary-100 to-accent-100 text-primary-800 rounded-full text-sm font-medium"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {profile.socialActivities && profile.socialActivities.length > 0 && (
              <div>
                <h3 className="font-medium text-stone-700 mb-2">Social Activities</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.socialActivities.map((activity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gradient-to-r from-accent-100 to-primary-100 text-accent-800 rounded-full text-sm font-medium"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Shared Interests - Emphasized Section */}
      {profile.sharedInterests && profile.sharedInterests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm p-6 mb-6 border-2 border-green-200"
        >
          <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
            <HeartIcon className="w-6 h-6 text-green-600" />
            Looking for Roommates Who Share These Interests
          </h2>
          <div className="flex flex-wrap gap-3">
            {profile.sharedInterests.map((interest, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {interest}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Compatibility Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-6"
      >
        <h2 className="text-xl font-semibold text-stone-900 mb-4">Compatibility Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Lifestyle Grid */}
          <div className="space-y-4">
            <h3 className="font-medium text-stone-700 flex items-center gap-2">
              <span className="text-xl">🏠</span> Lifestyle
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <span className="flex items-center gap-2 text-stone-600">
                  <span className="text-lg">🐕</span> Pets
                </span>
                <span className={`font-medium ${profile.petFriendly ? 'text-green-600' : 'text-red-600'}`}>
                  {profile.petFriendly ? 'Welcome!' : 'No pets'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <span className="flex items-center gap-2 text-stone-600">
                  <span className="text-lg">🚬</span> Smoking
                </span>
                <span className={`font-medium ${profile.smokingAllowed ? 'text-yellow-600' : 'text-green-600'}`}>
                  {profile.smokingAllowed ? 'Allowed' : 'No smoking'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <span className="flex items-center gap-2 text-stone-600">
                  <UsersIcon className="w-5 h-5" />
                  Guests
                </span>
                <span className="font-medium text-stone-700">
                  {profile.guestPolicy?.charAt(0).toUpperCase() + profile.guestPolicy?.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Languages & Diet */}
          <div className="space-y-4">
            <h3 className="font-medium text-stone-700 flex items-center gap-2">
              <LanguageIcon className="w-5 h-5" /> Communication
            </h3>
            
            {profile.languages && profile.languages.length > 0 && (
              <div>
                <p className="text-sm text-stone-600 mb-2">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0 && (
              <div>
                <p className="text-sm text-stone-600 mb-2">Dietary Restrictions</p>
                <div className="flex flex-wrap gap-2">
                  {profile.dietaryRestrictions.map((diet, index) => (
                    <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
                      {diet}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ideal Roommate with Image */}
          <div className="space-y-4">
            <h3 className="font-medium text-stone-700 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5" /> Ideal Roommate
            </h3>
            
            {imagePositions.compatibility && (
              <div className="aspect-video rounded-lg overflow-hidden shadow-md mb-4">
                <img
                  src={imagePositions.compatibility.url}
                  alt="Compatibility"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between">
                <span className="text-stone-600">Gender Preference:</span>
                <span className="font-medium">
                  {profile.preferredRoommateGender === 'no_preference' 
                    ? 'Any' 
                    : profile.preferredRoommateGender?.charAt(0).toUpperCase() + 
                      profile.preferredRoommateGender?.slice(1)}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-stone-600">Age Range:</span>
                <span className="font-medium">
                  {profile.ageRangeMin}-{profile.ageRangeMax || '99'}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-stone-600">Number of Roommates:</span>
                <span className="font-medium">{profile.preferredRoommateCount}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Additional Info */}
      {profile.additionalInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-xl shadow-sm p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-stone-900 mb-4">Additional Information</h2>
          <p className="text-stone-700 leading-relaxed">{profile.additionalInfo}</p>
        </motion.div>
      )}

      {/* Footer Gallery */}
      {imagePositions.footer.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {imagePositions.footer.map((img, index) => (
            <div
              key={img.id}
              className="aspect-video rounded-lg overflow-hidden shadow-md"
            >
              <img
                src={img.url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </motion.div>
      )}

      {/* Profile Completion */}
      {profile.completionPercentage !== undefined && profile.completionPercentage < 100 && isOwnProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center"
        >
          <p className="text-yellow-800">
            Your profile is {profile.completionPercentage}% complete. 
            <a href="/roommates/profile/edit" className="ml-2 font-medium underline">
              Complete your profile
            </a>
          </p>
        </motion.div>
      )}
    </div>
  );
}