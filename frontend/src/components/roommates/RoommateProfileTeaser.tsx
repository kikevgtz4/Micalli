// frontend/src/components/roommates/RoommateProfileTeaser.tsx

import Image from 'next/image';
import { RoommateProfile } from '@/types/api';
import { getImageUrl } from '@/utils/imageUrls';
import { formatters } from '@/utils/formatters';

interface RoommateProfileTeaserProps {
  profile?: RoommateProfile;
  isBlurred?: boolean;
  onClick?: () => void;
}

export default function RoommateProfileTeaser({ 
  profile, 
  isBlurred = false,
  onClick 
}: RoommateProfileTeaserProps) {
  // Mock data for preview if no profile provided
  const displayProfile = profile || {
    user: {
      firstName: 'Alex',
      lastName: 'Johnson',
      profilePicture: null,
    },
    major: 'Computer Science',
    university: { name: 'Tec de Monterrey' },
    year: 3,
    sleepSchedule: 'night_owl',
    cleanliness: 4,
    matchDetails: {
      score: 85,
    }
  };

  const getSleepScheduleEmoji = (schedule?: string) => {
    switch(schedule) {
      case 'early_bird': return '🌅';
      case 'night_owl': return '🌙';
      case 'average': return '☀️';
      default: return '😴';
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
        isBlurred ? 'select-none' : ''
      }`}
      onClick={onClick}
    >
      {/* Profile Header */}
      <div className="relative h-32 bg-gradient-to-r from-primary-400 to-primary-600">
        {profile?.matchDetails?.score && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-sm font-bold text-primary-700">
              {profile.matchDetails.score}% Match
            </span>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className={`p-6 -mt-12 relative ${isBlurred ? 'filter blur-sm' : ''}`}>
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full border-4 border-white bg-white mx-auto mb-4 overflow-hidden">
          {displayProfile.user.profilePicture ? (
            <Image
              src={getImageUrl(displayProfile.user.profilePicture)}
              alt={displayProfile.user.firstName || 'Profile'}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {displayProfile.user.firstName?.[0] || 'U'}
              </span>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-stone-900">
            {displayProfile.user.firstName} {displayProfile.user.lastName?.[0]}.
          </h3>
          <p className="text-sm text-stone-600">
            {displayProfile.major} • Year {displayProfile.year}
          </p>
          <p className="text-xs text-stone-500">
            {displayProfile.university?.name}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-stone-50 rounded-lg p-2">
            <div className="text-xl mb-1">
              {getSleepScheduleEmoji(displayProfile.sleepSchedule)}
            </div>
            <div className="text-xs text-stone-600">
              {displayProfile.sleepSchedule?.replace('_', ' ')}
            </div>
          </div>
          <div className="bg-stone-50 rounded-lg p-2">
            <div className="text-xl mb-1">🧹</div>
            <div className="text-xs text-stone-600">
              Clean: {displayProfile.cleanliness}/5
            </div>
          </div>
          <div className="bg-stone-50 rounded-lg p-2">
            <div className="text-xl mb-1">
              {profile?.hobbies?.length || 0 > 3 ? '🎯' : '🎮'}
            </div>
            <div className="text-xs text-stone-600">
              {profile?.hobbies?.length || 0} hobbies
            </div>
          </div>
        </div>

        {/* View Profile Button */}
        <button className="w-full mt-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition-colors">
          View Profile
        </button>
      </div>
    </div>
  );
}