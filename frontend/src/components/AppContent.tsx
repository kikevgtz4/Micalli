"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading while client-side JS is loading or authentication is being checked
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}