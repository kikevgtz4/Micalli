// frontend/src/app/(auth)/reset-password/[uid]/[token]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import apiService from '@/lib/api';
import { validation, validatePasswordConfirmation } from '@/utils/validation';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid as string;
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        await apiService.auth.validateResetToken({ uid, token });
        setIsTokenValid(true);
      } catch (err: any) {
        console.error('Token validation failed:', err);
        setIsTokenValid(false);
        setError('This password reset link is invalid or has expired.');
      }
    };

    if (uid && token) {
      validateToken();
    } else {
      setIsTokenValid(false);
      setError('Invalid password reset link.');
    }
  }, [uid, token]);

  const validatePassword = (password: string) => {
    const result = validation.password(password);
    setPasswordError(result.isValid ? null : result.error || null);
    return result.isValid;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    const result = validatePasswordConfirmation(password, confirmPassword);
    setConfirmError(result.isValid ? null : result.error || null);
    return result.isValid;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setError(null);
    
    if (passwordError && newPassword) {
      validatePassword(newPassword);
    }
    
    // Re-validate confirm password if it exists
    if (confirmPassword) {
      validateConfirmPassword(newPassword, confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    setError(null);
    
    if (confirmError && newConfirmPassword) {
      validateConfirmPassword(password, newConfirmPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate both passwords
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(password, confirmPassword);
    
    if (!isPasswordValid || !isConfirmValid) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiService.auth.confirmPasswordReset({
        uid,
        token,
        new_password: password,
      });
      
      setIsComplete(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?password_reset=success');
      }, 3000);
      
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.error ||
        'Failed to reset password. Please try again or request a new reset link.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while validating token
  if (isTokenValid === null) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto my-16 px-4">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating reset link...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Invalid token state
  if (isTokenValid === false) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto my-16 px-4">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Reset Link
            </h2>
            
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Reset links are only valid for 1 hour.
            </p>
            
            <div className="space-y-3">
              <Link
                href="/forgot-password"
                className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-medium"
              >
                Request New Reset Link
              </Link>
              
              <Link
                href="/login"
                className="block w-full text-center py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Success state
  if (isComplete) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto my-16 px-4">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Password Reset Complete
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              Redirecting to sign in page in 3 seconds...
            </p>
            
            <Link
              href="/login"
              className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-medium"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Main reset form
  return (
    <MainLayout>
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Set New Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Choose a strong password for your account.
            </p>
          </div>

          {error && isMounted && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    passwordError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => password && validatePassword(password)}
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, and number.
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    confirmError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={() => confirmPassword && validateConfirmPassword(password, confirmPassword)}
                />
                {confirmError && (
                  <p className="mt-1 text-sm text-red-600">{confirmError}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !isMounted || !!passwordError || !!confirmError}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
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