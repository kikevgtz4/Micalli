"use client";
import QuickProfileSetup from '@/components/roommates/QuickProfileSetup';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated or not a student
    if (!isAuthenticated || user?.userType !== 'student') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  return <QuickProfileSetup />;
}