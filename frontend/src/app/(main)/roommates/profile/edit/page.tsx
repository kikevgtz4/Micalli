// frontend/src/app/(main)/roommates/profile/edit/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProfileImageUpload from "@/components/roommates/ProfileImageUpload";
import EnhancedProfilePreview from "@/components/roommates/EnhancedProfilePreview"; // Change from ProfilePreview

import ProfilePreview from "@/components/roommates/ProfilePreview";
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
  const previewProfile = useMemo(() => {
    if (!existingProfile || !user) {
      return null;
    }

    // Convert ImageData to RoommateProfileImage format for preview
    const previewImages: RoommateProfileImage[] = images
      .filter((img) => !img.isDeleted)
      .map((img, index) => ({
        id: img.serverId || 0,
        image: img.url || "",
        url: img.url || "",
        isPrimary: img.isPrimary,
        order: img.order,
        uploadedAt: new Date().toISOString(),
        isApproved: true,
      }));

    const preview: RoommateProfile = {
      ...existingProfile,
      user: {
        ...existingProfile.user,
        firstName: user.firstName || existingProfile.user.firstName,
        lastName: user.lastName || existingProfile.user.lastName,
      },
      bio: basicInfo.bio,
      age: existingProfile?.age || undefined, // Use age from existing profile (computed on backend)
      gender: basicInfo.gender as "male" | "female" | "other" | undefined,
      major: basicInfo.program,
      year: basicInfo.graduationYear
        ? new Date().getFullYear() - basicInfo.graduationYear + 4
        : undefined,
      graduationYear: basicInfo.graduationYear,
      sleepSchedule: basicInfo.sleepSchedule,
      cleanliness: lifestyle.cleanliness,
      noiseTolerance: lifestyle.noiseTolerance,
      guestPolicy: lifestyle.guestPolicy,
      studyHabits: lifestyle.studyHabits,
      workSchedule: lifestyle.workSchedule,
      petFriendly: preferences.petFriendly,
      smokingAllowed: preferences.smokingAllowed,
      dietaryRestrictions: preferences.dietaryRestrictions,
      languages: preferences.languages,
      hobbies: social.hobbies,
      socialActivities: social.socialActivities,
      preferredRoommateGender: roommatePrefs.preferredRoommateGender,
      ageRangeMin: roommatePrefs.ageRangeMin,
      ageRangeMax:
        roommatePrefs.ageRangeMax === null
          ? undefined
          : roommatePrefs.ageRangeMax,
      preferredRoommateCount: roommatePrefs.preferredRoommateCount,
      budgetMin: housing.budgetMin,
      budgetMax: housing.budgetMax,
      moveInDate: housing.moveInDate,
      leaseDuration: housing.leaseDuration,
      preferredLocations: housing.preferredLocations,
      housingType: housing.housingType,
      personality: additional.personality,
      dealBreakers: additional.dealBreakers,
      sharedInterests: additional.sharedInterests,
      additionalInfo: additional.additionalInfo,
      emergencyContactName: emergencyContact.name,
      emergencyContactPhone: emergencyContact.phone,
      emergencyContactRelation: emergencyContact.relation,
      profileVisibleTo: privacy.profileVisibleTo,
      contactVisibleTo: privacy.contactVisibleTo,
      imagesVisibleTo: privacy.imagesVisibleTo,
      images: previewImages,
      imageCount: previewImages.length,
    };

    return preview;
  }, [
    existingProfile,
    user,
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

    try {
      setIsSubmitting(true);
      setError(null);

      const profileData: Partial<RoommateProfileFormData> = {
        ...basicInfo,
        ...lifestyle,
        ...preferences,
        ...social,
        ...roommatePrefs,
        ...housing,
        ...additional,
        emergencyContactName: emergencyContact.name,
        emergencyContactPhone: emergencyContact.phone,
        emergencyContactRelation: emergencyContact.relation,
        ...privacy,
        university: user?.university?.id,
      };

      // Update profile
      const response = await apiService.roommates.createOrUpdateProfile(
        profileData
      );

      // Handle image uploads and deletions
      if (response.data.id) {
        // Upload new images
        const newImages = images.filter(
          (img) => !img.isExisting && !img.isDeleted && img.file
        );
        for (const imageData of newImages) {
          try {
            await apiService.roommates.uploadImage(
              response.data.id,
              imageData.file!
            );
          } catch (error) {
            console.error("Failed to upload image:", error);
          }
        }

        // Delete removed images
        const deletedImages = images.filter(
          (img) => img.isExisting && img.isDeleted && img.serverId
        );
        for (const imageData of deletedImages) {
          try {
            await apiService.roommates.deleteImage(
              response.data.id,
              imageData.serverId!
            );
          } catch (error) {
            console.error("Failed to delete image:", error);
          }
        }

        // Update primary image if changed
        const primaryImage = images.find(
          (img) => img.isPrimary && !img.isDeleted
        );
        if (primaryImage?.isExisting && primaryImage.serverId) {
          try {
            await apiService.roommates.setPrimaryImage(
              response.data.id,
              primaryImage.serverId
            );
          } catch (error) {
            console.error("Failed to set primary image:", error);
          }
        }
      }

      toast.success("Profile updated successfully!");
      setHasChanges(false);

      // Redirect to profile view
      router.push(`/roommates/profile/${existingProfile!.id}`);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setError("Failed to update profile. Please try again.");
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
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Additional Preferences
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Personality Traits
                    </label>
                    <input
                      type="text"
                      placeholder="Add personality traits (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          handleInputChange("additional", "personality", [
                            ...(additional.personality || []),
                            e.currentTarget.value.trim(),
                          ]);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-stone-500">
                      e.g., Outgoing, Organized, Laid-back, Studious
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {additional.personality?.map((trait, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 rounded-full text-sm text-purple-700"
                        >
                          {trait}
                          <button
                            type="button"
                            onClick={() =>
                              handleInputChange(
                                "additional",
                                "personality",
                                additional.personality?.filter(
                                  (_, i) => i !== index
                                ) || []
                              )
                            }
                            className="text-purple-500 hover:text-purple-700"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Deal Breakers
                    </label>
                    <input
                      type="text"
                      placeholder="Add deal breakers (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          handleInputChange("additional", "dealBreakers", [
                            ...(additional.dealBreakers || []),
                            e.currentTarget.value.trim(),
                          ]);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-stone-500">
                      Things you absolutely cannot tolerate in a living
                      situation
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {additional.dealBreakers?.map((dealBreaker, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 rounded-full text-sm text-red-700"
                        >
                          {dealBreaker}
                          <button
                            type="button"
                            onClick={() =>
                              handleInputChange(
                                "additional",
                                "dealBreakers",
                                additional.dealBreakers?.filter(
                                  (_, i) => i !== index
                                ) || []
                              )
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Shared Interests You're Looking For
                    </label>
                    <input
                      type="text"
                      placeholder="Add interests you'd like to share with roommates (press Enter)"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          handleInputChange("additional", "sharedInterests", [
                            ...(additional.sharedInterests || []),
                            e.currentTarget.value.trim(),
                          ]);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-stone-500">
                      Activities or interests you'd enjoy doing with roommates
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {additional.sharedInterests?.map((interest, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full text-sm text-green-700"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() =>
                              handleInputChange(
                                "additional",
                                "sharedInterests",
                                additional.sharedInterests?.filter(
                                  (_, i) => i !== index
                                ) || []
                              )
                            }
                            className="text-green-500 hover:text-green-700"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Additional Information
                    </label>
                    <textarea
                      value={additional.additionalInfo || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "additional",
                          "additionalInfo",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={4}
                      placeholder="Any other information you'd like potential roommates to know..."
                    />
                  </div>
                </div>
              </motion.div>

              {/* Emergency Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={emergencyContact.name || ""}
                      onChange={(e) =>
                        handleInputChange("emergency", "name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={emergencyContact.phone || ""}
                      onChange={(e) =>
                        handleInputChange("emergency", "phone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+52 123 456 7890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={emergencyContact.relation || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "emergency",
                          "relation",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., Parent, Sibling, Friend"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Privacy Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Privacy Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={privacy.profileVisibleTo || "everyone"}
                      onChange={(e) =>
                        handleInputChange(
                          "privacy",
                          "profileVisibleTo",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="verified_only">Verified Users Only</option>
                      <option value="university_only">
                        Same University Only
                      </option>
                    </select>
                    <p className="mt-1 text-xs text-stone-500">
                      Who can see your full profile
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Contact Information
                    </label>
                    <select
                      value={privacy.contactVisibleTo || "matches_only"}
                      onChange={(e) =>
                        handleInputChange(
                          "privacy",
                          "contactVisibleTo",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="matches_only">Matches Only</option>
                      <option value="connected_only">
                        Connected Users Only
                      </option>
                    </select>
                    <p className="mt-1 text-xs text-stone-500">
                      Who can see your contact details
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Profile Images
                    </label>
                    <select
                      value={privacy.imagesVisibleTo || "everyone"}
                      onChange={(e) =>
                        handleInputChange(
                          "privacy",
                          "imagesVisibleTo",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="matches_only">Matches Only</option>
                      <option value="connected_only">
                        Connected Users Only
                      </option>
                    </select>
                    <p className="mt-1 text-xs text-stone-500">
                      Who can see your profile photos
                    </p>
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
