// frontend/src/components/profile/AccountSettings.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { toast } from 'react-hot-toast';
import { formatters } from '@/utils/formatters';

interface AccountInfo {
  emailVerified: boolean;
  studentIdVerified: boolean;
  verificationStatus: boolean;
  accountCreated: string;
  lastLogin: string;
  userType: string;
  username: string;
  email: string;
}

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionPassword, setActionPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadAccountInfo = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.auth.getAccountSettings();
        setAccountInfo(response.data);
      } catch (error) {
        console.error('Failed to load account settings:', error);
        toast.error('Failed to load account information');
      } finally {
        setIsLoading(false);
      }
    };

    loadAccountInfo();
  }, []);

    const handleDeactivateAccount = async () => {
    if (!actionPassword) {
        toast.error('Please enter your password');
        return;
    }

    try {
        setIsProcessing(true);
        // Fixed: Pass object with password property
        await apiService.auth.deactivateAccount({ password: actionPassword });
        
        toast.success('Account deactivated successfully');
        logout();
        router.push('/');
    } catch (error: any) {
        console.error('Failed to deactivate account:', error);
        const errorMessage = error.response?.data?.error || 'Failed to deactivate account';
        toast.error(errorMessage);
    } finally {
        setIsProcessing(false);
        setShowDeactivateModal(false);
        setActionPassword('');
    }
    };

    const handleDeleteAccount = async () => {
    if (!actionPassword || deleteConfirmation !== 'DELETE') {
        toast.error('Please enter your password and type DELETE to confirm');
        return;
    }

    try {
        setIsProcessing(true);
        // Fixed: Pass object with password and confirmation properties
        await apiService.auth.deleteAccount({ 
        password: actionPassword,
        confirmation: deleteConfirmation 
        });
        
        toast.success('Account deleted permanently');
        logout();
        router.push('/');
    } catch (error: any) {
        console.error('Failed to delete account:', error);
        const errorMessage = error.response?.data?.error || 'Failed to delete account';
        toast.error(errorMessage);
    } finally {
        setIsProcessing(false);
        setShowDeleteModal(false);
        setActionPassword('');
        setDeleteConfirmation('');
    }
    };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-stone-900">Account Settings</h3>
        <p className="mt-1 text-sm text-stone-600">
          View your account information and manage account settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <div className="bg-surface border border-stone-100 rounded-lg p-6">
          <h4 className="text-lg font-medium text-stone-900 mb-4">Account Information</h4>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-stone-500">Username</dt>
              <dd className="mt-1 text-sm text-stone-900">{accountInfo?.username}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-stone-500">Email</dt>
              <dd className="mt-1 text-sm text-stone-900">{accountInfo?.email}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-stone-500">Account Type</dt>
              <dd className="mt-1 text-sm text-stone-900 capitalize">
                {accountInfo?.userType?.replace('_', ' ')}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-stone-500">Member Since</dt>
              <dd className="mt-1 text-sm text-stone-900">
                {accountInfo?.accountCreated && formatters.date.standard(accountInfo.accountCreated)}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-stone-500">Last Login</dt>
              <dd className="mt-1 text-sm text-stone-900">
                {accountInfo?.lastLogin 
                  ? formatters.date.dateTime(accountInfo.lastLogin)
                  : 'Never'
                }
              </dd>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-surface border border-stone-100 rounded-lg p-6">
          <h4 className="text-lg font-medium text-stone-900 mb-4">Verification Status</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Email Verified</span>
              <VerificationBadge isVerified={accountInfo?.emailVerified || false} />
            </div>
            
            {user?.userType === 'student' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Student ID Verified</span>
                <VerificationBadge isVerified={accountInfo?.studentIdVerified || false} />
              </div>
            )}
            
            {user?.userType === 'property_owner' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Business Verified</span>
                <VerificationBadge isVerified={accountInfo?.verificationStatus || false} />
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-error-50 border border-red-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h4>
          <p className="text-sm text-error-700 mb-4">
            These actions are permanent and cannot be undone. Please proceed with caution.
          </p>
          
          <div className="space-y-4">
            {/* Deactivate Account */}
            <div className="flex items-center justify-between py-3 border-b border-red-200">
              <div>
                <h5 className="text-sm font-medium text-red-900">Deactivate Account</h5>
                <p className="text-sm text-error-700">
                  Temporarily disable your account. You can reactivate it later by contacting support.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                className="ml-4 px-4 py-2 border border-error-300 rounded-md text-sm font-medium text-error-700 bg-surface hover:bg-error-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500"
              >
                Deactivate
              </button>
            </div>

            {/* Delete Account */}
            <div className="flex items-center justify-between py-3">
              <div>
                <h5 className="text-sm font-medium text-red-900">Delete Account</h5>
                <p className="text-sm text-error-700">
                  Permanently delete your account and all associated data. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="ml-4 px-4 py-2 border border-error-600 rounded-md text-sm font-medium text-white bg-error-600 hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivate Account Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-surface">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-error-50 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-error-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-stone-900">Deactivate Account</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-stone-500">
                    Are you sure you want to deactivate your account? You can reactivate it later by contacting support.
                  </p>
                </div>
                <div className="mt-4">
                  <input
                    type="password"
                    placeholder="Enter your password to confirm"
                    value={actionPassword}
                    onChange={(e) => setActionPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowDeactivateModal(false);
                        setActionPassword('');
                      }}
                      className="px-4 py-2 bg-stone-500 text-white text-sm rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeactivateAccount}
                      disabled={isProcessing || !actionPassword}
                      className="px-4 py-2 bg-error-600 text-white text-sm rounded-md hover:bg-error-700 disabled:opacity-50"
                    >
                      {isProcessing ? 'Deactivating...' : 'Deactivate Account'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-surface">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-error-50 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-error-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-stone-900">Delete Account</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-stone-500">
                    This action cannot be undone. All your data will be permanently deleted.
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={actionPassword}
                    onChange={(e) => setActionPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-error-500 focus:border-error-500"
                  />
                  <input
                    type="text"
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-error-500 focus:border-error-500"
                  />
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setActionPassword('');
                        setDeleteConfirmation('');
                      }}
                      className="px-4 py-2 bg-stone-500 text-white text-sm rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isProcessing || !actionPassword || deleteConfirmation !== 'DELETE'}
                      className="px-4 py-2 bg-error-600 text-white text-sm rounded-md hover:bg-error-700 disabled:opacity-50"
                    >
                      {isProcessing ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Verification Badge Component
function VerificationBadge({ isVerified }: { isVerified: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isVerified 
        ? 'bg-success-50 text-success-600' 
        : 'bg-error-50 text-error-600'
    }`}>
      {isVerified ? (
        <>
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Verified
        </>
      ) : (
        <>
          <XCircleIcon className="w-4 h-4 mr-1" />
          Not Verified
        </>
      )}
    </span>
  );
}

// Icon components
function ExclamationTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}