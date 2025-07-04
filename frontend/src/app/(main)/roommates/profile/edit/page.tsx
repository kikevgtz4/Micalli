// frontend/src/app/(main)/roommates/profile/edit/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { RoommateProfileFormData } from "@/types/roommates";
import {
  ChevronLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
  UserCircleIcon,
  AcademicCapIcon,
  HomeIcon,
  UserGroupIcon,
  CameraIcon,
  HeartIcon,
  LockClosedIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import apiService from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import CoreProfileSection from "@/components/roommate-profile/sections/CoreProfileSection";
import LifestyleSection from "@/components/roommate-profile/sections/LifestyleSection";
import PhotosSection from "@/components/roommate-profile/sections/PhotosSection";
import HousingSection from "@/components/roommate-profile/sections/HousingSection";
import RoommatePreferencesSection from "@/components/roommate-profile/sections/RoommatePreferencesSection";

// Define types for better type safety
interface SubmitData {
  // Core fields (required)
  sleepSchedule: string;
  cleanliness: number;
  noiseTolerance: number;
  studyHabits: string;
  guestPolicy: string;
  
  // Bio fields
  nickname: string;
  bio: string;
  
  // Name fields (add these)
  firstName?: string;
  lastName?: string;

  dateofBirth?: string;


  // Academic fields (add these)
  university?: number;
  major?: string;
  graduationYear?: number;
  
  // Optional fields
  hobbies?: string[];
  socialActivities?: string[];
  personality?: string[];
  languages?: string[];
  dietaryRestrictions?: string[]; 
  budgetMin?: number;
  budgetMax?: number;
  moveInDate?: string;
  housingType?: string;
  preferredRoommateGender?: string;
  ageRangeMin?: number;
  ageRangeMax?: number;
  dealBreakers?: string[];
}

// Simplified section structure
const PROFILE_SECTIONS = [
  {
    id: 'core',
    title: 'Essential Information',
    icon: SparklesIcon,
    description: 'The basics that help find your perfect match',
    required: true,
    fields: ['firstName', 'lastName', 'bio', 'university', 'major', 'graduationYear', 'sleepSchedule', 'cleanliness', 'noiseTolerance', 'studyHabits', 'guestPolicy'],
  },
  {
    id: 'photos',
    title: 'Photos',
    icon: CameraIcon,
    description: 'Help others get to know you',
    required: false,
    fields: ['images'],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle & Interests',
    icon: HeartIcon,
    description: 'Share what makes you unique',
    required: false,
    fields: ['hobbies', 'socialActivities', 'personality', 'languages', 'dietaryRestrictions'],
  },
  {
    id: 'housing',
    title: 'Housing Preferences',
    icon: HomeIcon,
    description: 'What you\'re looking for in a home',
    required: false,
    fields: ['budgetMin', 'budgetMax', 'moveInDate', 'housingType'],
  },
  {
    id: 'roommate',
    title: 'Roommate Preferences',
    icon: UserGroupIcon,
    description: 'Your ideal roommate',
    required: false,
    fields: ['preferredRoommateGender', 'ageRangeMin', 'ageRangeMax', 'dealBreakers'],
  },
];

export default function EditRoommateProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('core');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['core']));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Add state to track the initial loaded data
  const [initialFormData, setInitialFormData] = useState<RoommateProfileFormData | null>(null);
  
  // Form state with proper typing
  const [formData, setFormData] = useState<RoommateProfileFormData>({
    id: undefined,
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    nickname: '',
    bio: '',
    sleepSchedule: 'average',
    cleanliness: 3,
    noiseTolerance: 3,
    studyHabits: 'flexible',
    guestPolicy: 'occasionally',
    images: [],
    hobbies: [],
    socialActivities: [],
    personality: [],
    languages: [],
    budgetMin: 0,
    budgetMax: 10000,
    moveInDate: '',
    housingType: 'apartment',
    preferredRoommateGender: 'no_preference',
    ageRangeMin: 18,
    ageRangeMax: undefined,
    dealBreakers: [],
  });

  // Helper function to deep compare objects (ignoring certain fields)
  const areProfilesEqual = (profile1: RoommateProfileFormData, profile2: RoommateProfileFormData): boolean => {
    // Fields to ignore in comparison (computed/server-managed fields)
    const ignoredFields = ['updatedAt', 'createdAt', 'completionPercentage', 'id'];
    
    // Create copies without ignored fields
    const cleanProfile = (profile: any) => {
      const cleaned = { ...profile };
      ignoredFields.forEach(field => delete cleaned[field]);
      return cleaned;
    };
    
    return JSON.stringify(cleanProfile(profile1)) === JSON.stringify(cleanProfile(profile2));
  };

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiService.roommates.getMyProfile();
        if (response.data) {
          const loadedData = {
            id: response.data.id,
            firstName: response.data.firstName || response.data.user?.firstName || '',
            lastName: response.data.lastName || response.data.user?.lastName || '',
            dateOfBirth: response.data.dateOfBirth || response.data.user?.dateOfBirth || '',
            nickname: response.data.nickname || '',
            bio: response.data.bio || '',
            sleepSchedule: response.data.sleepSchedule || 'average',
            cleanliness: response.data.cleanliness || 3,
            noiseTolerance: response.data.noiseTolerance || 3,
            studyHabits: response.data.studyHabits || 'flexible',
            guestPolicy: response.data.guestPolicy || 'occasionally',
            // Map images from API format to form format
            images: response.data.images?.map(img => ({
              id: `existing-${img.id}`,
              url: img.image,
              isPrimary: img.isPrimary || false,
              order: img.order || 0,
              isExisting: true,
              serverId: img.id
            })) || [],
            hobbies: response.data.hobbies || [],
            socialActivities: response.data.socialActivities || [],
            personality: response.data.personality || [],
            languages: response.data.languages || [],
            budgetMin: response.data.budgetMin || 0,
            budgetMax: response.data.budgetMax || 10000,
            moveInDate: response.data.moveInDate || '',
            housingType: response.data.housingType || 'apartment',
            preferredRoommateGender: response.data.preferredRoommateGender || 'no_preference',
            ageRangeMin: response.data.ageRangeMin || 18,
            ageRangeMax: response.data.ageRangeMax || undefined,
            dealBreakers: response.data.dealBreakers || [],
            // Map university ID
            university: response.data.university?.id || response.data.user?.university?.id,
            major: response.data.major || response.data.user?.program || '',
            graduationYear: response.data.graduationYear || response.data.user?.graduationYear,
            dietaryRestrictions: response.data.dietaryRestrictions && response.data.dietaryRestrictions.length > 0 
            ? response.data.dietaryRestrictions 
            : ['No Restrictions'], // Always initialize with 'No Restrictions' if empty
          };
          
          setFormData(loadedData);
          setInitialFormData(loadedData); // Store the initial state
          setHasChanges(false); // Explicitly set to false after loading
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load your profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Track changes by comparing with initial data
  useEffect(() => {
    if (!initialFormData) {
      // No initial data yet, so no changes
      setHasChanges(false);
      return;
    }

    // Deep comparison of formData with initialFormData
    const hasActualChanges = !areProfilesEqual(formData, initialFormData);
    setHasChanges(hasActualChanges);
  }, [formData, initialFormData]);

  // Calculate completion for each section
  const sectionCompletion = useMemo(() => {
    const completion: Record<string, number> = {};
    
    PROFILE_SECTIONS.forEach(section => {
      const sectionFields = section.fields;
      const filledFields = sectionFields.filter(field => {
        const value = formData[field as keyof RoommateProfileFormData];
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim() !== '';
        if (typeof value === 'number') return true;
        return value !== null && value !== undefined;
      });
      
      completion[section.id] = Math.round((filledFields.length / sectionFields.length) * 100);
    });
    
    return completion;
  }, [formData]);

  // Overall completion
  const overallCompletion = useMemo(() => {
    const coreCompletion = sectionCompletion['core'] || 0;
    const otherSections = Object.entries(sectionCompletion)
      .filter(([id]) => id !== 'core')
      .map(([_, value]) => value);
    
    // Core is worth 60%, other sections share the remaining 40%
    const otherAverage = otherSections.length > 0 
      ? otherSections.reduce((a, b) => a + b, 0) / otherSections.length 
      : 0;
    
    return Math.round(coreCompletion * 0.6 + otherAverage * 0.4);
  }, [sectionCompletion]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    // Early return if no changes
    if (!hasChanges) {
      toast('No changes to save');
      return;
    }

    // Validate required fields before submission
    const requiredFields = ['sleepSchedule', 'cleanliness', 'noiseTolerance', 'studyHabits', 'guestPolicy'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof RoommateProfileFormData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Step 1: Handle image operations first
      let profileId: number | null = null;
      
      // Get profile ID if we need to handle images
      const hasImageChanges = formData.images?.some(img => 
        (!img.isExisting && !img.isDeleted) || // new images
        (img.isExisting && img.isDeleted) || // deleted images
        (img.isPrimary && !formData.images?.find(i => i.isExisting && i.isPrimary && !i.isDeleted)) // primary changed
      );
      
      if (hasImageChanges) {
        try {
          const profileResponse = await apiService.roommates.getMyProfile();
          profileId = profileResponse.data.id;
        } catch (error: any) {
          if (error.isNotFound) {
            // Profile doesn't exist yet, skip image operations
            console.log('No profile exists yet, skipping image operations');
          } else {
            throw error;
          }
        }
      }
      
      // Handle image uploads and deletions if we have a profile
      if (profileId && hasImageChanges) {
        const imagePromises: Promise<any>[] = [];
        
        // Upload new images
        const newImages = formData.images?.filter(img => !img.isExisting && !img.isDeleted) || [];
        for (const [index, image] of newImages.entries()) {
          if (image.file) {
            // Show progress toast for each upload
            const uploadToast = toast.loading(`Uploading image ${index + 1} of ${newImages.length}...`);
            
            imagePromises.push(
              apiService.roommates.uploadImage(profileId, image.file)
                .then(response => {
                  toast.dismiss(uploadToast);
                  toast.success(`Image ${index + 1} uploaded`);
                  return {
                    type: 'upload',
                    tempId: image.id,
                    response,
                    isPrimary: image.isPrimary
                  };
                })
                .catch(error => {
                  toast.dismiss(uploadToast);
                  toast.error(`Failed to upload image ${index + 1}`);
                  console.error(`Failed to upload image ${image.id}:`, error);
                  throw error;
                })
            );
          }
        }
        
        // Delete removed images
        const deletedImages = formData.images?.filter(img => img.isExisting && img.isDeleted) || [];
        for (const image of deletedImages) {
          if (image.serverId) {
            imagePromises.push(
              apiService.roommates.deleteImage(profileId, image.serverId)
                .then(() => ({
                  type: 'delete',
                  imageId: image.serverId
                }))
                .catch(error => {
                  console.error(`Failed to delete image ${image.serverId}:`, error);
                  // Don't throw on delete errors - continue with other operations
                  return {
                    type: 'delete-failed',
                    imageId: image.serverId,
                    error
                  };
                })
            );
          }
        }
        
        // Execute all image operations
        if (imagePromises.length > 0) {
          const imageResults = await Promise.allSettled(imagePromises);
          
          // Check for failures
          const failedUploads = imageResults.filter(
            result => result.status === 'rejected' || 
            (result.status === 'fulfilled' && result.value.type === 'delete-failed')
          );
          
          if (failedUploads.length > 0) {
            console.error('Some image operations failed:', failedUploads);
            // Continue with profile update even if some images failed
            toast.error('Some images could not be processed, but profile will be updated');
          }
          
          // Handle primary image setting
          const successfulUploads = imageResults
            .filter(result => result.status === 'fulfilled' && result.value.type === 'upload')
            .map(result => (result as PromiseFulfilledResult<any>).value);
          
          // Find if any uploaded image should be primary
          const primaryUpload = successfulUploads.find(upload => upload.isPrimary);
          if (primaryUpload) {
            try {
              await apiService.roommates.setPrimaryImage(profileId, primaryUpload.response.data.id);
            } catch (error) {
              console.error('Failed to set primary image:', error);
              toast.error('Could not set primary image');
            }
          } else {
            // Check if an existing image was set as primary
            const existingPrimary = formData.images?.find(
              img => img.isPrimary && img.isExisting && !img.isDeleted
            );
            if (existingPrimary?.serverId) {
              try {
                await apiService.roommates.setPrimaryImage(profileId, existingPrimary.serverId);
              } catch (error) {
                console.error('Failed to set primary image:', error);
                toast.error('Could not set primary image');
              }
            }
          }
        }
      }

      // Step 2: Prepare and submit profile data (your existing code)
      const submitData: SubmitData = {
        sleepSchedule: formData.sleepSchedule,
        cleanliness: Number(formData.cleanliness),
        noiseTolerance: Number(formData.noiseTolerance),
        studyHabits: formData.studyHabits,
        guestPolicy: formData.guestPolicy,
        nickname: formData.nickname || '',
        bio: formData.bio || '',
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
      };

      // Add academic fields
      if (formData.university !== undefined) {
        submitData.university = formData.university;
      }
      if (formData.major) {
        submitData.major = formData.major;
      }
      if (formData.graduationYear !== undefined) {
        submitData.graduationYear = formData.graduationYear;
      }

      // Add optional array fields only if they have content
      if (formData.hobbies?.length) submitData.hobbies = formData.hobbies;
      if (formData.socialActivities?.length) submitData.socialActivities = formData.socialActivities;
      if (formData.personality?.length) submitData.personality = formData.personality;
      if (formData.dietaryRestrictions?.length) submitData.dietaryRestrictions = formData.dietaryRestrictions;
      if (formData.languages?.length) submitData.languages = formData.languages;
      if (formData.dealBreakers?.length) submitData.dealBreakers = formData.dealBreakers;

      // Add optional number fields with proper validation
      if (formData.budgetMin !== undefined && formData.budgetMin > 0) {
        submitData.budgetMin = Number(formData.budgetMin);
      }
      if (formData.budgetMax !== undefined && formData.budgetMax > 0) {
        submitData.budgetMax = Number(formData.budgetMax);
      }
      if (formData.ageRangeMin !== undefined && formData.ageRangeMin >= 18) {
        submitData.ageRangeMin = Number(formData.ageRangeMin);
      }
      if (formData.ageRangeMax !== undefined && formData.ageRangeMax >= 18) {
        submitData.ageRangeMax = Number(formData.ageRangeMax);
      }

      // Add optional string fields
      if (formData.moveInDate) submitData.moveInDate = formData.moveInDate;
      if (formData.housingType) submitData.housingType = formData.housingType;
      if (formData.preferredRoommateGender) submitData.preferredRoommateGender = formData.preferredRoommateGender;

      // Validate budget range
      if (submitData.budgetMin && submitData.budgetMax && submitData.budgetMin > submitData.budgetMax) {
        toast.error('Minimum budget cannot be greater than maximum budget');
        setIsSubmitting(false);
        return;
      }

      // Validate age range
      if (submitData.ageRangeMin && submitData.ageRangeMax && submitData.ageRangeMin > submitData.ageRangeMax) {
        toast.error('Minimum age cannot be greater than maximum age');
        setIsSubmitting(false);
        return;
      }

      console.log('Submitting profile update:', submitData);

      // Make API call
      const response = await apiService.roommates.updateProfile(submitData);
      
      // Step 3: Reload profile to get fresh data including images
      const updatedProfileResponse = await apiService.roommates.getMyProfile();
      
      // Update local state with server data
      const updatedFormData = {
        ...formData,
        // Map images from server response
        images: updatedProfileResponse.data.images?.map(img => ({
          id: `existing-${img.id}`,
          url: img.image || img.url, // handle both possible field names
          isPrimary: img.isPrimary || false,
          order: img.order || 0,
          isExisting: true,
          serverId: img.id
        })) || [],
        completionPercentage: updatedProfileResponse.data.completionPercentage,
        updatedAt: updatedProfileResponse.data.updatedAt,
      };
      
      setFormData(updatedFormData);
      setInitialFormData(updatedFormData);
      setHasChanges(false);
      
      // Success message
      toast.success('Profile updated successfully!');
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      // Your existing error handling
      if (error.response?.status === 400) {
        const validationErrors = error.response.data;
        
        if (typeof validationErrors === 'object') {
          const errorMessages = Object.entries(validationErrors)
            .map(([field, errors]) => {
              const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              let errorText = '';
              if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
                errorText = Object.values(errors as Record<string, any>).flat().join(', ');
              } else if (Array.isArray(errors)) {
                errorText = errors.join(', ');
              } else {
                errorText = String(errors || '');
              }
              
              return `${fieldName}: ${errorText}`;
            })
            .filter(msg => msg)
            .join('\n');
          
          toast.error(`Validation errors:\n${errorMessages}`);
        } else {
          toast.error(validationErrors.detail || 'Validation error occurred');
        }
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.request) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optional: Extract validation to a separate function
  const validateProfileData = (data: Partial<RoommateProfileFormData>): string[] => {
    const errors: string[] = [];
    
    if (data.budgetMin && data.budgetMax && data.budgetMin > data.budgetMax) {
      errors.push('Budget range is invalid');
    }
    
    if (data.ageRangeMin && data.ageRangeMax && data.ageRangeMin > data.ageRangeMax) {
      errors.push('Age range is invalid');
    }
    
    if (data.bio && data.bio.length > 500) {
      errors.push('Bio must be 500 characters or less');
    }
    
    return errors;
  };

  // Add a function to reset changes (optional but useful)
  const handleResetChanges = () => {
    if (initialFormData && hasChanges) {
      setFormData(initialFormData);
      setHasChanges(false);
      toast('Changes discarded');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white pt-12">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-stone-600 hover:text-primary-600 mb-4"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back
            </button>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-stone-900 mb-2">
                  Edit Your Profile
                </h1>
                <p className="text-stone-600">
                  {overallCompletion < 60 
                    ? "Complete the essentials to start matching" 
                    : "Add more details to improve your matches"}
                </p>
              </div>
              
              {/* Completion Ring */}
              <div className="text-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-stone-200"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - overallCompletion / 100)}`}
                      className="text-primary-600 transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-600">{overallCompletion}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-stone-900">Your Progress</h3>
              <div className="flex gap-2">
                {PROFILE_SECTIONS.map(section => (
                  <div
                    key={section.id}
                    className={`w-12 h-2 rounded-full transition-colors ${
                      sectionCompletion[section.id] === 100
                        ? 'bg-green-500'
                        : sectionCompletion[section.id] >= 50
                        ? 'bg-yellow-500'
                        : 'bg-stone-200'
                    }`}
                    title={`${section.title}: ${sectionCompletion[section.id]}%`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {PROFILE_SECTIONS.map((section, index) => {
              const isExpanded = expandedSections.has(section.id);
              const completion = sectionCompletion[section.id];
              const Icon = section.icon;
              
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden ${
                    section.required && completion < 100 ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        completion === 100 
                          ? 'bg-green-100 text-green-600'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                          {section.title}
                          {section.required && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              Required
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-stone-600">{section.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-stone-900">
                          {completion}%
                        </div>
                        {completion === 100 && (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <ChevronDownIcon className={`w-5 h-5 text-stone-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </button>

                  {/* Section Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 border-t border-stone-100">
                          {section.id === 'core' && (
                            <CoreProfileSection 
                              formData={formData} 
                              onChange={setFormData}
                              user={user}
                            />
                          )}
                          {section.id === 'photos' && (
                            <PhotosSection 
                              formData={formData} 
                              onChange={setFormData}
                            />
                          )}
                          {section.id === 'lifestyle' && (
                            <LifestyleSection
                              formData={formData} 
                              onChange={setFormData}
                            />
                          )}
                          {section.id === 'housing' && (
                            <HousingSection 
                              formData={formData} 
                              onChange={setFormData}
                            />
                          )}
                          {section.id === 'roommate' && (
                            <RoommatePreferencesSection 
                              formData={formData} 
                              onChange={setFormData}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Save Button - only shows when there are changes */}
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 flex gap-3"
            >
              {/* Optional: Add a discard button */}
              <button
                onClick={handleResetChanges}
                className="px-4 py-2 bg-stone-200 text-stone-700 rounded-full shadow-lg hover:bg-stone-300 transition-colors"
              >
                Discard
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}