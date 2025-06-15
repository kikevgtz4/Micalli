// frontend/src/app/(main)/roommates/profile/edit/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import apiService from '@/lib/api';
import { RoommateProfile } from '@/types/api';
import { RoommateProfileFormData } from '@/types/roommates';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { getImageUrl } from '@/utils/imageUrls';
import {
  UserIcon,
  AcademicCapIcon,
  HomeIcon,
  SparklesIcon,
  HeartIcon,
  PhotoIcon,
  ChevronLeftIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

export default function EditRoommateProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<RoommateProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [hasChanges, setHasChanges] = useState(false);

  // Form sections state
  const [basicInfo, setBasicInfo] = useState({
    bio: '',
    program: '',
    graduationYear: new Date().getFullYear() + 1,
    sleepSchedule: 'average' as 'early_bird' | 'night_owl' | 'average',
  });

  const [lifestyle, setLifestyle] = useState({
    cleanliness: 3 as 1 | 2 | 3 | 4 | 5,
    noiseTolerance: 3 as 1 | 2 | 3 | 4 | 5,
    guestPolicy: 'occasionally' as 'rarely' | 'occasionally' | 'frequently',
    studyHabits: '',
  });

  const [preferences, setPreferences] = useState({
    petFriendly: false,
    smokingAllowed: false,
    dietaryRestrictions: [] as string[],
    languages: [] as string[],
  });

  const [social, setSocial] = useState({
    hobbies: [] as string[],
    socialActivities: [] as string[],
  });

  const [roommatePrefs, setRoommatePrefs] = useState({
    preferredRoommateGender: 'no_preference' as 'male' | 'female' | 'other' | 'no_preference',
    ageRangeMin: 18,
    ageRangeMax: null as number | null,
    preferredRoommateCount: 1,
  });

  // Load existing profile
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/roommates/profile/edit");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const loadProfile = async () => {
      if (isAuthenticated && user?.userType === "student") {
        try {
          const response = await apiService.roommates.getMyProfile();
          const profile = response.data;
          setExistingProfile(profile);
          
          // Populate all sections with existing data
          setBasicInfo({
            bio: profile.bio || '',
            program: profile.major || '', // API returns 'major', not 'program'
            graduationYear: profile.graduationYear || new Date().getFullYear() + 1,
            sleepSchedule: profile.sleepSchedule || 'average',
          });

          setLifestyle({
            cleanliness: (profile.cleanliness || 3) as 1 | 2 | 3 | 4 | 5,
            noiseTolerance: (profile.noiseTolerance || 3) as 1 | 2 | 3 | 4 | 5,
            guestPolicy: profile.guestPolicy || 'occasionally',
            studyHabits: profile.studyHabits || '',
          });

          setPreferences({
            petFriendly: profile.petFriendly || false,
            smokingAllowed: profile.smokingAllowed || false,
            dietaryRestrictions: profile.dietaryRestrictions || [],
            languages: profile.languages || [],
          });

          setSocial({
            hobbies: profile.hobbies || [],
            socialActivities: profile.socialActivities || [],
          });

          setRoommatePrefs({
            preferredRoommateGender: profile.preferredRoommateGender || 'no_preference',
            ageRangeMin: profile.ageRangeMin || 18,
            ageRangeMax: profile.ageRangeMax || null,
            preferredRoommateCount: profile.preferredRoommateCount || 1,
          });

        } catch (error: any) {
          if (error.isNotFound) {
            toast.error('No profile found. Redirecting to create profile...');
            router.push('/roommates/profile/complete');
          } else {
            console.error('Failed to load profile:', error);
            setError('Failed to load profile data.');
          }
        }
      }
      setProfileLoading(false);
    };

    loadProfile();
  }, [isAuthenticated, user, router]);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [basicInfo, lifestyle, preferences, social, roommatePrefs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);

      const profileData: Partial<RoommateProfileFormData> = {
        ...basicInfo,
        ...lifestyle,
        ...preferences,
        ...social,
        ...roommatePrefs,
        university: user?.university?.id,
      };

      await apiService.roommates.createOrUpdateProfile(profileData);
      toast.success('Profile updated successfully!');
      setHasChanges(false);
      
      // Redirect to profile view
      router.push(`/roommates/profile/${existingProfile!.id}`);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || profileLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!existingProfile) {
    return null;
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-stone-600 hover:text-stone-800 mb-4"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back
            </button>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-stone-900 mb-2">Edit Roommate Profile</h1>
                <p className="text-stone-600">Update your profile to find better matches</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/roommates/profile/${existingProfile.id}`)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-800 font-medium flex items-center gap-2"
                >
                  <EyeIcon className="w-4 h-4" />
                  View Profile
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-stone-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('edit')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'edit'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                }`}
              >
                Edit Profile
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                }`}
              >
                Preview
              </button>
            </nav>
          </div>

          {activeTab === 'edit' ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <UserIcon className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-semibold text-stone-900">Basic Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      About Me
                    </label>
                    <textarea
                      value={basicInfo.bio}
                      onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Tell potential roommates about yourself..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      value={basicInfo.program}
                      onChange={(e) => setBasicInfo({ ...basicInfo, program: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Graduation Year
                    </label>
                    <select
                      value={basicInfo.graduationYear}
                      onChange={(e) => setBasicInfo({ ...basicInfo, graduationYear: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      {[...Array(6)].map((_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Sleep Schedule
                    </label>
                    <select
                      value={basicInfo.sleepSchedule}
                      onChange={(e) => setBasicInfo({ ...basicInfo, sleepSchedule: e.target.value as any })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="early_bird">Early Bird (Before 10 PM)</option>
                      <option value="average">Average (10 PM - 12 AM)</option>
                      <option value="night_owl">Night Owl (After 12 AM)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lifestyle Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <HomeIcon className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-semibold text-stone-900">Lifestyle</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Cleanliness Level
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setLifestyle({ ...lifestyle, cleanliness: level as 1 | 2 | 3 | 4 | 5 })}
                          className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            lifestyle.cleanliness === level
                              ? 'bg-primary-500 text-white'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-stone-500 mt-1">1 = Very messy, 5 = Very clean</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Noise Tolerance
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setLifestyle({ ...lifestyle, noiseTolerance: level as 1 | 2 | 3 | 4 | 5 })}
                          className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            lifestyle.noiseTolerance === level
                              ? 'bg-primary-500 text-white'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-stone-500 mt-1">1 = Need silence, 5 = Noise doesn't bother me</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Guest Policy
                    </label>
                    <select
                      value={lifestyle.guestPolicy}
                      onChange={(e) => setLifestyle({ ...lifestyle, guestPolicy: e.target.value as any })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="rarely">Rarely have guests</option>
                      <option value="occasionally">Occasionally have guests</option>
                      <option value="frequently">Frequently have guests</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferences Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <SparklesIcon className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-semibold text-stone-900">Preferences</h2>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences.petFriendly}
                      onChange={(e) => setPreferences({ ...preferences, petFriendly: e.target.checked })}
                      className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-stone-700">Pet-friendly</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences.smokingAllowed}
                      onChange={(e) => setPreferences({ ...preferences, smokingAllowed: e.target.checked })}
                      className="rounded border-stone-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-stone-700">Smoking allowed</span>
                  </label>
                </div>
              </div>

              {/* Ideal Roommate Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <HeartIcon className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-semibold text-stone-900">Ideal Roommate</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Preferred Gender
                    </label>
                    <select
                      value={roommatePrefs.preferredRoommateGender}
                      onChange={(e) => setRoommatePrefs({ ...roommatePrefs, preferredRoommateGender: e.target.value as any })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="no_preference">No preference</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Number of Roommates
                    </label>
                    <select
                      value={roommatePrefs.preferredRoommateCount}
                      onChange={(e) => setRoommatePrefs({ ...roommatePrefs, preferredRoommateCount: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      {[1, 2, 3, 4].map((count) => (
                        <option key={count} value={count}>
                          {count} {count === 1 ? 'roommate' : 'roommates'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => router.push('/roommates')}
                  className="px-4 py-2 border border-stone-200 rounded-md shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !hasChanges}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            // Preview Tab - Show profile as others would see it
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-center mb-8">
                <p className="text-stone-600">This is how your profile appears to other students</p>
              </div>
              
              {/* Add the preview component here - you can reuse your existing profile view component */}
              <div className="border-2 border-stone-200 rounded-lg p-6">
                <p className="text-stone-500 text-center">Profile preview will be displayed here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}