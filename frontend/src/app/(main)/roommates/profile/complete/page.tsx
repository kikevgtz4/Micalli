// frontend/src/app/(main)/roommates/profile/complete/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import RoommateProfileForm from "@/components/roommates/RoommateProfileForm ";
import apiService from "@/lib/api";
import { motion } from "framer-motion";

export default function CompleteProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/roommates/profile/complete");
    }
  }, [isAuthenticated, isLoading, router]);

  // Check if user already has a profile
  useEffect(() => {
    const checkProfile = async () => {
      if (isAuthenticated && user?.userType === "student") {
        try {
          const response = await apiService.roommates.getMyProfile();
          if (response.data) {
            // User already has a profile, redirect to edit page
            setHasExistingProfile(true);
            router.push("/roommates/profile/edit");
          }
        } catch (error: any) {
          if (error.isNotFound) {
            // No profile exists, continue with creation
            setCheckingProfile(false);
          } else {
            console.error("Error checking profile:", error);
            setCheckingProfile(false);
          }
        }
      }
    };

    checkProfile();
  }, [isAuthenticated, user, router]);

  if (isLoading || checkingProfile) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-stone-50 to-primary-50/20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated || hasExistingProfile) {
    return null;
  }

  // Only students need roommate profiles
  if (user?.userType !== "student") {
    router.push("/dashboard");
    return null;
  }

  const handleComplete = () => {
    // Navigate to roommates page after completion
    router.push("/roommates");
  };

  const handleSkip = () => {
    // Navigate back to roommates page if they skip
    router.push("/roommates");
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
              onComplete={handleComplete}
              onSkip={handleSkip}
              isEditing={false}
            />
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}