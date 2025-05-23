"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Only check authentication after loading is complete
    if (!isLoading) {
      setHasCheckedAuth(true);
      
      // Redirect if not authenticated
      if (!isAuthenticated) {
        router.push('/login?redirect=/dashboard');
        return;
      }
      
      // If authenticated but no user data yet, wait a bit more
      if (isAuthenticated && !user) {
        console.log('Authenticated but no user data yet, waiting...');
        // Don't redirect immediately, give it time to load user data
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading while authentication is being checked
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show loading if authenticated but user data not loaded yet
  if (isAuthenticated && !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Updated to use camelCase consistently
  if (!isAuthenticated || (user && user.userType !== 'property_owner')) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Fixed-width sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="fixed w-64 h-full">
          <DashboardSidebar />
        </div>
      </div>
      
      {/* Main content with left margin to account for sidebar */}
      <div className="flex-1 pl-0">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}