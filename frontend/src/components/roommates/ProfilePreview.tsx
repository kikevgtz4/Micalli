// frontend/src/components/roommates/ProfilePreview.tsx
import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  SparklesIcon,
  HomeIcon,
  LanguageIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  BoltIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { StarIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { RoommateProfile } from '@/types/api';
import { getImageUrl } from '@/utils/imageUrls';

interface ProfilePreviewProps {
  profile: RoommateProfile;
  isOwnProfile?: boolean;
}

export default function ProfilePreview({ profile, isOwnProfile = false }: ProfilePreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>('lifestyle');

  // Get profile images or use placeholder
  const profileImages = profile.images?.filter(img => img) || [];
  const hasImages = profileImages.length > 0;

  // Calculate profile completion
  const completion = profile.completionPercentage || profile.profileCompletionPercentage || 0;
  const isComplete = completion >= 80;

  // Lifestyle emoji mapping
  const getLifestyleEmoji = (type: string, value: any) => {
    const emojiMap: Record<string, any> = {
      sleepSchedule: {
        early_bird: '🌅',
        night_owl: '🌙',
        average: '☀️',
      },
      cleanliness: ['😴', '🧹', '✨', '🏥', '💎'],
      noiseTolerance: ['🔇', '🔈', '🔉', '🔊', '🎵'],
      guestPolicy: {
        rarely: '🚪',
        occasionally: '👥',
        frequently: '🎉',
      },
    };

    if (type === 'cleanliness' || type === 'noiseTolerance') {
      return emojiMap[type][(value as number) - 1] || '❓';
    }
    return emojiMap[type]?.[value] || '❓';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Flexible';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Handle image navigation
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % profileImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + profileImages.length) % profileImages.length);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Image Gallery */}
      <div className="relative aspect-[4/3] md:aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 to-accent-100 mb-6">
        {hasImages ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image
                  src={getImageUrl(profileImages[currentImageIndex].url || '')}
                  alt={`Profile ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Image Navigation */}
            {profileImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-stone-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5 text-stone-700" />
                </button>

                {/* Image Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {profileImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'w-8 bg-white'
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl font-bold text-white">
                  {profile.user.firstName?.[0] || 'U'}
                </span>
              </div>
              <p className="text-stone-600">No photos uploaded yet</p>
            </div>
          </div>
        )}

        {/* Completion Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2 ${
          isComplete ? 'bg-green-500/90 text-white' : 'bg-yellow-500/90 text-white'
        }`}>
          {isComplete ? (
            <>
              <CheckCircleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Verified Complete</span>
            </>
          ) : (
            <>
              <BoltIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{completion}% Complete</span>
            </>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm p-6 mb-4"
      >
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 mb-1">
                  {profile.user.firstName} {profile.user.lastName}
                </h1>
                <div className="flex items-center gap-4 text-sm text-stone-600">
                  <span className="flex items-center gap-1">
                    <AcademicCapIcon className="w-4 h-4" />
                    {profile.major || 'Undeclared'}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {profile.graduationYear ? `Class of ${profile.graduationYear}` : 'Year ?'}
                  </span>
                </div>
              </div>
              {profile.age && (
                <div className="text-center">
                  <p className="text-2xl font-semibold text-stone-900">{profile.age}</p>
                  <p className="text-xs text-stone-500">years old</p>
                </div>
              )}
            </div>

            {/* University */}
            <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
              <MapPinIcon className="w-4 h-4" />
              <span>{profile.university?.name || 'University not specified'}</span>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-stone-700 leading-relaxed">{profile.bio}</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 md:w-48">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-1">
                <span className="text-xl">
                  {getLifestyleEmoji('sleepSchedule', profile.sleepSchedule)}
                </span>
              </div>
              <p className="text-xs text-stone-600">
                {profile.sleepSchedule?.replace('_', ' ') || 'Sleep'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-1">
                <span className="text-xl">
                  {getLifestyleEmoji('cleanliness', profile.cleanliness)}
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Clean {profile.cleanliness || '?'}/5
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-1">
                <span className="text-xl">
                  {getLifestyleEmoji('noiseTolerance', profile.noiseTolerance)}
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Noise {profile.noiseTolerance || '?'}/5
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Sections */}
      <div className="space-y-4">
        {/* Lifestyle Section */}
        <ProfileSection
          title="Lifestyle & Habits"
          icon={<HomeIcon className="w-5 h-5" />}
          expanded={expandedSection === 'lifestyle'}
          onToggle={() => setExpandedSection(expandedSection === 'lifestyle' ? null : 'lifestyle')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              label="Sleep Schedule"
              value={profile.sleepSchedule?.replace('_', ' ') || 'Not specified'}
              icon={profile.sleepSchedule === 'early_bird' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            />
            <InfoCard
              label="Guest Policy"
              value={profile.guestPolicy || 'Not specified'}
              icon={<UserGroupIcon className="w-4 h-4" />}
            />
            <InfoCard
              label="Study Habits"
              value={profile.studyHabits || 'Not specified'}
              icon={<AcademicCapIcon className="w-4 h-4" />}
            />
            <InfoCard
              label="Work Schedule"
              value={profile.workSchedule || 'Not specified'}
              icon={<ClockIcon className="w-4 h-4" />}
            />
          </div>
        </ProfileSection>

        {/* Preferences Section */}
        <ProfileSection
          title="Living Preferences"
          icon={<HomeIcon className="w-5 h-5" />}
          expanded={expandedSection === 'preferences'}
          onToggle={() => setExpandedSection(expandedSection === 'preferences' ? null : 'preferences')}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <PreferenceTag
                label="Pet Friendly"
                active={profile.petFriendly}
                icon="🐾"
              />
              <PreferenceTag
                label="Non-Smoking"
                active={!profile.smokingAllowed}
                icon="🚭"
              />
            </div>

            {profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-stone-700 mb-2">Dietary Restrictions</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.dietaryRestrictions.map((diet, index) => (
                    <span key={index} className="px-3 py-1 bg-stone-100 rounded-full text-sm text-stone-700">
                      {diet}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.languages && profile.languages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                  <LanguageIcon className="w-4 h-4" />
                  Languages
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang, index) => (
                    <span key={index} className="px-3 py-1 bg-primary-50 rounded-full text-sm text-primary-700">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ProfileSection>

        {/* Interests Section */}
        <ProfileSection
          title="Interests & Activities"
          icon={<SparklesIcon className="w-5 h-5" />}
          expanded={expandedSection === 'interests'}
          onToggle={() => setExpandedSection(expandedSection === 'interests' ? null : 'interests')}
        >
          <div className="space-y-4">
            {profile.hobbies && profile.hobbies.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                  <HeartIcon className="w-4 h-4" />
                  Hobbies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby, index) => (
                    <span key={index} className="px-3 py-1 bg-gradient-to-r from-primary-50 to-accent-50 rounded-full text-sm text-primary-700 font-medium">
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.socialActivities && profile.socialActivities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  Social Activities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.socialActivities.map((activity, index) => (
                    <span key={index} className="px-3 py-1 bg-gradient-to-r from-accent-50 to-primary-50 rounded-full text-sm text-accent-700 font-medium">
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ProfileSection>

        {/* Roommate Preferences */}
        <ProfileSection
          title="Ideal Roommate"
          icon={<UserGroupIcon className="w-5 h-5" />}
          expanded={expandedSection === 'roommate'}
          onToggle={() => setExpandedSection(expandedSection === 'roommate' ? null : 'roommate')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              label="Gender Preference"
              value={profile.preferredRoommateGender?.replace('_', ' ') || 'No preference'}
              icon={<UserGroupIcon className="w-4 h-4" />}
            />
            <InfoCard
              label="Age Range"
              value={`${profile.ageRangeMin || 18} - ${profile.ageRangeMax || 'Any'}`}
              icon={<CalendarIcon className="w-4 h-4" />}
            />
            <InfoCard
              label="Number of Roommates"
              value={`${profile.preferredRoommateCount || 1} roommate(s)`}
              icon={<UserGroupIcon className="w-4 h-4" />}
            />
            <InfoCard
              label="Move-in Date"
              value={formatDate(profile.moveInDate)}
              icon={<CalendarIcon className="w-4 h-4" />}
            />
          </div>
        </ProfileSection>
      </div>

      {/* Contact Button */}
      {!isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 sticky bottom-4"
        >
          <button className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Send Message
          </button>
        </motion.div>
      )}
    </div>
  );
}

// Sub-components
interface ProfileSectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ProfileSection({ title, icon, expanded, onToggle, children }: ProfileSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
            {icon}
          </div>
          <h3 className="font-semibold text-stone-900">{title}</h3>
        </div>
        <ChevronRightIcon
          className={`w-5 h-5 text-stone-400 transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-6 pb-6"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function InfoCard({ label, value, icon }: InfoCardProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
      <div className="p-2 bg-white rounded-lg text-stone-600">
        {icon}
      </div>
      <div>
        <p className="text-xs text-stone-500">{label}</p>
        <p className="text-sm font-medium text-stone-900">{value}</p>
      </div>
    </div>
  );
}

interface PreferenceTagProps {
  label: string;
  active: boolean;
  icon: string;
}

function PreferenceTag({ label, active, icon }: PreferenceTagProps) {
  return (
    <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
      active
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      <span>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
      {active ? (
        <CheckCircleIcon className="w-4 h-4" />
      ) : (
        <XCircleIcon className="w-4 h-4" />
      )}
    </div>
  );
}