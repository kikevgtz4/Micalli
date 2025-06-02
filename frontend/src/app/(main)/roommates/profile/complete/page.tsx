"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import RoommateProfileFormfrom "@/components/roommates/RoommateProfileForm ";

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
        <div className="flex justify-center items-center min-h-screen">
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
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <RoommateProfileForm
            onComplete={handleComplete}
            onSkip={handleSkip}
          />
        </div>
      </div>
    </MainLayout>
  );
}