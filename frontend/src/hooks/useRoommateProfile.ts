// frontend/src/hooks/useRoommateProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { RoommateProfile } from '@/types/api';
import { AxiosError } from 'axios';
import { OnboardingStatusResponse } from '@/types/roommates';

export function useRoommateProfile() {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<RoommateProfile | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkOnboardingStatus = useCallback(async () => {
    if (!isAuthenticated || user?.userType !== 'student') {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.roommates.getOnboardingStatus();
      setOnboardingStatus(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setError('Failed to check profile status');
      return null;
    }
  }, [isAuthenticated, user]);

  const loadProfile = useCallback(async () => {
    try {
      const response = await apiService.roommates.getMyProfile();
      setProfile(response.data);
      return response.data; // Return the fetched profile
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status !== 404) {
        setError('Failed to load profile');
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await checkOnboardingStatus();
      await loadProfile();
      setIsLoading(false);
    };

    if (isAuthenticated) {
      init();
    }
  }, [isAuthenticated, checkOnboardingStatus, loadProfile]);

  return {
    profile,
    onboardingStatus,
    isLoading,
    error,
    refetch: {
      profile: loadProfile,
      onboardingStatus: checkOnboardingStatus,
    }
  };
}