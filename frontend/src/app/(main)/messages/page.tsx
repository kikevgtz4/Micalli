// src/app/(main)/messages/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import ConversationsList from '@/components/messaging/ConversationsList';

export default function MessagesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/messages');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center p-12">Loading...</div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 py-10 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Messages</h1>
            <p className="mt-2 text-lg text-gray-600">
              Communicate with property owners and potential roommates
            </p>
          </div>
          <ConversationsList />
        </div>
      </div>
    </MainLayout>
  );
}