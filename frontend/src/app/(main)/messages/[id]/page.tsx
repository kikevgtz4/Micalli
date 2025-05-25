// src/app/(main)/messages/[id]/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import ConversationDetail from '@/components/messaging/ConversationDetail';

export default function ConversationPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = parseInt(params.id as string);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=/messages/${params.id}`);
    }
  }, [isAuthenticated, isLoading, router, params.id]);

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

  if (isNaN(conversationId)) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-500">
            <p>Invalid conversation ID</p>
            <button
              onClick={() => router.push('/messages')}
              className="mt-4 text-primary-600 hover:text-primary-700 transition-colors"
            >
              Back to all conversations
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-stone-50 py-10 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-surface rounded-lg shadow-md overflow-hidden">
            <ConversationDetail conversationId={conversationId} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}