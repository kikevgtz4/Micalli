"use client";
import { useEffect } from 'react';
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

  useEffect(() => {
    // Redirect if not authenticated or not a property owner
    if (!isLoading && (!isAuthenticated || user?.user_type !== 'property_owner')) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not authenticated or not a property owner, don't render anything
  // while redirecting to login
  if (!isAuthenticated || user?.user_type !== 'property_owner') {
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