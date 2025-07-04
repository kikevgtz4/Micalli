// frontend/src/components/profile/AccountSettings.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { toast } from 'react-hot-toast';
import { formatters } from '@/utils/formatters';
import {
  InformationCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

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
  const { user } = useAuth();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-stone-900">Account Settings</h3>
        <p className="mt-1 text-sm text-stone-600">
          View your account information and verification status.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-lg font-medium text-stone-900 mb-6 flex items-center">
            <UserCircleIcon className="w-5 h-5 mr-2 text-primary-500" />
            Account Information
          </h4>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-stone-500">Username</dt>
              <dd className="text-base text-stone-900 font-medium">{accountInfo?.username}</dd>
            </div>
            
            <div className="space-y-1">
              <dt className="text-sm font-medium text-stone-500">Email</dt>
              <dd className="text-base text-stone-900">{accountInfo?.email}</dd>
            </div>
            
            <div className="space-y-1">
              <dt className="text-sm font-medium text-stone-500">Account Type</dt>
              <dd className="text-base text-stone-900">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                  {accountInfo?.userType === 'student' ? '🎓 Student' : '🏢 Property Owner'}
                </span>
              </dd>
            </div>
            
            <div className="space-y-1">
              <dt className="text-sm font-medium text-stone-500">Member Since</dt>
              <dd className="text-base text-stone-900 flex items-center">
                <ClockIcon className="w-4 h-4 mr-1.5 text-stone-400" />
                {accountInfo?.accountCreated && formatters.date.standard(accountInfo.accountCreated)}
              </dd>
            </div>
            
            <div className="space-y-1">
              <dt className="text-sm font-medium text-stone-500">Last Login</dt>
              <dd className="text-base text-stone-900">
                {accountInfo?.lastLogin 
                  ? formatters.date.dateTime(accountInfo.lastLogin)
                  : 'Never'
                }
              </dd>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-lg font-medium text-stone-900 mb-6 flex items-center">
            <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary-500" />
            Verification Status
          </h4>
          
          <div className="space-y-4">
            <VerificationItem
              label="Email Verified"
              isVerified={accountInfo?.emailVerified || false}
              description="Verify your email to access all features"
            />
            
            {user?.userType === 'student' && (
              <VerificationItem
                label="Student ID Verified"
                isVerified={accountInfo?.studentIdVerified || false}
                description="Verify your student status for enhanced trust"
              />
            )}
            
            {user?.userType === 'property_owner' && (
              <VerificationItem
                label="Business Verified"
                isVerified={accountInfo?.verificationStatus || false}
                description="Verify your business for increased credibility"
              />
            )}
          </div>
        </div>

        {/* Account Security Tips */}
        <div className="bg-gradient-to-br from-primary-50 to-teal-50 border border-primary-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-lg font-medium text-primary-900">Security Tips</h4>
              <div className="mt-2 text-sm text-primary-700">
                <ul className="list-disc list-inside space-y-1.5">
                  <li>Use a strong, unique password for your account</li>
                  <li>Enable email verification for added security</li>
                  <li>Keep your contact information up to date</li>
                  <li>Review your account activity regularly</li>
                  <li>Never share your login credentials with others</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
          <h4 className="text-lg font-medium text-stone-900 mb-3">Need Help?</h4>
          <p className="text-sm text-stone-600 mb-4">
            If you need to make changes to your account that aren't available here, or if you're experiencing any issues, our support team is here to help.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:support@unihousing.com"
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/help"
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-colors"
            >
              Visit Help Center
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Verification Item Component
function VerificationItem({ 
  label, 
  isVerified, 
  description 
}: { 
  label: string; 
  isVerified: boolean; 
  description: string;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-stone-100 last:border-0">
      <div className="flex-1">
        <div className="flex items-center">
          <span className="text-sm font-medium text-stone-900">{label}</span>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">{description}</p>
      </div>
      <div className="ml-4">
        {isVerified ? (
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-1.5" />
            <span className="text-sm font-medium text-green-700">Verified</span>
          </div>
        ) : (
          <div className="flex items-center">
            <XCircleIcon className="w-5 h-5 text-stone-400 mr-1.5" />
            <span className="text-sm font-medium text-stone-500">Not Verified</span>
          </div>
        )}
      </div>
    </div>
  );
}