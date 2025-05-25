'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import apiService from '@/lib/api';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await apiService.auth.verifyEmail({ token });
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);
      } catch (err: any) {
        setError(err.response?.data?.token?.[0] || 'Verification failed. The link may be invalid or expired.');
        setIsVerifying(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, router]);

  if (isVerifying && !isSuccess && !error) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto my-16 px-4">
          <div className="bg-surface p-8 rounded-lg shadow-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-stone-600">Verifying your email...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isSuccess) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto my-16 px-4">
          <div className="bg-surface p-8 rounded-lg shadow-md text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-50 mb-4">
              <svg className="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Email Verified!</h2>
            <p className="text-stone-600 mb-4">Your email has been successfully verified.</p>
            <p className="text-sm text-stone-500">Redirecting to login...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-surface p-8 rounded-lg shadow-md text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-50 mb-4">
            <svg className="h-6 w-6 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Verification Failed</h2>
          <p className="text-stone-600 mb-6">{error}</p>
          <Link
            href="/resend-verification"
            className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
          >
            Resend Verification Email
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}