// frontend/src/app/(main)/roommates/profile/complete/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import RoommateProfileForm from "@/components/roommates/RoommateProfileForm ";
import { motion } from "framer-motion";
import { UserGroupIcon } from "@heroicons/react/24/outline";

export default function CompleteProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/roommates/profile/complete");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-stone-50 to-primary-50/20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Only students need roommate profiles
  if (user?.userType !== "student") {
    router.push("/dashboard");
    return null;
  }

  const handleComplete = () => {
    // Navigate back to roommates page after completion
    router.push("/roommates");
  };

  const handleSkip = () => {
    // Navigate back to roommates page if they skip
    router.push("/roommates");
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-primary-50/20 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-xl">
                <UserGroupIcon className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-stone-900 mb-3">
              Let's Find Your Perfect Roommate
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Take a few minutes to tell us about yourself. The more complete your profile, 
              the better matches we can find for you!
            </p>
          </motion.div>
          
          <RoommateProfileForm
            onComplete={handleComplete}
            onSkip={handleSkip}
          />
        </div>
      </div>
    </MainLayout>
  );
}