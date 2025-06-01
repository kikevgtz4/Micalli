"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProfileCompletionWizard from "@/components/roommates/ProfileCompletionWizard";
import apiService from "@/lib/api";

export default function EditProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [existingProfile, setExistingProfile] = useState(null);
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
        <div className="flex justify-center items-center min-h-screen">
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-8">
            Edit Your Roommate Profile
          </h1>
          <ProfileCompletionWizard
            initialData={existingProfile}
            onComplete={handleComplete}
            onSkip={handleSkip}
            isEditing={true}
          />
        </div>
      </div>
    </MainLayout>
  );
}