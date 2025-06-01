"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import apiService from "@/lib/api";
import { RoommateProfile, CompatibilityResult } from "@/types/api";

export default function RoommateProfilePage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<RoommateProfile | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/roommates/profile/${id}`);
      return;
    }

    const loadProfile = async () => {
      try {
        // Load profile
        const profileResponse = await apiService.roommates.getProfile(Number(id));
        setProfile(profileResponse.data);

        // Load compatibility if viewing someone else's profile
        if (user?.id !== profileResponse.data.user.id) {
          const compatResponse = await apiService.roommates.getCompatibility(Number(id));
          setCompatibility(compatResponse.data);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        router.push("/roommates");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [id, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return null;
  }

  // Render full profile view with compatibility score
  return (
    <MainLayout>
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Add your profile display UI here */}
          <h1>Profile of {profile.user.firstName} {profile.user.lastName}</h1>
          {compatibility && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-lg font-semibold">
                Compatibility Score: {compatibility.compatibilityScore}%
              </p>
            </div>
          )}
          {/* Add rest of profile display */}
        </div>
      </div>
    </MainLayout>
  );
}