// frontend/src/app/(main)/roommates/profile/edit/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import apiService from "@/lib/api";
import { RoommateProfile } from "@/types/api";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { getImageUrl } from "@/utils/imageUrls";
import {
  PhotoIcon,
  XMarkIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

export default function EditRoommateProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [existingProfile, setExistingProfile] = useState<RoommateProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Form state - similar to property edit pattern
  const [formData, setFormData] = useState({
    // Basic Info
    bio: '',
    sleepSchedule: 'average' as 'early_bird' | 'night_owl' | 'average',
    cleanliness: 3,
    noiseTolerance: 3,
    
    // Preferences
    petFriendly: false,
    smokingAllowed: false,
    dietaryRestrictions: [] as string[],
    languages: [] as string[],
    
    // Social
    hobbies: [] as string[],
    socialActivities: [] as string[],
    guestPolicy: 'occasionally' as 'rarely' | 'occasionally' | 'frequently',
    studyHabits: '',
    
    // Roommate Preferences
    preferredRoommateGender: 'no_preference' as 'male' | 'female' | 'other' | 'no_preference',
    ageRangeMin: 18,
    ageRangeMax: null as number | null,
    preferredRoommateCount: 1,
    
    // Images
    newImages: [] as File[],
    existingImages: [] as any[],
    imagesToDelete: [] as number[],
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
          
          // Populate form with existing data
          setFormData({
            bio: profile.bio || '',
            sleepSchedule: profile.sleepSchedule || 'average',
            cleanliness: profile.cleanliness || 3,
            noiseTolerance: profile.noiseTolerance || 3,
            petFriendly: profile.petFriendly || false,
            smokingAllowed: profile.smokingAllowed || false,
            dietaryRestrictions: profile.dietaryRestrictions || [],
            languages: profile.languages || [],
            hobbies: profile.hobbies || [],
            socialActivities: profile.socialActivities || [],
            guestPolicy: profile.guestPolicy || 'occasionally',
            studyHabits: profile.studyHabits || '',
            preferredRoommateGender: profile.preferredRoommateGender || 'no_preference',
            ageRangeMin: profile.ageRangeMin || 18,
            ageRangeMax: profile.ageRangeMax || 99,
            preferredRoommateCount: profile.preferredRoommateCount || 1,
            newImages: [],
            existingImages: profile.images || [],
            imagesToDelete: [],
          });
        } catch (error: any) {
          if (error.isNotFound) {
            // No profile exists, redirect to create
            router.push("/roommates/profile/complete");
          } else {
            console.error("Failed to load profile:", error);
            setError("Failed to load profile data");
          }
        } finally {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();
  }, [isAuthenticated, user, router]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: checkbox.checked });
    } else if (type === 'number') {
      // Special handling for ageRangeMax which can be null
      if (name === 'ageRangeMax') {
        setFormData({ 
          ...formData, 
          [name]: value === '' ? null : parseInt(value) || null 
        });
      } else {
        setFormData({ ...formData, [name]: parseInt(value) || 0 });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle array inputs (hobbies, languages, etc.)
  const handleArrayInput = (field: 'hobbies' | 'languages' | 'socialActivities' | 'dietaryRestrictions', value: string) => {
    if (value && value.trim()) {
      const currentArray = formData[field];
      if (!currentArray.includes(value.trim())) {
        setFormData({
          ...formData,
          [field]: [...currentArray, value.trim()]
        });
      }
    }
  };

  const removeArrayItem = (field: 'hobbies' | 'languages' | 'socialActivities' | 'dietaryRestrictions', index: number) => {
    const currentArray = formData[field];
    setFormData({
      ...formData,
      [field]: currentArray.filter((_, i) => i !== index)
    });
  };

  // Handle image operations
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const totalImages = formData.existingImages.length - formData.imagesToDelete.length + formData.newImages.length;
      const newFiles = Array.from(e.target.files);
      
      if (totalImages + newFiles.length > 7) {
        toast.error(`Maximum 7 images allowed. You can add ${7 - totalImages} more.`);
        return;
      }
      
      setFormData({
        ...formData,
        newImages: [...formData.newImages, ...newFiles]
      });
    }
  };

  const removeNewImage = (index: number) => {
    setFormData({
      ...formData,
      newImages: formData.newImages.filter((_, i) => i !== index)
    });
  };

  const toggleDeleteExistingImage = (imageId: number) => {
    if (formData.imagesToDelete.includes(imageId)) {
      setFormData({
        ...formData,
        imagesToDelete: formData.imagesToDelete.filter(id => id !== imageId)
      });
    } else {
      setFormData({
        ...formData,
        imagesToDelete: [...formData.imagesToDelete, imageId]
      });
    }
  };

  const setPrimaryImage = async (imageId: number) => {
    try {
      await apiService.roommates.setPrimaryImage(existingProfile!.id, imageId);
      
      // Update local state
      setFormData({
        ...formData,
        existingImages: formData.existingImages.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }))
      });
      
      toast.success('Primary image updated');
    } catch (error) {
      toast.error('Failed to update primary image');
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare update data
      const updateData: any = {
        bio: formData.bio,
        sleepSchedule: formData.sleepSchedule,
        cleanliness: formData.cleanliness,
        noiseTolerance: formData.noiseTolerance,
        petFriendly: formData.petFriendly,
        smokingAllowed: formData.smokingAllowed,
        dietaryRestrictions: formData.dietaryRestrictions,
        languages: formData.languages,
        hobbies: formData.hobbies,
        socialActivities: formData.socialActivities,
        guestPolicy: formData.guestPolicy,
        studyHabits: formData.studyHabits,
        preferredRoommateGender: formData.preferredRoommateGender,
        ageRangeMin: formData.ageRangeMin,
        ageRangeMax: formData.ageRangeMax,
        preferredRoommateCount: formData.preferredRoommateCount,
      };

      // Update profile
      await apiService.roommates.createOrUpdateProfile(updateData);

      // Handle image deletions
      for (const imageId of formData.imagesToDelete) {
        await apiService.roommates.deleteImage(existingProfile!.id, imageId);
      }

      // Handle new image uploads
      for (const imageFile of formData.newImages) {
        await apiService.roommates.uploadImage(existingProfile!.id, imageFile);
      }

      toast.success('Profile updated successfully!');
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Edit Roommate Profile</h1>
            <p className="text-stone-600">Update your profile to find better matches</p>
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
            <form onSubmit={handleSubmit}>
              <div className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-stone-900 mb-6">Basic Information</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-stone-700 mb-1">
                        About Me
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Tell potential roommates about yourself..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="sleepSchedule" className="block text-sm font-medium text-stone-700 mb-1">
                          Sleep Schedule
                        </label>
                        <select
                          id="sleepSchedule"
                          name="sleepSchedule"
                          value={formData.sleepSchedule}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="early_bird">Early Bird (Before 10 PM)</option>
                          <option value="average">Average (10 PM - 12 AM)</option>
                          <option value="night_owl">Night Owl (After 12 AM)</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="guestPolicy" className="block text-sm font-medium text-stone-700 mb-1">
                          Guest Policy
                        </label>
                        <select
                          id="guestPolicy"
                          name="guestPolicy"
                          value={formData.guestPolicy}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="rarely">Rarely have guests</option>
                          <option value="occasionally">Occasionally have guests</option>
                          <option value="frequently">Frequently have guests</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-3">
                          Cleanliness Level: {formData.cleanliness}/5
                        </label>
                        <input
                          type="range"
                          name="cleanliness"
                          min="1"
                          max="5"
                          value={formData.cleanliness}
                          onChange={handleChange}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-stone-500 mt-1">
                          <span>Relaxed</span>
                          <span>Very Tidy</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-3">
                          Noise Tolerance: {formData.noiseTolerance}/5
                        </label>
                        <input
                          type="range"
                          name="noiseTolerance"
                          min="1"
                          max="5"
                          value={formData.noiseTolerance}
                          onChange={handleChange}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-stone-500 mt-1">
                          <span>Need Quiet</span>
                          <span>Don't Mind Noise</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lifestyle Preferences */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-stone-900 mb-6">Lifestyle Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="petFriendly"
                          name="petFriendly"
                          checked={formData.petFriendly}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-stone-200 rounded"
                        />
                        <label htmlFor="petFriendly" className="ml-2 text-sm font-medium text-stone-700">
                          Pet Friendly
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="smokingAllowed"
                          name="smokingAllowed"
                          checked={formData.smokingAllowed}
                          onChange={handleChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-stone-200 rounded"
                        />
                        <label htmlFor="smokingAllowed" className="ml-2 text-sm font-medium text-stone-700">
                          Smoking Allowed
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="studyHabits" className="block text-sm font-medium text-stone-700 mb-1">
                        Study Habits
                      </label>
                      <input
                        type="text"
                        id="studyHabits"
                        name="studyHabits"
                        value={formData.studyHabits}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., Study at library, quiet study at home..."
                      />
                    </div>

                    {/* Languages */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Languages
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add a language..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              handleArrayInput('languages', input.value);
                              input.value = '';
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-stone-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.languages.map((lang, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                          >
                            {lang}
                            <button
                              type="button"
                              onClick={() => removeArrayItem('languages', index)}
                              className="ml-2 text-primary-600 hover:text-primary-800"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interests & Activities */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-stone-900 mb-6">Interests & Activities</h2>
                  
                  <div className="space-y-6">
                    {/* Hobbies */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Hobbies
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add a hobby..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              handleArrayInput('hobbies', input.value);
                              input.value = '';
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-stone-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.hobbies.map((hobby, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                          >
                            {hobby}
                            <button
                              type="button"
                              onClick={() => removeArrayItem('hobbies', index)}
                              className="ml-2 text-green-600 hover:text-green-800"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Social Activities */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Social Activities
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add an activity..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              handleArrayInput('socialActivities', input.value);
                              input.value = '';
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-stone-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.socialActivities.map((activity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {activity}
                            <button
                              type="button"
                              onClick={() => removeArrayItem('socialActivities', index)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Roommate Preferences */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-stone-900 mb-6">Roommate Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="preferredRoommateGender" className="block text-sm font-medium text-stone-700 mb-1">
                          Preferred Gender
                        </label>
                        <select
                          id="preferredRoommateGender"
                          name="preferredRoommateGender"
                          value={formData.preferredRoommateGender}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="no_preference">No Preference</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="preferredRoommateCount" className="block text-sm font-medium text-stone-700 mb-1">
                          Number of Roommates
                        </label>
                        <input
                          type="number"
                          id="preferredRoommateCount"
                          name="preferredRoommateCount"
                          value={formData.preferredRoommateCount}
                          onChange={handleChange}
                          min="1"
                          max="5"
                          className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="ageRangeMin" className="block text-sm font-medium text-stone-700 mb-1">
                          Minimum Age
                        </label>
                        <input
                          type="number"
                          id="ageRangeMin"
                          name="ageRangeMin"
                          value={formData.ageRangeMin}
                          onChange={handleChange}
                          min="18"
                          max="99"
                          className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="ageRangeMax" className="block text-sm font-medium text-stone-700 mb-1">
                          Maximum Age (optional)
                        </label>
                        <input
                          type="number"
                          id="ageRangeMax"
                          name="ageRangeMax"
                          value={formData.ageRangeMax || ''}
                          onChange={handleChange}
                          min="18"
                          max="99"
                          className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Images */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-stone-900 mb-6">Profile Images</h2>
                  
                  {/* Existing Images */}
                  {formData.existingImages.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-stone-700 mb-3">Current Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.existingImages.map((image) => (
                          <div
                            key={image.id}
                            className={`relative aspect-square rounded-lg overflow-hidden ${
                              formData.imagesToDelete.includes(image.id) ? 'opacity-50' : ''
                            }`}
                          >
                            <Image
                              src={getImageUrl(image.image || image.url)}
                              alt="Profile"
                              fill
                              className="object-cover"
                            />
                            
                            {image.isPrimary && (
                              <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                                <StarIconSolid className="w-3 h-3" />
                                Primary
                              </div>
                            )}
                            
                            {formData.imagesToDelete.includes(image.id) && (
                              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                <span className="bg-red-500 text-white px-2 py-1 rounded text-sm">
                                  Will be deleted
                                </span>
                              </div>
                            )}
                            
                            <div className="absolute bottom-2 right-2 flex gap-1">
                              {!image.isPrimary && !formData.imagesToDelete.includes(image.id) && (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryImage(image.id)}
                                  className="p-1 bg-white/80 rounded hover:bg-white"
                                  title="Set as primary"
                                >
                                  <StarIcon className="w-4 h-4 text-stone-600" />
                                </button>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => toggleDeleteExistingImage(image.id)}
                                className={`p-1 rounded ${
                                  formData.imagesToDelete.includes(image.id)
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : 'bg-red-500 hover:bg-red-600'
                                } text-white`}
                                title={formData.imagesToDelete.includes(image.id) ? 'Cancel deletion' : 'Delete image'}
                              >
                                {formData.imagesToDelete.includes(image.id) ? (
                                  <CheckCircleIcon className="w-4 h-4" />
                                ) : (
                                  <XMarkIcon className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Images */}
                  <div>
                    <h3 className="text-md font-medium text-stone-700 mb-3">Add New Images</h3>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-stone-200 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-stone-400" />
                        <div className="flex text-sm text-stone-600">
                          <label
                            htmlFor="images"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
                          >
                            <span>Upload files</span>
                            <input
                              id="images"
                              name="images"
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleImageChange}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-stone-500">
                          PNG, JPG, WebP up to 5MB each (max 7 total)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* New Images Preview */}
                  {formData.newImages.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-md font-medium text-stone-700 mb-3">New Images to Upload</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.newImages.map((image, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                            <Image
                              src={URL.createObjectURL(image)}
                              alt={`New image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeNewImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => router.push('/roommates')}
                    className="px-4 py-2 border border-stone-200 rounded-md text-sm font-medium text-stone-700 bg-white hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            // Preview Tab - Show how the profile looks to others
            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-lg font-semibold mb-4">Profile Preview</h3>
              <p className="text-stone-600 mb-6">This is how your profile appears to other users</p>
              {/* You can implement a preview component here that shows the profile as others would see it */}
              <div className="text-center text-stone-500">
                Preview coming soon...
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}