// frontend/src/app/(auth)/forgot-password/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import apiService from '@/lib/api';
import { validation } from '@/utils/validation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validateEmail = (email: string) => {
    const result = validation.email(email);
    setEmailError(result.isValid ? null : result.error || null);
    return result.isValid;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Clear previous errors
    setError(null);
    if (emailError && newEmail) {
      validateEmail(newEmail);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submission
    if (!validateEmail(email)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiService.auth.requestPasswordReset({ email });
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Password reset request failed:', err);
      setError(
        err.response?.data?.detail || 
        'Failed to send reset email. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto my-16 px-4">
          <div className="bg-surface p-8 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-50 mb-4">
                <svg
                  className="h-6 w-6 text-success-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-stone-900 mb-4">
                Check Your Email
              </h2>
              
              <p className="text-stone-600 mb-6">
                If an account with <strong>{email}</strong> exists, we've sent you a password reset link.
              </p>
              
              <div className="bg-info-50 border-l-4 border-info-400 p-4 mb-6 text-left">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-info-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-info-700">
                      <strong>Next steps:</strong>
                      <br />1. Check your email inbox
                      <br />2. Click the reset link (expires in 1 hour)
                      <br />3. Create your new password
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-stone-500 mb-6">
                Didn't receive an email? Check your spam folder or try again.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 font-medium"
                >
                  Try Different Email
                </button>
                
                <Link
                  href="/login"
                  className="block w-full text-center py-2 px-4 border border-stone-200 text-stone-700 rounded-md hover:bg-stone-50 font-medium"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-surface p-8 rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-stone-900">
              Reset Your Password
            </h2>
            <p className="mt-2 text-center text-sm text-stone-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && isMounted && (
            <div className="bg-error-50 border-l-4 border-error-400 p-4 mt-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-error-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  emailError ? 'border-error-300' : 'border-stone-200'
                }`}
                placeholder="Enter your email address"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => email && validateEmail(email)}
              />
              {emailError && (
                <p className="mt-1 text-sm text-error-600">{emailError}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !isMounted || !!emailError}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending Reset Link...' : 'Send Reset Link'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}