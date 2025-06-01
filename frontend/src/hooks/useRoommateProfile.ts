// frontend/src/hooks/useRoommateProfile.ts
import apiService from '@/lib/api';
import { RoommateProfile } from '@/types/api';
import { useState, useCallback } from 'react';

export function useRoommateProfile() {
  const [profile, setProfile] = useState<RoommateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState(0);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.roommates.getMyProfile();
      setProfile(response.data);
      // Calculate completion client-side as backup
      const calculated = calculateProfileCompletion(response.data);
      setCompletion(calculated);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
      if (err.response?.status === 404) {
        setProfile(null);
        setCompletion(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { profile, isLoading, error, completion, loadProfile, setProfile };
}

const calculateProfileCompletion = (profile: any): number => {
    // Same calculation logic as in the wizard
    const requiredFields = [
      'university', 'major', 'year', 'sleepSchedule', 
      'cleanliness', 'noiseTolerance', 'guestPolicy'
    ];
    
    const completed = requiredFields.filter(field => profile[field]).length;
    return (completed / requiredFields.length) * 100;
  };