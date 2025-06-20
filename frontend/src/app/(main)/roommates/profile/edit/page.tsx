// frontend/src/app/(main)/roommates/profile/edit/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProfileImageUpload from "@/components/roommates/ProfileImageUpload";
import EnhancedProfilePreview from "@/components/roommates/EnhancedProfilePreview"; 
import { calculateProfileCompletion } from "@/utils/profileCompletion";
import {
  ChevronLeftIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import apiService from "@/lib/api";
import { RoommateProfile, RoommateProfileImage } from "@/types/api";
import { RoommateProfileFormData, ImageData } from "@/types/roommates";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function EditRoommateProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [existingProfile, setExistingProfile] =
    useState<RoommateProfile | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form sections state
  const [basicInfo, setBasicInfo] = useState({
    bio: "",
    gender: "",
    program: "",
    graduationYear: new Date().getFullYear() + 1,
    sleepSchedule: "average" as "early_bird" | "night_owl" | "average",
  });

  const [lifestyle, setLifestyle] = useState({
    cleanliness: 3 as 1 | 2 | 3 | 4 | 5,
    noiseTolerance: 3 as 1 | 2 | 3 | 4 | 5,
    guestPolicy: "occasionally" as "rarely" | "occasionally" | "frequently",
    studyHabits: "",
    workSchedule: "",
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
    preferredRoommateGender: "no_preference" as
      | "male"
      | "female"
      | "other"
      | "no_preference",
    ageRangeMin: 18,
    ageRangeMax: null as number | null,
    preferredRoommateCount: 1,
  });

  const [housing, setHousing] = useState({
    budgetMin: 0,
    budgetMax: 10000,
    moveInDate: "",
    leaseDuration: "12_months",
    preferredLocations: [] as string[],
    housingType: "apartment",
  });

  const [images, setImages] = useState<ImageData[]>([]);

  const [additional, setAdditional] = useState({
    personality: [] as string[],
    dealBreakers: [] as string[],
    sharedInterests: [] as string[],
    additionalInfo: "",
  });

  const [emergencyContact, setEmergencyContact] = useState({
    name: "",
    phone: "",
    relation: "",
  });

  const [privacy, setPrivacy] = useState({
    profileVisibleTo: "everyone",
    contactVisibleTo: "matches_only",
    imagesVisibleTo: "everyone",
  });

  // Convert profile data to form data
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

          // Populate form fields with existing data
          setBasicInfo({
            bio: data.bio || "",
            gender: data.gender || "male",
            program: data.major || "",
            graduationYear: data.graduationYear || new Date().getFullYear() + 1,
            sleepSchedule: data.sleepSchedule || "average",
          });

          setLifestyle({
            cleanliness: (data.cleanliness || 3) as 1 | 2 | 3 | 4 | 5,
            noiseTolerance: (data.noiseTolerance || 3) as 1 | 2 | 3 | 4 | 5,
            guestPolicy: data.guestPolicy || "occasionally",
            studyHabits: data.studyHabits || "",
            workSchedule: data.workSchedule || "",
          });

          setPreferences({
            petFriendly: data.petFriendly || false,
            smokingAllowed: data.smokingAllowed || false,
            dietaryRestrictions: data.dietaryRestrictions || [],
            languages: data.languages || [],
          });

          setSocial({
            hobbies: data.hobbies || [],
            socialActivities: data.socialActivities || [],
          });

          setRoommatePrefs({
            preferredRoommateGender:
              data.preferredRoommateGender || "no_preference",
            ageRangeMin: data.ageRangeMin || 18,
            ageRangeMax: data.ageRangeMax || null,
            preferredRoommateCount: data.preferredRoommateCount || 1,
          });

          setHousing({
            budgetMin: data.budgetMin || 0,
            budgetMax: data.budgetMax || 10000,
            moveInDate: data.moveInDate || "",
            leaseDuration: data.leaseDuration || "12_months",
            preferredLocations: data.preferredLocations || [],
            housingType: data.housingType || "apartment",
          });

          setAdditional({
            personality: data.personality || [],
            dealBreakers: data.dealBreakers || [],
            sharedInterests: data.sharedInterests || [],
            additionalInfo: data.additionalInfo || "",
          });

          setEmergencyContact({
            name: data.emergencyContactName || "",
            phone: data.emergencyContactPhone || "",
            relation: data.emergencyContactRelation || "",
          });

          setPrivacy({
            profileVisibleTo: data.profileVisibleTo || "everyone",
            contactVisibleTo: data.contactVisibleTo || "matches_only",
            imagesVisibleTo: data.imagesVisibleTo || "everyone",
          });

          // Convert existing images to ImageData format
          if (data.images && data.images.length > 0) {
            const existingImages: ImageData[] = data.images.map(
              (img, index) => ({
                id: `existing-${img.id}`,
                url: img.url,
                isPrimary: img.isPrimary,
                order: img.order || index,
                isExisting: true,
                serverId: img.id,
              })
            );
            setImages(existingImages);
          }
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

  // Track changes
  useEffect(() => {
    setHasChanges(true);
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
  ]);

  // Create preview profile object
  const previewProfile = useMemo<RoommateProfile | null>(() => {
    if (!user) return null;

    // Prepare form data for completion calculation
    const currentFormData = {
      // Basic Info
      bio: basicInfo.bio,
      gender: basicInfo.gender,
      program: basicInfo.program,
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

      // Emergency Contact
      emergencyContactName: emergencyContact.name,
      emergencyContactPhone: emergencyContact.phone,
      emergencyContactRelation: emergencyContact.relation,

      // Privacy Settings
      profileVisibleTo: privacy.profileVisibleTo,
      contactVisibleTo: privacy.contactVisibleTo,
      imagesVisibleTo: privacy.imagesVisibleTo,

      // Images count for completion
      imageCount: images.filter((img) => !img.isDeleted).length,
      images: images.filter((img) => !img.isDeleted),
    };

    const baseProfile: RoommateProfile = {
      id: existingProfile?.id || 0,
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

      // Basic Info
      bio: basicInfo.bio,
      gender: basicInfo.gender as "male" | "female" | "other",
      major: basicInfo.program,
      year: basicInfo.graduationYear
        ? new Date().getFullYear() - basicInfo.graduationYear + 5
        : undefined,
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

      // Additional fields from the new sections
      personality: additional.personality,
      dealBreakers: additional.dealBreakers,
      sharedInterests: additional.sharedInterests,
      additionalInfo: additional.additionalInfo,

      // Emergency Contact
      emergencyContactName: emergencyContact.name,
      emergencyContactPhone: emergencyContact.phone,
      emergencyContactRelation: emergencyContact.relation,

      // Privacy Settings
      profileVisibleTo: privacy.profileVisibleTo,
      contactVisibleTo: privacy.contactVisibleTo,
      imagesVisibleTo: privacy.imagesVisibleTo,

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
      imageCount: images.filter((img) => !img.isDeleted).length,

      // Meta
      university: user.university,
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // Use your existing completion calculation utility
      completionPercentage: calculateProfileCompletion(currentFormData, user),
      profileCompletionPercentage: calculateProfileCompletion(
        currentFormData,
        user
      ),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine all form sections into single object
      const profileData: Partial<RoommateProfileFormData> = {
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
        emergencyContactRelation: emergencyContact.relation,
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
      const response = await apiService.roommates.createOrUpdateProfile(
        profileData
      );

      // Handle image uploads
      if (
        response.data.id &&
        images.some((img) => !img.isExisting && img.file)
      ) {
        const newImages = images.filter((img) => !img.isExisting && img.file);

        for (const img of newImages) {
          if (img.file) {
            try {
              await apiService.roommates.uploadImage(
                response.data.id,
                img.file
              );
            } catch (error) {
              console.error("Error uploading image:", error);
              toast.error("Some images failed to upload");
            }
          }
        }

        // Handle image deletions
        const deletedImages = images.filter(
          (img) => img.isDeleted && img.serverId
        );
        for (const img of deletedImages) {
          if (img.serverId) {
            try {
              await apiService.roommates.deleteImage(
                response.data.id,
                img.serverId
              );
            } catch (error) {
              console.error("Error deleting image:", error);
            }
          }
        }

        // Set primary image if changed
        const primaryImage = images.find(
          (img) => img.isPrimary && img.serverId
        );
        if (primaryImage?.serverId) {
          try {
            await apiService.roommates.setPrimaryImage(
              response.data.id,
              primaryImage.serverId
            );
          } catch (error) {
            console.error("Error setting primary image:", error);
          }
        }
      }

      toast.success("Profile updated successfully!");
      setHasChanges(false);

      // Refresh profile data
      const { data: updatedProfile } =
        await apiService.roommates.getMyProfile();
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
                <h1 className="text-3xl font-bold text-stone-900 mb-2">
                  Edit Roommate Profile
                </h1>
                <p className="text-stone-600">
                  Update your profile to find better matches
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    router.push(`/roommates/profile/${existingProfile.id}`)
                  }
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
                onClick={() => setActiveTab("edit")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "edit"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                }`}
              >
                Edit Profile
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === "preview"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                }`}
              >
                Preview
                {hasChanges && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    Unsaved
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Content */}
          {activeTab === "edit" ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Images Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Profile Photos
                </h3>
                <ProfileImageUpload
                  images={images}
                  onChange={setImages}
                  maxImages={6}
                />
              </motion.div>

              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={basicInfo.bio}
                      onChange={(e) =>
                        handleInputChange("basic", "bio", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={4}
                      placeholder="Tell potential roommates about yourself..."
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        University
                      </label>
                      <select
                        value={user?.university?.id || ""}
                        onChange={(e) => {
                          // This should update the user's university
                          toast(
                            "University changes should be made in your account settings"
                          );
                        }}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 cursor-not-allowed"
                        disabled
                      >
                        <option value="">
                          {user?.university?.name || "No university set"}
                        </option>
                      </select>
                      <p className="mt-1 text-xs text-stone-500">
                        Update in account settings
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={
                          user?.dateOfBirth
                            ? new Date(user.dateOfBirth)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 cursor-not-allowed"
                        disabled
                        readOnly
                      />
                      {user?.age && (
                        <p className="mt-1 text-sm text-stone-600">
                          Age: {user.age} years old
                        </p>
                      )}
                      <p className="mt-1 text-xs text-stone-500">
                        Update date of birth in account settings
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={basicInfo.gender}
                        onChange={(e) =>
                          handleInputChange("basic", "gender", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Major/Program
                    </label>
                    <input
                      type="text"
                      value={basicInfo.program}
                      onChange={(e) =>
                        handleInputChange("basic", "program", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      value={basicInfo.graduationYear}
                      onChange={(e) =>
                        handleInputChange(
                          "basic",
                          "graduationYear",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 8}
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Work Schedule
                    </label>
                    <input
                      type="text"
                      value={lifestyle.workSchedule}
                      onChange={(e) =>
                        handleInputChange(
                          "lifestyle",
                          "workSchedule",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Monday-Friday 9am-5pm, Weekend shifts, Remote work"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Lifestyle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Lifestyle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Sleep Schedule
                    </label>
                    <select
                      value={basicInfo.sleepSchedule}
                      onChange={(e) =>
                        handleInputChange(
                          "basic",
                          "sleepSchedule",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="early_bird">
                        Early Bird (Before 10pm)
                      </option>
                      <option value="night_owl">
                        Night Owl (After midnight)
                      </option>
                      <option value="average">Average (10pm-12am)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Cleanliness Level
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={lifestyle.cleanliness}
                      onChange={(e) =>
                        handleInputChange(
                          "lifestyle",
                          "cleanliness",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-stone-500 mt-1">
                      <span>Messy</span>
                      <span>Neat Freak</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Noise Tolerance
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={lifestyle.noiseTolerance}
                      onChange={(e) =>
                        handleInputChange(
                          "lifestyle",
                          "noiseTolerance",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-stone-500 mt-1">
                      <span>Need Silence</span>
                      <span>Party Animal</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Guest Policy
                    </label>
                    <select
                      value={lifestyle.guestPolicy}
                      onChange={(e) =>
                        handleInputChange(
                          "lifestyle",
                          "guestPolicy",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="rarely">Rarely have guests</option>
                      <option value="occasionally">
                        Occasionally have guests
                      </option>
                      <option value="frequently">Frequently have guests</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Housing Preferences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Housing Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Budget Range (MXN)
                    </label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="number"
                        value={housing.budgetMin}
                        onChange={(e) =>
                          handleInputChange(
                            "housing",
                            "budgetMin",
                            parseInt(e.target.value)
                          )
                        }
                        className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Min"
                      />
                      <span className="text-stone-500">to</span>
                      <input
                        type="number"
                        value={housing.budgetMax}
                        onChange={(e) =>
                          handleInputChange(
                            "housing",
                            "budgetMax",
                            parseInt(e.target.value)
                          )
                        }
                        className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Move-in Date
                    </label>
                    <input
                      type="date"
                      value={housing.moveInDate}
                      onChange={(e) =>
                        handleInputChange(
                          "housing",
                          "moveInDate",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Preferences & Compatibility */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Preferences & Compatibility
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                    <label className="text-sm font-medium text-stone-700">
                      Pet Friendly
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange(
                          "preferences",
                          "petFriendly",
                          !preferences.petFriendly
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        preferences.petFriendly
                          ? "bg-primary-600"
                          : "bg-stone-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          preferences.petFriendly
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                    <label className="text-sm font-medium text-stone-700">
                      Smoking Allowed
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange(
                          "preferences",
                          "smokingAllowed",
                          !preferences.smokingAllowed
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        preferences.smokingAllowed
                          ? "bg-primary-600"
                          : "bg-stone-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          preferences.smokingAllowed
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Dietary Restrictions
                    </label>
                    <input
                      type="text"
                      placeholder="Add dietary restrictions (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          handleInputChange(
                            "preferences",
                            "dietaryRestrictions",
                            [
                              ...preferences.dietaryRestrictions,
                              e.currentTarget.value.trim(),
                            ]
                          );
                          e.currentTarget.value = "";
                        }
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {preferences.dietaryRestrictions.map((diet, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-sm"
                        >
                          {diet}
                          <button
                            type="button"
                            onClick={() =>
                              handleInputChange(
                                "preferences",
                                "dietaryRestrictions",
                                preferences.dietaryRestrictions.filter(
                                  (_, i) => i !== index
                                )
                              )
                            }
                            className="text-stone-500 hover:text-stone-700"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Languages
                    </label>
                    <input
                      type="text"
                      placeholder="Add languages (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          handleInputChange("preferences", "languages", [
                            ...preferences.languages,
                            e.currentTarget.value.trim(),
                          ]);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {preferences.languages.map((lang, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 rounded-full text-sm text-primary-700"
                        >
                          {lang}
                          <button
                            type="button"
                            onClick={() =>
                              handleInputChange(
                                "preferences",
                                "languages",
                                preferences.languages.filter(
                                  (_, i) => i !== index
                                )
                              )
                            }
                            className="text-primary-500 hover:text-primary-700"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Social & Activities */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Social & Activities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Hobbies
                    </label>
                    <input
                      type="text"
                      placeholder="Add hobbies (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          handleInputChange("social", "hobbies", [
                            ...social.hobbies,
                            e.currentTarget.value.trim(),
                          ]);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {social.hobbies.map((hobby, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-primary-50 to-accent-50 rounded-full text-sm text-primary-700 font-medium"
                        >
                          {hobby}
                          <button
                            type="button"
                            onClick={() =>
                              handleInputChange(
                                "social",
                                "hobbies",
                                social.hobbies.filter((_, i) => i !== index)
                              )
                            }
                            className="text-primary-500 hover:text-primary-700"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Social Activities
                    </label>
                    <input
                      type="text"
                      placeholder="Add activities (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          handleInputChange("social", "socialActivities", [
                            ...social.socialActivities,
                            e.currentTarget.value.trim(),
                          ]);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {social.socialActivities.map((activity, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-accent-50 to-primary-50 rounded-full text-sm text-accent-700 font-medium"
                        >
                          {activity}
                          <button
                            type="button"
                            onClick={() =>
                              handleInputChange(
                                "social",
                                "socialActivities",
                                social.socialActivities.filter(
                                  (_, i) => i !== index
                                )
                              )
                            }
                            className="text-accent-500 hover:text-accent-700"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Ideal Roommate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Ideal Roommate
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Gender Preference
                    </label>
                    <select
                      value={roommatePrefs.preferredRoommateGender}
                      onChange={(e) =>
                        handleInputChange(
                          "roommate",
                          "preferredRoommateGender",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="no_preference">No Preference</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Number of Roommates
                    </label>
                    <input
                      type="number"
                      value={roommatePrefs.preferredRoommateCount}
                      onChange={(e) =>
                        handleInputChange(
                          "roommate",
                          "preferredRoommateCount",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="1"
                      max="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Age Range
                    </label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="number"
                        value={roommatePrefs.ageRangeMin}
                        onChange={(e) =>
                          handleInputChange(
                            "roommate",
                            "ageRangeMin",
                            parseInt(e.target.value)
                          )
                        }
                        className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Min"
                        min="18"
                      />
                      <span className="text-stone-500">to</span>
                      <input
                        type="number"
                        value={roommatePrefs.ageRangeMax || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "roommate",
                            "ageRangeMax",
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Max"
                        min="18"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Additional Preferences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Additional Preferences
                </h3>

                {/* Personality Traits */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Personality Traits
                  </label>
                  <p className="text-sm text-stone-500 mb-3">
                    Add words that describe your personality
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {additional.personality.map((trait, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1"
                      >
                        {trait}
                        <button
                          type="button"
                          onClick={() => {
                            setAdditional((prev) => ({
                              ...prev,
                              personality: prev.personality.filter(
                                (_, i) => i !== index
                              ),
                            }));
                            setHasChanges(true);
                          }}
                          className="ml-1 hover:text-purple-900"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Type and press Enter to add"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        setAdditional((prev) => ({
                          ...prev,
                          personality: [
                            ...prev.personality,
                            e.currentTarget.value.trim(),
                          ],
                        }));
                        e.currentTarget.value = "";
                        setHasChanges(true);
                      }
                    }}
                  />
                </div>

                {/* Deal Breakers */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Deal Breakers
                  </label>
                  <p className="text-sm text-stone-500 mb-3">
                    Things you absolutely cannot live with
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {additional.dealBreakers.map((breaker, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1"
                      >
                        {breaker}
                        <button
                          type="button"
                          onClick={() => {
                            setAdditional((prev) => ({
                              ...prev,
                              dealBreakers: prev.dealBreakers.filter(
                                (_, i) => i !== index
                              ),
                            }));
                            setHasChanges(true);
                          }}
                          className="ml-1 hover:text-red-900"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Type and press Enter to add"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        setAdditional((prev) => ({
                          ...prev,
                          dealBreakers: [
                            ...prev.dealBreakers,
                            e.currentTarget.value.trim(),
                          ],
                        }));
                        e.currentTarget.value = "";
                        setHasChanges(true);
                      }
                    }}
                  />
                </div>

                {/* Shared Interests */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Things You'd Like to Share
                  </label>
                  <p className="text-sm text-stone-500 mb-3">
                    Activities or interests you'd enjoy doing with roommates
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {additional.sharedInterests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => {
                            setAdditional((prev) => ({
                              ...prev,
                              sharedInterests: prev.sharedInterests.filter(
                                (_, i) => i !== index
                              ),
                            }));
                            setHasChanges(true);
                          }}
                          className="ml-1 hover:text-green-900"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Type and press Enter to add"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        setAdditional((prev) => ({
                          ...prev,
                          sharedInterests: [
                            ...prev.sharedInterests,
                            e.currentTarget.value.trim(),
                          ],
                        }));
                        e.currentTarget.value = "";
                        setHasChanges(true);
                      }
                    }}
                  />
                </div>

                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Additional Information
                  </label>
                  <textarea
                    value={additional.additionalInfo}
                    onChange={(e) => {
                      setAdditional((prev) => ({
                        ...prev,
                        additionalInfo: e.target.value,
                      }));
                      setHasChanges(true);
                    }}
                    rows={4}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Anything else you'd like potential roommates to know..."
                  />
                </div>
              </motion.div>

              {/* Emergency Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Emergency Contact
                </h3>
                <p className="text-sm text-stone-500 mb-4">
                  This information will only be shared with your confirmed
                  roommates
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={emergencyContact.name}
                      onChange={(e) => {
                        setEmergencyContact((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={emergencyContact.phone}
                      onChange={(e) => {
                        setEmergencyContact((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }));
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="+52 123 456 7890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Relationship
                    </label>
                    <select
                      value={emergencyContact.relation}
                      onChange={(e) => {
                        setEmergencyContact((prev) => ({
                          ...prev,
                          relation: e.target.value,
                        }));
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select relationship</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="friend">Friend</option>
                      <option value="guardian">Guardian</option>
                      <option value="partner">Partner</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Privacy Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Privacy Settings
                </h3>
                <p className="text-sm text-stone-500 mb-4">
                  Control who can see different parts of your profile
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={privacy.profileVisibleTo}
                      onChange={(e) => {
                        setPrivacy((prev) => ({
                          ...prev,
                          profileVisibleTo: e.target.value,
                        }));
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="matches_only">Matches Only</option>
                      <option value="nobody">Nobody (Hidden)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Contact Information Visibility
                    </label>
                    <select
                      value={privacy.contactVisibleTo}
                      onChange={(e) => {
                        setPrivacy((prev) => ({
                          ...prev,
                          contactVisibleTo: e.target.value,
                        }));
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="matches_only">Matches Only</option>
                      <option value="nobody">
                        Nobody (Request to Connect)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Images Visibility
                    </label>
                    <select
                      value={privacy.imagesVisibleTo}
                      onChange={(e) => {
                        setPrivacy((prev) => ({
                          ...prev,
                          imagesVisibleTo: e.target.value,
                        }));
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="matches_only">Matches Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Preview Tab
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Remove the bg-white and padding since the enhanced preview has its own styling */}
              <div className="mb-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm text-primary-800">
                  This is how your profile appears to other students. Make sure
                  everything looks good before saving!
                </p>
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
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
