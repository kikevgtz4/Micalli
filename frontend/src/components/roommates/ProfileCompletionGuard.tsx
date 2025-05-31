// frontend/src/components/roommates/ProfileCompletionGuard.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/api';

export default function ProfileCompletionGuard({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const response = await apiService.roommates.getMyProfile();
      const completion = calculateProfileCompletion(response.data);
      
      if (completion < 50) {
        router.push('/roommates/profile/complete');
      } else {
        setProfileExists(true);
      }
    } catch (error) {
      // Profile doesn't exist, redirect to creation
      router.push('/roommates/profile/complete');
    } finally {
      setIsChecking(false);
    }
  };

  const calculateProfileCompletion = (profile: any): number => {
    // Same calculation logic as in the wizard
    const requiredFields = [
      'university', 'major', 'year', 'sleepSchedule', 
      'cleanliness', 'noiseTolerance', 'guestPolicy'
    ];
    
    const completed = requiredFields.filter(field => profile[field]).length;
    return (completed / requiredFields.length) * 100;
  };

  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return profileExists ? <>{children}</> : null;
}