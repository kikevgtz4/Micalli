import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/api';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface OnboardingCheckProps {
  children: React.ReactNode;
  onStatusLoaded?: (status: any) => void;
}

export default function OnboardingCheck({ children, onStatusLoaded }: OnboardingCheckProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldOnboard, setShouldOnboard] = useState(false);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await apiService.roommates.getOnboardingStatus();
      const data = response.data;
      
      setStatus(data);
      
      // If user has no profile or hasn't completed core fields
      if (!data.hasProfile || !data.onboardingCompleted) {
        setShouldOnboard(true);
      }
      
      if (onStatusLoaded) {
        onStatusLoaded(data);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <SparklesIcon className="w-12 h-12 text-primary-500" />
        </motion.div>
      </div>
    );
  }

  if (shouldOnboard && status?.completionStatus?.missingCoreFields?.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-10 h-10 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              Complete Your Profile
            </h2>
            <p className="text-stone-600">
              Answer 5 quick questions to start finding your perfect roommate match!
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4">
              <p className="text-sm font-medium text-stone-700">
                ⏱️ Takes only 60 seconds
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
              <p className="text-sm font-medium text-stone-700">
                🎯 Get instant match results
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/roommates/onboarding')}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Start Quick Setup
          </button>

          <button
            onClick={() => setShouldOnboard(false)}
            className="mt-4 text-stone-500 hover:text-stone-700 text-sm"
          >
            Browse without profile
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}