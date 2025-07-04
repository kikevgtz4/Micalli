// frontend/src/contexts/RoommateContext.tsx
"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import apiService from '@/lib/api';
import { RoommateProfile } from '@/types/api';
import { RoommateProfileFormData } from '@/types/roommates';
import { toast } from 'react-hot-toast';

interface RoommateContextType {
  profile: RoommateProfile | null;
  completion: number;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: Partial<RoommateProfileFormData>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const RoommateContext = createContext<RoommateContextType | undefined>(undefined);

export function RoommateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<RoommateProfile | null>(null);
  const [completion, setCompletion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.roommates.getMyProfile();
      setProfile(response.data);
      // Use nullish coalescing to handle undefined
      const completionPercentage = response.data.profileCompletionPercentage ?? 0;
      setCompletion(completionPercentage);
    } catch (err: any) {
      if (err.response?.status === 404 || err.isNotFound) {
        setProfile(null);
        setCompletion(0);
      } else {
        setError('Failed to load profile');
        toast.error('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<RoommateProfileFormData>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      // Use separate create/update methods based on whether profile exists
      if (profile?.id) {
        // UPDATE existing profile
        response = await apiService.roommates.updateProfile(profile.id, data);
      } else {
        // CREATE new profile
        response = await apiService.roommates.createProfile(data);
      }
      
      setProfile(response.data);
      
      // Handle optional profileCompletionPercentage safely
      const completionPercentage = response.data.profileCompletionPercentage ?? 0;
      setCompletion(completionPercentage);
      
      // Enhanced success messages based on completion
      if (completionPercentage >= 80) {
        toast.success('🎉 Profile updated! You have full access to all features.');
      } else if (completionPercentage >= 60) {
        toast.success(`Profile updated! ${Math.round(completionPercentage)}% complete.`);
      } else {
        toast.success('Profile saved! Complete the core 5 fields to unlock matching.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

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