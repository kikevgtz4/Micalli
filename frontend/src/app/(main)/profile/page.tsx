// frontend/src/app/(main)/profile/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import ProfileInformation from '@/components/profile/ProfileInformation';
import PasswordChange from '@/components/profile/PasswordChange';
import ProfilePicture from '@/components/profile/ProfilePicture';
import AccountSettings from '@/components/profile/AccountSettings';
import apiService from '@/lib/api';
import { Property } from '@/types/api'; 
import { getImageUrl } from '@/utils/imageUrls';
import { formatters } from '@/utils/formatters';
import {
  UserIcon,
  LockClosedIcon,
  PhotoIcon,
  Cog6ToothIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const tabs = [
  { id: 'profile', name: 'Profile Information', icon: UserIcon },
  { id: 'security', name: 'Security', icon: LockClosedIcon },
  { id: 'picture', name: 'Profile Picture', icon: PhotoIcon },
  { id: 'settings', name: 'Account Settings', icon: Cog6ToothIcon },
];

interface ProfileStats {
  profileCompletion: number;
  verificationStatus: {
    email: boolean;
    studentId?: boolean;
    business?: boolean;
  };
  // Student specific
  roommateProfileCompletion?: number;
  matchCount?: number;
  // Property owner specific
  propertyCount?: number;
  activeListings?: number;
  totalViews?: number;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load profile stats
  useEffect(() => {
    const loadProfileStats = async () => {
      if (!user) return;
      
      try {
        setStatsLoading(true);
        
        // Calculate basic profile completion
        const requiredFields = ['firstName', 'lastName', 'dateOfBirth'];
        let completedFields = 0;
        
        if (user.firstName) completedFields++;
        if (user.lastName) completedFields++;
        if (user.dateOfBirth) completedFields++;
        
        if (user.userType === 'student') {
          requiredFields.push('university', 'graduationYear', 'program');
          if (user.university) completedFields++;
          if (user.graduationYear) completedFields++;
          if (user.program) completedFields++;
          
          // Load roommate profile stats
          try {
            const roommateResponse = await apiService.roommates.getMyProfile();
            const matchesResponse = await apiService.roommates.getMatches();
            
            setProfileStats({
              profileCompletion: Math.round((completedFields / requiredFields.length) * 100),
              verificationStatus: {
                email: user.emailVerified || false,
                studentId: user.studentIdVerified || false,
              },
              roommateProfileCompletion: roommateResponse.data?.completionPercentage || 0,
              matchCount: matchesResponse.data?.results?.length || 0,
            });
          } catch {
            // No roommate profile yet
            setProfileStats({
              profileCompletion: Math.round((completedFields / requiredFields.length) * 100),
              verificationStatus: {
                email: user.emailVerified || false,
                studentId: user.studentIdVerified || false,
              },
              roommateProfileCompletion: 0,
              matchCount: 0,
            });
          }
        } else if (user.userType === 'property_owner') {
  requiredFields.push('businessName');
  
  // Count completed fields for property owners
  if (user.email) completedFields++;
  
  // Load property stats
  try {
    const propertiesResponse = await apiService.properties.getOwnerProperties();
    
    // Properly type the properties array
    const properties: Property[] = propertiesResponse.data?.results || [];
    
    // Now TypeScript knows 'p' is of type Property
    const activeListings = properties.filter((p: Property) => p.isActive).length;
    
    setProfileStats({
      profileCompletion: Math.round((completedFields / requiredFields.length) * 100),
      verificationStatus: {
        email: user.emailVerified || false,
      },
      propertyCount: properties.length,
      activeListings,
      // Properly type the reduce parameters
      totalViews: properties.reduce((sum: number, p: Property) => sum + (0), 0),
    });
  } catch (error) {
    console.error('Failed to load property stats:', error);
    setProfileStats({
      profileCompletion: Math.round((completedFields / requiredFields.length) * 100),
      verificationStatus: {
        email: user.emailVerified || false,
        business: false,
      },
      propertyCount: 0,
      activeListings: 0,
      totalViews: 0,
    });
  }
}
      } catch (error) {
        console.error('Failed to load profile stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      loadProfileStats();
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <MainLayout>
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate age if date of birth exists
  const age = user.dateOfBirth 
    ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear()
    : null;

  return (
    <MainLayout>
      <div className="bg-stone-50 py-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Overview Section */}
          <div className="bg-white shadow rounded-lg mb-8 overflow-hidden mt-12">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Picture and Basic Info */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    {user.profilePicture ? (
                      <img
                        src={getImageUrl(user.profilePicture)}
                        alt={user.firstName}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-stone-200 flex items-center justify-center border-4 border-white shadow-lg">
                        <UserIcon className="w-12 h-12 text-stone-400" />
                      </div>
                    )}
                    {profileStats && profileStats.profileCompletion >= 90 && (
                      <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-8 h-8 text-green-500 bg-white rounded-full" />
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-900">
                      {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-stone-600">{user.email}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-stone-500">
                      {age && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {age} years old
                        </span>
                      )}
                      {user.userType === 'student' && user.university && (
                        <span className="flex items-center gap-1">
                          <AcademicCapIcon className="w-4 h-4" />
                          {user.university.name}
                        </span>
                      )}
                      {user.userType === 'property_owner' && (
                        <span className="flex items-center gap-1">
                          <BuildingOfficeIcon className="w-4 h-4" />
                          Property Owner
                        </span>
                      )}
                    </div>
                    
                    {/* Verification Badges */}
                    <div className="flex items-center gap-2 mt-3">
                      {profileStats?.verificationStatus.email && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckBadgeIcon className="w-3 h-3 mr-1" />
                          Email Verified
                        </span>
                      )}
                      {user.userType === 'student' && profileStats?.verificationStatus.studentId && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckBadgeIcon className="w-3 h-3 mr-1" />
                          Student Verified
                        </span>
                      )}
                      {user.userType === 'property_owner' && profileStats?.verificationStatus.business && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckBadgeIcon className="w-3 h-3 mr-1" />
                          Business Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Stats and Quick Actions */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Profile Completion */}
                  <div className="bg-stone-50 rounded-lg p-4">
                    <div className="text-sm text-stone-600">Profile Completion</div>
                    <div className="mt-1 flex items-baseline">
                      <span className="text-2xl font-semibold text-stone-900">
                        {profileStats?.profileCompletion || 0}%
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-stone-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (profileStats?.profileCompletion || 0) >= 90
                            ? 'bg-green-500'
                            : (profileStats?.profileCompletion || 0) >= 70
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${profileStats?.profileCompletion || 0}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Student-specific stats */}
                  {user.userType === 'student' && (
                    <>
                      <div className="bg-stone-50 rounded-lg p-4">
                        <div className="text-sm text-stone-600">Roommate Profile</div>
                        <div className="mt-1 flex items-baseline">
                          <span className="text-2xl font-semibold text-stone-900">
                            {profileStats?.roommateProfileCompletion || 0}%
                          </span>
                        </div>
                        <Link
                          href="/roommates/profile/edit"
                          className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                        >
                          {profileStats?.roommateProfileCompletion ? 'Edit Profile' : 'Create Profile'} →
                        </Link>
                      </div>
                      
                      <div className="bg-stone-50 rounded-lg p-4">
                        <div className="text-sm text-stone-600">Matches</div>
                        <div className="mt-1 flex items-baseline">
                          <span className="text-2xl font-semibold text-stone-900">
                            {profileStats?.matchCount || 0}
                          </span>
                        </div>
                        <Link
                          href="/roommates"
                          className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                        >
                          View Matches →
                        </Link>
                      </div>
                    </>
                  )}
                  
                  {/* Property owner stats */}
                  {user.userType === 'property_owner' && (
                    <>
                      <div className="bg-stone-50 rounded-lg p-4">
                        <div className="text-sm text-stone-600">Properties</div>
                        <div className="mt-1 flex items-baseline">
                          <span className="text-2xl font-semibold text-stone-900">
                            {profileStats?.propertyCount || 0}
                          </span>
                        </div>
                        <Link
                          href="/dashboard"
                          className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                        >
                          Manage Properties →
                        </Link>
                      </div>
                      
                      <div className="bg-stone-50 rounded-lg p-4">
                        <div className="text-sm text-stone-600">Active Listings</div>
                        <div className="mt-1 flex items-baseline">
                          <span className="text-2xl font-semibold text-stone-900">
                            {profileStats?.activeListings || 0}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-stone-50 rounded-lg p-4">
                        <div className="text-sm text-stone-600">Total Views</div>
                        <div className="mt-1 flex items-baseline">
                          <span className="text-2xl font-semibold text-stone-900">
                            {profileStats?.totalViews || 0}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                {user.userType === 'student' && (
                  <>
                    <Link
                      href="/properties"
                      className="inline-flex items-center px-4 py-2 border border-stone-300 rounded-md shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50"
                    >
                      <HomeIcon className="w-4 h-4 mr-2" />
                      Browse Properties
                    </Link>
                    <Link
                      href="/roommates"
                      className="inline-flex items-center px-4 py-2 border border-stone-300 rounded-md shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50"
                    >
                      <UserGroupIcon className="w-4 h-4 mr-2" />
                      Find Roommates
                    </Link>
                  </>
                )}
                {user.userType === 'property_owner' && (
                  <>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center px-4 py-2 border border-stone-300 rounded-md shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50"
                    >
                      <HomeIcon className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/properties/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <HomeIcon className="w-4 h-4 mr-2" />
                      Add New Property
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tab Section */}
          <div className="bg-white shadow rounded-lg">
            {/* Tab Navigation */}
            <div className="border-b border-stone-100">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'profile' && <ProfileInformation />}
              {activeTab === 'security' && <PasswordChange />}
              {activeTab === 'picture' && <ProfilePicture />}
              {activeTab === 'settings' && <AccountSettings />}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}