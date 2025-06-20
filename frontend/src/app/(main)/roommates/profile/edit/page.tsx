// frontend/src/app/(main)/roommates/profile/edit/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import MainLayout from "@/components/layout/MainLayout";
import ProfileImageUpload from "@/components/roommates/ProfileImageUpload";
import EnhancedProfilePreview from "@/components/roommates/EnhancedProfilePreview"; 
import SmartEditForm from "@/components/roommates/SmartEditForm";
import { calculateProfileCompletion } from "@/utils/profileCompletion";
import {
  ChevronLeftIcon,
  EyeIcon,
  CheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import apiService from "@/lib/api";
import { RoommateProfile, RoommateProfileImage } from "@/types/api";
import { 
  RoommateProfileFormData, 
  ImageData,
  BasicInfoState,
  LifestyleState,
  PreferencesState,
  SocialState,
  RoommatePreferencesState,
  HousingState,
  AdditionalState,
  EmergencyContactState,
  PrivacyState
} from "@/types/roommates";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import ProfileSkeleton from "@/components/roommates/ProfileSkeleton";

// Remove all the type definitions that were here - they're now imported

export default function EditRoommateProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<RoommateProfile | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedState, setSavedState] = useState<any>(null);

  // Form sections state with proper types
  const [basicInfo, setBasicInfo] = useState<BasicInfoState>({
    firstName: "",
    lastName: "",
    nickname: "",
    bio: "",
    gender: undefined,
    program: "",
    graduationYear: new Date().getFullYear() + 1,
    sleepSchedule: "average",
  });

  const [lifestyle, setLifestyle] = useState<LifestyleState>({
    cleanliness: 3,
    noiseTolerance: 3,
    guestPolicy: "occasionally",
    studyHabits: "",
    workSchedule: "",
  });

  const [preferences, setPreferences] = useState<PreferencesState>({
    petFriendly: false,
    smokingAllowed: false,
    dietaryRestrictions: [],
    languages: [],
  });

  const [social, setSocial] = useState<SocialState>({
    hobbies: [],
    socialActivities: [],
  });

  const [roommatePrefs, setRoommatePrefs] = useState<RoommatePreferencesState>({
    preferredRoommateGender: "no_preference",
    ageRangeMin: 18,
    ageRangeMax: null,
    preferredRoommateCount: 1,
  });

  const [housing, setHousing] = useState<HousingState>({
    budgetMin: 0,
    budgetMax: 10000,
    moveInDate: "",
    leaseDuration: "12_months",
    preferredLocations: [],
    housingType: "apartment",
  });

  const [images, setImages] = useState<ImageData[]>([]);

  const [additional, setAdditional] = useState<AdditionalState>({
    personality: [],
    dealBreakers: [],
    sharedInterests: [],
    additionalInfo: "",
  });

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContactState>({
    name: "",
    phone: "",
    relationship: undefined,  // Changed from "" to undefined
  });

  const [privacy, setPrivacy] = useState<PrivacyState>({
    profileVisibleTo: "everyone",
    contactVisibleTo: "matches_only",
    imagesVisibleTo: "everyone",
  });

  // Save handler for unsaved changes
  const handleSaveChanges = async () => {
    await handleSubmit();
  };

  // Discard handler
  const handleDiscardChanges = () => {
    // Restore to saved state
    if (savedState) {
      setBasicInfo(savedState.basicInfo);
      setLifestyle(savedState.lifestyle);
      setPreferences(savedState.preferences);
      setSocial(savedState.social);
      setRoommatePrefs(savedState.roommatePrefs);
      setHousing(savedState.housing);
      setImages(savedState.images);
      setAdditional(savedState.additional);
      setEmergencyContact(savedState.emergencyContact);
      setPrivacy(savedState.privacy);
    }
    setHasChanges(false);
  };

  // Use the unsaved changes hook
  const { Dialog: UnsavedChangesDialog } = useUnsavedChanges({
    hasChanges,
    onSave: handleSaveChanges,
    onDiscard: handleDiscardChanges,
  });

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || !user) {
        router.push("/login?redirect=/roommates/profile/edit");
        return;
      }

      if (user.userType !== "student") {
        toast.error("Only students can create roommate profiles");
        router.push("/");
        return;
      }

      setProfileLoading(true);
      try {
        const { data } = await apiService.roommates.getMyProfile();
        if (data) {
          setExistingProfile(data);

          // Initialize form with existing data including names
          const initialState = {
            basicInfo: {
              firstName: user?.firstName || "",
              lastName: user?.lastName || "",
              nickname: data.nickname || "",
              bio: data.bio || "",
              gender: data.gender || undefined,  // Changed to handle undefined
              program: data.major || user?.program || "",
              graduationYear: data.graduationYear || user?.graduationYear || new Date().getFullYear() + 1,
              sleepSchedule: data.sleepSchedule || "average",
            } as BasicInfoState,
            lifestyle: {
              cleanliness: (data.cleanliness || 3) as 1 | 2 | 3 | 4 | 5,
              noiseTolerance: (data.noiseTolerance || 3) as 1 | 2 | 3 | 4 | 5,
              guestPolicy: data.guestPolicy || "occasionally",
              studyHabits: data.studyHabits || "",
              workSchedule: data.workSchedule || "",
            } as LifestyleState,
            preferences: {
              petFriendly: data.petFriendly || false,
              smokingAllowed: data.smokingAllowed || false,
              dietaryRestrictions: data.dietaryRestrictions || [],
              languages: data.languages || [],
            } as PreferencesState,
            social: {
              hobbies: data.hobbies || [],
              socialActivities: data.socialActivities || [],
            } as SocialState,
            roommatePrefs: {
              preferredRoommateGender: data.preferredRoommateGender || "no_preference",
              ageRangeMin: data.ageRangeMin || 18,
              ageRangeMax: data.ageRangeMax || null,
              preferredRoommateCount: data.preferredRoommateCount || 1,
            } as RoommatePreferencesState,
            housing: {
              budgetMin: data.budgetMin || 0,
              budgetMax: data.budgetMax || 10000,
              moveInDate: data.moveInDate || "",
              leaseDuration: (data.leaseDuration || "12_months") as HousingState['leaseDuration'],
              preferredLocations: data.preferredLocations || [],
              housingType: (data.housingType || "apartment") as HousingState['housingType'],
            } as HousingState,
            additional: {
              personality: data.personality || [],
              dealBreakers: data.dealBreakers || [],
              sharedInterests: data.sharedInterests || [],
              additionalInfo: data.additionalInfo || "",
            } as AdditionalState,
            emergencyContact: {
              name: data.emergencyContactName || "",
              phone: data.emergencyContactPhone || "",
              relationship: data.emergencyContactRelation || undefined,  // Changed to undefined
            } as EmergencyContactState,
            privacy: {
              profileVisibleTo: (data.profileVisibleTo || "everyone") as PrivacyState['profileVisibleTo'],
              contactVisibleTo: (data.contactVisibleTo || "matches_only") as PrivacyState['contactVisibleTo'],
              imagesVisibleTo: (data.imagesVisibleTo || "everyone") as PrivacyState['imagesVisibleTo'],
            } as PrivacyState,
            images: [] as ImageData[],
          };

          // Set all states
          setBasicInfo(initialState.basicInfo);
          setLifestyle(initialState.lifestyle);
          setPreferences(initialState.preferences);
          setSocial(initialState.social);
          setRoommatePrefs(initialState.roommatePrefs);
          setHousing(initialState.housing);
          setAdditional(initialState.additional);
          setEmergencyContact(initialState.emergencyContact);
          setPrivacy(initialState.privacy);

          // Convert existing images to ImageData format
          if (data.images && data.images.length > 0) {
            const existingImages: ImageData[] = data.images.map((img, index) => ({
              id: `existing-${img.id}`,
              url: img.url || img.image,
              isPrimary: img.isPrimary,
              order: img.order || index,
              isExisting: true,
              serverId: img.id,
            }));
            setImages(existingImages);
            initialState.images = existingImages;
          }

          // Save initial state
          setSavedState(initialState);
          setHasChanges(false);
        }
      } catch (error: any) {
        if (error.isNotFound) {
          toast.error("No profile found. Redirecting to create profile...");
          router.push("/roommates/profile/complete");
        } else {
          console.error("Failed to load profile:", error);
          setError("Failed to load profile data.");
        }
      }
      setProfileLoading(false);
      setIsLoading(false);
    };

    loadProfile();
  }, [isAuthenticated, user, router]);

  // Track changes (no changes needed here)
  useEffect(() => {
    if (savedState) {
      const hasStateChanges = JSON.stringify({
        basicInfo,
        lifestyle,
        preferences,
        social,
        roommatePrefs,
        housing,
        images,
        additional,
        emergencyContact,
        privacy,
      }) !== JSON.stringify(savedState);
      setHasChanges(hasStateChanges);
    }
  }, [
    basicInfo,
    lifestyle,
    preferences,
    social,
    roommatePrefs,
    housing,
    images,
    additional,
    emergencyContact,
    privacy,
    savedState,
  ]);

  // Create preview profile object
  const previewProfile = useMemo<RoommateProfile | null>(() => {
    if (!user || !existingProfile) return null;

    // Prepare form data for completion calculation
    const currentFormData = {
      // Names
      firstName: basicInfo.firstName,
      lastName: basicInfo.lastName,
      nickname: basicInfo.nickname,
      
      // Basic Info
      bio: basicInfo.bio,
      gender: basicInfo.gender,
      program: basicInfo.program,
      major: basicInfo.program,
      year: basicInfo.graduationYear ? new Date().getFullYear() - basicInfo.graduationYear + 5 : undefined,
      graduationYear: basicInfo.graduationYear,
      sleepSchedule: basicInfo.sleepSchedule,

      // Lifestyle
      cleanliness: lifestyle.cleanliness,
      noiseTolerance: lifestyle.noiseTolerance,
      guestPolicy: lifestyle.guestPolicy,
      studyHabits: lifestyle.studyHabits,
      workSchedule: lifestyle.workSchedule,

      // Housing Preferences
      budgetMin: housing.budgetMin,
      budgetMax: housing.budgetMax,
      moveInDate: housing.moveInDate,
      leaseDuration: housing.leaseDuration,
      preferredLocations: housing.preferredLocations,
      housingType: housing.housingType,

      // Preferences
      petFriendly: preferences.petFriendly,
      smokingAllowed: preferences.smokingAllowed,
      dietaryRestrictions: preferences.dietaryRestrictions,
      languages: preferences.languages,

      // Social
      hobbies: social.hobbies,
      socialActivities: social.socialActivities,

      // Roommate Preferences
      preferredRoommateGender: roommatePrefs.preferredRoommateGender,
      ageRangeMin: roommatePrefs.ageRangeMin,
      ageRangeMax: roommatePrefs.ageRangeMax,
      preferredRoommateCount: roommatePrefs.preferredRoommateCount,

      // Additional fields
      personality: additional.personality,
      dealBreakers: additional.dealBreakers,
      sharedInterests: additional.sharedInterests,
      additionalInfo: additional.additionalInfo,

      // Emergency Contact - fixed to avoid empty string
      emergencyContactName: emergencyContact.name,
      emergencyContactPhone: emergencyContact.phone,
      emergencyContactRelation: emergencyContact.relationship || undefined,
      // Remove the duplicate emergencyContactRelationship line

      // Privacy Settings
      profileVisibleTo: privacy.profileVisibleTo,
      contactVisibleTo: privacy.contactVisibleTo,
      imagesVisibleTo: privacy.imagesVisibleTo,

      // Images
      imageCount: images.filter((img) => !img.isDeleted).length,
      images: images.filter((img) => !img.isDeleted),
    };

    const baseProfile: RoommateProfile = {
      ...existingProfile,
      ...currentFormData,
      
      // User info
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        profilePicture: user.profilePicture,
        university: user.university,
        program: user.program,
        graduationYear: user.graduationYear,
        age: user.age,
      },
      
      // Ensure gender is properly typed (not empty string)
      gender: basicInfo.gender || undefined,
      
      // Images
      images: images
        .filter((img) => !img.isDeleted)
        .map((img, index) => ({
          id: img.serverId || parseInt(img.id),
          image: img.url || "",
          url: img.url || "",
          isPrimary: img.isPrimary,
          order: index,
          uploadedAt: new Date().toISOString(),
        })),
      primaryImage: images.find((img) => img.isPrimary && !img.isDeleted)?.url,

      // Meta
      university: user.university,
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completionPercentage: calculateProfileCompletion(currentFormData, user),
      profileCompletionPercentage: calculateProfileCompletion(currentFormData, user),
      missingFields: [],
    };

    return baseProfile;
  }, [
    user,
    existingProfile,
    basicInfo,
    lifestyle,
    preferences,
    social,
    roommatePrefs,
    housing,
    images,
    additional,
    emergencyContact,
    privacy,
  ]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);

    try {
      // Combine all form sections into single object
      const profileData: Partial<RoommateProfileFormData> = {
        // Names - firstName and lastName will be saved to User model by backend
        firstName: basicInfo.firstName,
        lastName: basicInfo.lastName,
        nickname: basicInfo.nickname,
        
        // Basic Info
        bio: basicInfo.bio,
        gender: basicInfo.gender,
        program: basicInfo.program,
        dateOfBirth: user?.dateOfBirth,
        university: user?.university?.id,
        graduationYear: basicInfo.graduationYear,

        // Living Preferences
        budgetMin: housing.budgetMin,
        budgetMax: housing.budgetMax,
        moveInDate: housing.moveInDate,
        leaseDuration: housing.leaseDuration,
        preferredLocations: housing.preferredLocations,
        housingType: housing.housingType,

        // Lifestyle
        sleepSchedule: basicInfo.sleepSchedule,
        cleanliness: lifestyle.cleanliness,
        noiseTolerance: lifestyle.noiseTolerance,
        guestPolicy: lifestyle.guestPolicy,
        studyHabits: lifestyle.studyHabits,
        workSchedule: lifestyle.workSchedule,

        // Compatibility
        petFriendly: preferences.petFriendly,
        smokingAllowed: preferences.smokingAllowed,
        dietaryRestrictions: preferences.dietaryRestrictions,
        languages: preferences.languages,
        hobbies: social.hobbies,
        personality: additional.personality,

        // Roommate Preferences
        ageRangeMin: roommatePrefs.ageRangeMin,
        ageRangeMax: roommatePrefs.ageRangeMax,
        preferredRoommateGender: roommatePrefs.preferredRoommateGender,
        preferredRoommateCount: roommatePrefs.preferredRoommateCount,
        dealBreakers: additional.dealBreakers,
        sharedInterests: additional.sharedInterests,

        // Additional
        socialActivities: social.socialActivities,
        emergencyContactName: emergencyContact.name,
        emergencyContactPhone: emergencyContact.phone,
        emergencyContactRelation: emergencyContact.relationship || undefined,  // Ensure undefined not empty string
        additionalInfo: additional.additionalInfo,

        // Privacy Settings
        profileVisibleTo: privacy.profileVisibleTo,
        contactVisibleTo: privacy.contactVisibleTo,
        imagesVisibleTo: privacy.imagesVisibleTo,

        // Images
        images: images.map((img, index) => ({
          id: img.id,
          isPrimary: img.isPrimary,
          order: index,
          isExisting: img.isExisting,
          serverId: img.serverId,
          isDeleted: img.isDeleted,
        })),
        existingImageIds: images
          .filter((img) => img.isExisting && !img.isDeleted)
          .map((img) => img.serverId!)
          .filter(Boolean),
      };

      console.log("Submitting profile data:", profileData);

      // Update profile
      const response = await apiService.roommates.createOrUpdateProfile(profileData);

      // Handle image uploads (no changes needed here)
      if (response.data.id && images.some((img) => !img.isExisting && img.file)) {
        const newImages = images.filter((img) => !img.isExisting && img.file);

        for (const img of newImages) {
          if (img.file) {
            try {
              await apiService.roommates.uploadImage(response.data.id, img.file);
            } catch (error) {
              console.error("Error uploading image:", error);
              toast.error("Some images failed to upload");
            }
          }
        }

        // Handle image deletions
        const deletedImages = images.filter((img) => img.isDeleted && img.serverId);
        for (const img of deletedImages) {
          if (img.serverId) {
            try {
              await apiService.roommates.deleteImage(response.data.id, img.serverId);
            } catch (error) {
              console.error("Error deleting image:", error);
            }
          }
        }

        // Set primary image if changed
        const primaryImage = images.find((img) => img.isPrimary && img.serverId);
        if (primaryImage?.serverId) {
          try {
            await apiService.roommates.setPrimaryImage(response.data.id, primaryImage.serverId);
          } catch (error) {
            console.error("Error setting primary image:", error);
          }
        }
      }

      toast.success("Profile updated successfully!");
      setHasChanges(false);

      // Update saved state
      setSavedState({
        basicInfo: { ...basicInfo },
        lifestyle: { ...lifestyle },
        preferences: { ...preferences },
        social: { ...social },
        roommatePrefs: { ...roommatePrefs },
        housing: { ...housing },
        images: [...images],
        additional: { ...additional },
        emergencyContact: { ...emergencyContact },
        privacy: { ...privacy },
      });

      // Refresh profile data
      const { data: updatedProfile } = await apiService.roommates.getMyProfile();
      setExistingProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    switch (section) {
      case "basic":
        setBasicInfo((prev) => ({ ...prev, [field]: value }));
        break;
      case "lifestyle":
        setLifestyle((prev) => ({ ...prev, [field]: value }));
        break;
      case "preferences":
        setPreferences((prev) => ({ ...prev, [field]: value }));
        break;
      case "social":
        setSocial((prev) => ({ ...prev, [field]: value }));
        break;
      case "roommate":
        setRoommatePrefs((prev) => ({ ...prev, [field]: value }));
        break;
      case "housing":
        setHousing((prev) => ({ ...prev, [field]: value }));
        break;
      case "additional":
        setAdditional((prev) => ({ ...prev, [field]: value }));
        break;
      case "emergency":
        setEmergencyContact((prev) => ({ ...prev, [field]: value }));
        break;
      case "privacy":
        setPrivacy((prev) => ({ ...prev, [field]: value }));
        break;
    }
  };

  if (isLoading || profileLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <ProfileSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (!existingProfile) {
    return null;
  }

  const completion = calculateProfileCompletion({
    ...basicInfo,
    ...lifestyle,
    ...preferences,
    ...social,
    ...roommatePrefs,
    ...housing,
    ...additional,
    emergencyContactName: emergencyContact.name,
    emergencyContactPhone: emergencyContact.phone,
  }, user);

  return (
    <MainLayout>
      <UnsavedChangesDialog />
      
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="group flex items-center text-stone-600 hover:text-primary-600 mb-6 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Back to Profile
            </button>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                  Perfect Your Profile
                </h1>
                <p className="text-stone-600 text-lg">
                  {completion < 50 ? "Let's make your profile shine! ✨" :
                   completion < 80 ? "Almost there! Just a few more details 🎯" :
                   "Your profile looks amazing! 🌟"}
                </p>
              </div>
              
              {/* Enhanced Completion Indicator */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="relative">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-stone-200"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - completion / 100)}`}
                        className={`transition-all duration-1000 ${
                          completion >= 80 ? 'text-green-500' : 
                          completion >= 50 ? 'text-yellow-500' : 
                          'text-red-500'
                        }`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-stone-900">
                        {Math.round(completion)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 mt-1">Complete</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Enhanced Tab Navigation */}
          <div className="mb-8">
            <nav className="flex gap-1 p-1 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm">
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === "edit"
                    ? "bg-white text-primary-600 shadow-md"
                    : "text-stone-600 hover:text-stone-800 hover:bg-white/50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {activeTab === "edit" ? (
                    <SparklesIcon className="w-5 h-5" />
                  ) : null}
                  Edit Profile
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === "preview"
                    ? "bg-white text-primary-600 shadow-md"
                    : "text-stone-600 hover:text-stone-800 hover:bg-white/50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {activeTab === "preview" ? (
                    <EyeIcon className="w-5 h-5" />
                  ) : null}
                  Preview
                  {hasChanges && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full animate-pulse">
                      Unsaved
                    </span>
                  )}
                </span>
              </button>
            </nav>
          </div>

          {/* Content */}
          {activeTab === "edit" ? (
            <SmartEditForm
              basicInfo={basicInfo}
              lifestyle={lifestyle}
              preferences={preferences}
              social={social}
              roommatePrefs={roommatePrefs}
              housing={housing}
              images={images}
              additional={additional}
              emergencyContact={emergencyContact}
              privacy={privacy}
              user={user}
              onInputChange={handleInputChange}
              onImagesChange={setImages}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              completion={completion}
            />
          ) : (
            // Preview Tab
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Preview Instructions */}
              <div className="mb-6 bg-gradient-to-r from-primary-100 to-secondary-100 border border-primary-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary-900 mb-1">
                      Preview Mode
                    </h3>
                    <p className="text-sm text-primary-700">
                      This is how your profile appears to other students. Make sure
                      everything looks perfect before saving!
                    </p>
                  </div>
                </div>
              </div>
              
              {previewProfile ? (
                <EnhancedProfilePreview
                  profile={previewProfile}
                  isOwnProfile={true}
                />
              ) : (
                <div className="text-center py-8 text-stone-500">
                  Loading preview...
                </div>
              )}
              
              {/* Floating Save Button in Preview */}
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="fixed bottom-8 right-8 z-50"
                >
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}