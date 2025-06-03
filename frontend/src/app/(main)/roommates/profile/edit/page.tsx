// frontend/src/app/(main)/roommates/profile/edit/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import RoommateProfileForm from "@/components/roommates/RoommateProfileForm ";
import apiService from "@/lib/api";
import { RoommateProfile } from "@/types/api";
import { RoommateProfileFormData } from "@/types/roommates";
import { motion } from "framer-motion";
import { UserGroupIcon } from "@heroicons/react/24/outline";

export default function EditProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [existingProfile, setExistingProfile] = useState<RoommateProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

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
          setExistingProfile(response.data);
        } catch (error) {
          console.error("Failed to load profile:", error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();
  }, [isAuthenticated, user]);

  if (isLoading || profileLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-stone-50 to-primary-50/20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated || user?.userType !== "student") {
    router.push("/");
    return null;
  }

  const handleComplete = () => {
    router.push("/roommates");
  };

  const handleSkip = () => {
    router.push("/roommates");
  };

  // Transform RoommateProfile to form data
  const getFormDataFromProfile = (profile: RoommateProfile | null): Partial<RoommateProfileFormData> | undefined => {
    if (!profile) return undefined;
    
    // Extract only the fields that belong to RoommateProfileFormData
    const {
      // Exclude these fields
      id,
      user,
      createdAt,
      updatedAt,
      university,
      // Include the rest
      ...formData
    } = profile;
    
    return formData;
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br pt-23 from-stone-50 via-white to-primary-50/20 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <RoommateProfileForm
            initialData={getFormDataFromProfile(existingProfile)}
            profileId={existingProfile?.id}
            onComplete={handleComplete}
            onSkip={handleSkip}
            isEditing={true}
          />
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}