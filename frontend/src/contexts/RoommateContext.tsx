// frontend/src/contexts/RoommateContext.tsx
"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import apiService from '@/lib/api';
import { RoommateProfile } from '@/types/api';
import { RoommateProfileFormData } from '@/types/roommates';  // Add this import
import { toast } from 'react-hot-toast';

interface RoommateContextType {
  profile: RoommateProfile | null;
  completion: number;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: Partial<RoommateProfileFormData>) => Promise<void>;  // Change type here
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const RoommateContext = createContext<RoommateContextType | undefined>(undefined);

export function RoommateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<RoommateProfile | null>(null);
  const [completion, setCompletion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateCompletion = useCallback((profile: RoommateProfile): number => {
    const fields = [
      'sleepSchedule', 'cleanliness', 'noiseTolerance', 'guestPolicy',
      'studyHabits', 'major', 'year', 'bio', 'petFriendly', 'smokingAllowed',
      'hobbies', 'socialActivities', 'dietaryRestrictions', 'languages',
      'preferredRoommateGender', 'ageRangeMin', 'ageRangeMax', 'university'
    ];

    const completed = fields.filter((field) => {
      const value = profile[field as keyof RoommateProfile];
      
      if (field === 'petFriendly' || field === 'smokingAllowed') {
        return value !== null && value !== undefined;
      }
      
      if (Array.isArray(value)) {
        return field === 'dietaryRestrictions' ? value !== null && value !== undefined : value.length > 0;
      }
      
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      
      return value !== null && value !== undefined;
    }).length;

    return Math.round((completed / fields.length) * 100);
  }, []);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.roommates.getMyProfile();
      setProfile(response.data);
      setCompletion(response.data.profileCompletionPercentage || calculateCompletion(response.data));
    } catch (err: any) {
      if (err.response?.status === 404) {
        setProfile(null);
        setCompletion(0);
      } else {
        setError('Failed to load profile');
        toast.error('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  }, [calculateCompletion]);

  // Change parameter type and use correct API method
  const updateProfile = useCallback(async (data: Partial<RoommateProfileFormData>) => {
    try {
      const response = await apiService.roommates.createOrUpdateProfile(data);
      setProfile(response.data);
      setCompletion(response.data.profileCompletionPercentage || calculateCompletion(response.data));
      toast.success('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile');
      toast.error('Failed to update profile');
      throw err;
    }
  }, [calculateCompletion]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <RoommateContext.Provider value={{
      profile,
      completion,
      isLoading,
      error,
      updateProfile,
      refreshProfile,
      clearError
    }}>
      {children}
    </RoommateContext.Provider>
  );
}

export function useRoommate() {
  const context = useContext(RoommateContext);
  if (!context) {
    throw new Error('useRoommate must be used within RoommateProvider');
  }
  return context;
}