// frontend/src/app/(main)/profile/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import ProfileInformation from '@/components/profile/ProfileInformation';
import PasswordChange from '@/components/profile/PasswordChange';
import AccountSettings from '@/components/profile/AccountSettings';
import SubleaseDashboard from '@/components/profile/SubleaseDashboard';
import apiService from '@/lib/api';
import { Property } from '@/types/api'; 
import { getImageUrl } from '@/utils/imageUrls';
import { formatters } from '@/utils/formatters';
import { toast } from 'react-hot-toast';
import { validateFile } from '@/utils/validation';
import {
  UserIcon,
  LockClosedIcon,
  Cog6ToothIcon,
  CheckBadgeIcon,
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  PencilIcon,
  CameraIcon,
  KeyIcon, // For subleases
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

// Updated tabs array - Dashboard is FIRST for students
const getTabsForUser = (userType: string | undefined) => {
  const commonTabs = [
    { id: 'profile', name: 'Profile Information', icon: UserIcon },
    { id: 'security', name: 'Security', icon: LockClosedIcon },
    { id: 'settings', name: 'Account Settings', icon: Cog6ToothIcon },
  ];

  if (userType === 'student') {
    // Add Dashboard as the first tab for students
    return [
      { id: 'dashboard', name: 'My Subleases', icon: KeyIcon },
      ...commonTabs
    ];
  }

  return commonTabs;
};

interface ProfileStats {
  profileCompletion: number;
  verificationStatus: {
    email: boolean;
    studentId?: boolean;
    business?: boolean;
  };
  // Student specific
  roommateProfileExists?: boolean;
  matchCount?: number;
  // Sublease specific (NEW)
  hasActiveSublease?: boolean;
  subleaseApplicationsCount?: number;
  subleaseSavedCount?: number;
  subleaseViewsCount?: number;
  // Property owner specific
  propertyCount?: number;
  activeListings?: number;
  totalViews?: number;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<string>('profile');
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
  const router = useRouter();
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get tabs based on user type
  const tabs = getTabsForUser(user?.userType);

  // Set default tab to dashboard for students
  useEffect(() => {
    if (user?.userType === 'student' && activeTab === 'profile') {
      setActiveTab('dashboard');
    }
  }, [user?.userType]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [isAuthenticated, isLoading, router]);

  // Add this useEffect to handle hash navigation
  useEffect(() => {
    // Check for hash in URL to auto-select tab
    if (window.location.hash === '#dashboard' && user?.userType === 'student') {
      setActiveTab('dashboard');
    }
  }, [user]);

  // Load profile stats - UPDATED to include sublease stats
  useEffect(() => {
    const loadProfileStats = async () => {
      if (!user) return;
      
      try {
        setStatsLoading(true);
        
        // Calculate profile completion
        let totalFields = 0;
        let completedFields = 0;
        
        // Basic profile fields
        const basicFields = ['firstName', 'lastName', 'dateOfBirth'];
        totalFields += basicFields.length;
        basicFields.forEach(field => {
          if (user[field as keyof typeof user]) completedFields++;
        });
        
        if (user.userType === 'student') {
          // Student fields
          const studentFields = ['university', 'graduationYear', 'program'];
          totalFields += studentFields.length;
          studentFields.forEach(field => {
            if (user[field as keyof typeof user]) completedFields++;
          });
          
          // Check roommate profile
          let roommateExists = false;
          let matchCount = 0;
          try {
            const roommateResponse = await apiService.roommates.getMyProfile();
            const matchesResponse = await apiService.roommates.getMatches();
            
            // Add roommate profile fields to total
            totalFields += 5; // Core roommate fields
            if (roommateResponse.data) {
              completedFields += 5; // If profile exists, count as complete
              roommateExists = true;
            }
            matchCount = matchesResponse.data?.results?.length || 0;
          } catch (error: any) {
            // Roommate profile doesn't exist
          }

          // NEW: Load sublease stats
          let hasActiveSublease = false;
          let subleaseApplicationsCount = 0;
          let subleaseSavedCount = 0;
          let subleaseViewsCount = 0;

          try {
            const subleaseResponse = await apiService.subleases.getMySubleases();
            const activeSubleases = subleaseResponse.data.results.filter(
              (s: any) => s.status === 'active'
            );
            
            if (activeSubleases.length > 0) {
              hasActiveSublease = true;
              const activeSublease = activeSubleases[0];
              
              // Get detailed stats for the active sublease
              const detailResponse = await apiService.subleases.getById(activeSublease.id);
              subleaseViewsCount = detailResponse.data.viewsCount || 0;
              subleaseSavedCount = detailResponse.data.savedCount || 0;
              
              // Get applications/inquiries count
              try {
                const applicationsResponse = await apiService.subleases.getApplications(activeSublease.id);
                subleaseApplicationsCount = applicationsResponse.data.count || 0;
              } catch (error) {
                // Applications endpoint might not exist yet
                subleaseApplicationsCount = 0;
              }
            }
          } catch (error) {
            console.error('Failed to load sublease stats:', error);
          }
            
          setProfileStats({
            profileCompletion: Math.round((completedFields / totalFields) * 100),
            verificationStatus: {
              email: user.emailVerified || false,
              studentId: user.studentIdVerified || false,
            },
            roommateProfileExists: roommateExists,
            matchCount: matchCount,
            hasActiveSublease,
            subleaseApplicationsCount,
            subleaseSavedCount,
            subleaseViewsCount,
          });
        } else if (user.userType === 'property_owner') {
          // Property owner stats (unchanged)
          const ownerFields = ['businessName'];
          totalFields += ownerFields.length;
          
          if (user.emailVerified) completedFields++;
          
          try {
            const propertiesResponse = await apiService.properties.getOwnerProperties();
            const properties: Property[] = propertiesResponse.data?.results || [];
            const activeListings = properties.filter((p: Property) => p.isActive).length;
            
            setProfileStats({
              profileCompletion: Math.round((completedFields / totalFields) * 100),
              verificationStatus: {
                email: user.emailVerified || false,
              },
              propertyCount: properties.length,
              activeListings,
            });
          } catch (error) {
            console.error('Failed to load property stats:', error);
            setProfileStats({
              profileCompletion: Math.round((completedFields / totalFields) * 100),
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

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, 5, [
      "image/jpeg",
      "image/png",
      "image/gif",
    ]);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    try {
      setIsUploadingPicture(true);

      const formData = new FormData();
      formData.append("profile_picture", file);

      const response = await apiService.auth.uploadProfilePicture(formData);
      const profilePictureUrl = response.data.profilePicture;

      // Update auth context
      await updateProfile({ profilePicture: profilePictureUrl });

      toast.success("Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Upload failed:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.profilePicture?.[0] ||
        "Failed to upload profile picture";
      toast.error(errorMessage);
    } finally {
      setIsUploadingPicture(false);
    }
  };

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Unified Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-12">
            {/* Profile Header - Solid Color */}
            <div className="bg-primary-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">
                  My Profile
                </h1>
                {/* Completion Badge */}
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <ChartBarIcon className="w-5 h-5 text-white mr-2" />
                  <span className="text-white font-semibold">
                    {profileStats?.profileCompletion || 0}% Complete
                  </span>
                </div>
              </div>
            </div>
            
            {/* Profile Overview Section */}
            <div className="p-8 border-b border-stone-100">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Picture and Basic Info */}
                <div className="flex items-start gap-6">
                  {/* Profile Picture with Edit Button */}
                  <div className="relative group">
                    {user.profilePicture ? (
                      <img
                        src={getImageUrl(user.profilePicture)}
                        alt={user.firstName}
                        className="w-28 h-28 rounded-2xl object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-2xl bg-stone-100 flex items-center justify-center shadow-lg">
                        <UserIcon className="w-14 h-14 text-stone-400" />
                      </div>
                    )}
                    
                    {/* Edit Overlay */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPicture}
                      className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      {isUploadingPicture ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <div className="text-white text-center">
                          <CameraIcon className="w-8 h-8 mx-auto mb-1" />
                          <span className="text-xs">Change Photo</span>
                        </div>
                      )}
                    </button>
                    
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                    
                    {/* Pencil Icon */}
                    <div className="absolute -bottom-2 -right-2 bg-primary-600 rounded-full p-1.5 shadow-md">
                      <PencilIcon className="w-4 h-4 text-white" />
                    </div>
                    
                    {profileStats && profileStats.profileCompletion >= 90 && (
                      <div className="absolute -top-2 -left-2 bg-green-500 rounded-full p-1 shadow-md">
                        <CheckBadgeIcon className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-stone-900">
                      {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-stone-600 mt-1">{user.email}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-stone-600">
                      {age && (
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4 text-stone-400" />
                          {age} years old
                        </span>
                      )}
                      {user.userType === 'student' && user.university && (
                        <span className="flex items-center gap-1.5">
                          <AcademicCapIcon className="w-4 h-4 text-stone-400" />
                          {user.university.name}
                        </span>
                      )}
                      {user.userType === 'property_owner' && (
                        <span className="flex items-center gap-1.5">
                          <BuildingOfficeIcon className="w-4 h-4 text-stone-400" />
                          Property Owner
                        </span>
                      )}
                    </div>
                    
                    {/* Verification Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {profileStats?.verificationStatus.email && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          <CheckBadgeIcon className="w-3.5 h-3.5 mr-1" />
                          Email Verified
                        </span>
                      )}
                      {user.userType === 'student' && profileStats?.verificationStatus.studentId && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          <CheckBadgeIcon className="w-3.5 h-3.5 mr-1" />
                          Student Verified
                        </span>
                      )}
                      {user.userType === 'property_owner' && profileStats?.verificationStatus.business && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          <CheckBadgeIcon className="w-3.5 h-3.5 mr-1" />
                          Business Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Student-specific stats - UPDATED */}
                    {user.userType === 'student' && (
                      <>
                        {/* Sublease Card - Primary focus */}
                        <div className={`rounded-xl p-4 border ${
                          profileStats?.hasActiveSublease
                            ? 'bg-green-50 border-green-200'
                            : 'bg-stone-50 border-stone-200'
                        }`}>
                          <div className="text-sm font-medium text-stone-600">Sublease</div>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-stone-900">
                              {profileStats?.hasActiveSublease ? 'Active' : 'None'}
                            </span>
                            {profileStats?.hasActiveSublease && (
                              <span className="text-xs text-green-600">
                                {profileStats?.subleaseViewsCount || 0} views
                              </span>
                            )}
                          </div>
                          <Link
                            href={profileStats?.hasActiveSublease ? "#" : "/subleases/create"}
                            onClick={(e) => {
                              if (profileStats?.hasActiveSublease) {
                                e.preventDefault();
                                setActiveTab('dashboard');
                              }
                            }}
                            className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            {profileStats?.hasActiveSublease ? 'Manage →' : 'Create Sublease →'}
                          </Link>
                        </div>

                        {/* Applications/Interest */}
                        {profileStats?.hasActiveSublease && (
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <div className="text-sm font-medium text-blue-700">Applications</div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="text-2xl font-bold text-blue-900">
                                {profileStats?.subleaseApplicationsCount || 0}
                              </span>
                              <span className="text-xs text-blue-600">
                                {profileStats?.subleaseSavedCount || 0} saved
                              </span>
                            </div>
                            <button
                              onClick={() => setActiveTab('dashboard')}
                              className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                              View All →
                            </button>
                          </div>
                        )}

                        {/* Roommate Profile */}
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                          <div className="text-sm font-medium text-stone-600">Roommate Profile</div>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-stone-900">
                              {profileStats?.roommateProfileExists ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <Link
                            href={profileStats?.roommateProfileExists ? "/roommates/profile/edit" : "/roommates/profile/create"}
                            className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            {profileStats?.roommateProfileExists ? 'Edit Profile' : 'Create Profile'} →
                          </Link>
                        </div>
                        
                        {/* Matches */}
                        <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                          <div className="text-sm font-medium text-primary-700">Matches</div>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-primary-900">
                              {profileStats?.matchCount || 0}
                            </span>
                          </div>
                          <Link
                            href="/roommates"
                            className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            View Matches →
                          </Link>
                        </div>
                      </>
                    )}
                    
                    {/* Property owner stats (unchanged) */}
                    {user.userType === 'property_owner' && (
                      <>
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                          <div className="text-sm font-medium text-stone-600">Properties</div>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-stone-900">
                              {profileStats?.propertyCount || 0}
                            </span>
                            <span className="text-xs text-stone-500">
                              {profileStats?.activeListings || 0} active
                            </span>
                          </div>
                          <Link
                            href="/dashboard"
                            className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            Manage →
                          </Link>
                        </div>
                        
                        <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                          <div className="text-sm font-medium text-primary-700">Total Views</div>
                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-2xl font-bold text-primary-900">
                              {profileStats?.totalViews || 0}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Quick Actions - UPDATED */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.userType === 'student' && (
                      <>
                        <Link
                          href="/properties"
                          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
                        >
                          <HomeIcon className="w-4 h-4 mr-1.5" />
                          Browse
                        </Link>
                        <Link
                          href="/roommates"
                          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
                        >
                          <UserGroupIcon className="w-4 h-4 mr-1.5" />
                          Roommates
                        </Link>
                        <Link
                          href="/subleases"
                          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
                        >
                          <KeyIcon className="w-4 h-4 mr-1.5" />
                          Subleases
                        </Link>
                      </>
                    )}
                    {user.userType === 'property_owner' && (
                      <>
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
                        >
                          <HomeIcon className="w-4 h-4 mr-1.5" />
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/properties/new"
                          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
                        >
                          <HomeIcon className="w-4 h-4 mr-1.5" />
                          Add Property
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-stone-100 bg-stone-50/50">
              <nav className="flex space-x-1 px-8" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600 bg-white/70'
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
            <div className="p-8 bg-white">
              {activeTab === 'dashboard' && user.userType === 'student' && <SubleaseDashboard />}
              {activeTab === 'profile' && <ProfileInformation />}
              {activeTab === 'security' && <PasswordChange />}
              {activeTab === 'settings' && <AccountSettings />}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}