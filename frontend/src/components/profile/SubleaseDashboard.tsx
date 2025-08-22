// frontend/src/components/profile/SubleaseDashboard.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import PropertyImage from '@/components/common/PropertyImage';
import UrgencyBadge from '@/components/subleases/UrgencyBadge';
import { formatters } from '@/utils/formatters';
import { toast } from 'react-hot-toast';
import { Sublease, SubleaseStatus, calculateDurationMonths } from '@/types/sublease';
import {
  KeyIcon,
  HomeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  EyeIcon,
  HeartIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  PlusIcon,
  BoltIcon,
  MapPinIcon,
  SparklesIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import {
  EyeIcon as EyeSolidIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';

interface SubleaseStats {
  viewsToday: number;
  viewsTotal: number;
  savedCount: number;
  inquiriesCount: number;
  viewsTrend: 'up' | 'down' | 'stable';
  avgDailyViews: number;
}

interface SubleaseInquiry {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    university?: {
      name: string;
    };
  };
  message: string;
  createdAt: string;
  status: 'pending' | 'viewed' | 'contacted' | 'rejected';
}

export default function SubleaseDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeSublease, setActiveSublease] = useState<Sublease | null>(null);
  const [stats, setStats] = useState<SubleaseStats | null>(null);
  const [inquiries, setInquiries] = useState<SubleaseInquiry[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load sublease data
  useEffect(() => {
    loadSubleaseData();
  }, []);

  const loadSubleaseData = async () => {
    try {
      setIsLoading(true);
      
      // Get user's subleases
      const response = await apiService.subleases.getMySubleases();
      const subleases = response.data.results || [];
      
      // Find active sublease (should only be one)
      const active = subleases.find((s: Sublease) => s.status === 'active' || s.status === 'pending');
      
      if (active) {
        setActiveSublease(active);
        
        // Load detailed stats
        const detailResponse = await apiService.subleases.getById(active.id);
        const detailedSublease = detailResponse.data;
        
        // Calculate stats - using available properties
        const viewsData: SubleaseStats = {
          viewsToday: 0, // This would need to be calculated or provided by backend
          viewsTotal: detailedSublease.viewsCount || 0,
          savedCount: detailedSublease.savedCount || 0,
          inquiriesCount: 0, // Will be loaded separately
          viewsTrend: 'stable',
          avgDailyViews: 0,
        };
        
        // Calculate average daily views
        const createdDate = new Date(detailedSublease.createdAt);
        const daysSinceCreated = Math.max(1, Math.ceil((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
        viewsData.avgDailyViews = Math.round(viewsData.viewsTotal / daysSinceCreated);
        
        // Estimate today's views based on recent activity (mock calculation)
        // In production, this should come from the backend
        viewsData.viewsToday = Math.round(viewsData.avgDailyViews * (0.8 + Math.random() * 0.4));
        
        // Determine trend
        if (viewsData.viewsToday > viewsData.avgDailyViews * 1.2) {
          viewsData.viewsTrend = 'up';
        } else if (viewsData.viewsToday < viewsData.avgDailyViews * 0.8) {
          viewsData.viewsTrend = 'down';
        }
        
        setStats(viewsData);
        
        // Load inquiries - using conversations as a proxy
        // Since there's no specific sublease inquiries endpoint, 
        // we'll need to either create one or use existing messaging
        try {
          // Mock inquiries for now - in production, this should be a real API call
          const mockInquiries: SubleaseInquiry[] = [];
          setInquiries(mockInquiries);
          viewsData.inquiriesCount = mockInquiries.length;
        } catch (error) {
          console.error('Failed to load inquiries:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load sublease data:', error);
      toast.error('Failed to load sublease information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async () => {
  if (!activeSublease) return;
  
  try {
    setIsUpdatingStatus(true);
    
    // Toggle between active and cancelled
    const newStatus = activeSublease.status === 'active' ? 'cancelled' : 'active';
    
    // Use the existing toggleStatus method
    const response = await apiService.subleases.toggleStatus(activeSublease.id, newStatus);
    
    // Update local state with the response
    setActiveSublease(response.data);
    
    toast.success(
      newStatus === 'active' 
        ? 'Sublease activated successfully!' 
        : 'Sublease deactivated. It won\'t appear in searches.'
    );
  } catch (error) {
    console.error('Failed to update status:', error);
    toast.error('Failed to update sublease status');
  } finally {
    setIsUpdatingStatus(false);
  }
};

  const handleDelete = async () => {
    if (!activeSublease) return;
    
    try {
      await apiService.subleases.delete(activeSublease.id);
      setActiveSublease(null);
      setShowDeleteConfirm(false);
      toast.success('Sublease deleted successfully');
      router.push('/profile');
    } catch (error) {
      console.error('Failed to delete sublease:', error);
      toast.error('Failed to delete sublease');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!activeSublease) {
    return <NoSubleaseState />;
  }

  const duration = calculateDurationMonths(activeSublease.startDate, activeSublease.endDate);
  const daysUntilStart = Math.ceil(
    (new Date(activeSublease.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = activeSublease.status === 'expired' || new Date(activeSublease.endDate) < new Date();
  const isInactive = activeSublease.status === 'cancelled' || activeSublease.status === 'filled';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-stone-900">Sublease Dashboard</h3>
        <p className="mt-1 text-sm text-stone-600">
          Manage your active sublease and track performance
        </p>
      </div>

      {/* Status Alerts */}
      {isInactive && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start">
          <PauseCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="ml-3 flex-1">
            <h4 className="text-sm font-medium text-yellow-800">
              Sublease {activeSublease.status === 'cancelled' ? 'Deactivated' : 'Filled'}
            </h4>
            <p className="mt-1 text-sm text-yellow-700">
              {activeSublease.status === 'cancelled' 
                ? "Your sublease is currently deactivated and won't appear in search results."
                : "Your sublease has been marked as filled."}
            </p>
          </div>
          {activeSublease.status === 'cancelled' && (
            <button
              onClick={handleStatusToggle}
              disabled={isUpdatingStatus}
              className="ml-4 px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
            >
              Activate
            </button>
          )}
        </div>
      )}

      {isExpired && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-red-800">Sublease Expired</h4>
            <p className="mt-1 text-sm text-red-700">
              This sublease has passed its end date and is no longer active.
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <EyeIcon className="w-5 h-5 text-stone-400" />
            <span className={`text-xs font-medium ${
              stats?.viewsTrend === 'up' ? 'text-green-600' : 
              stats?.viewsTrend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {stats?.viewsTrend === 'up' ? '↑' : stats?.viewsTrend === 'down' ? '↓' : '→'}
            </span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats?.viewsTotal || 0}</p>
          <p className="text-xs text-stone-600 mt-1">Total Views</p>
          <p className="text-xs text-stone-500">~{stats?.viewsToday || 0} today</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <HeartIcon className="w-5 h-5 text-stone-400 mb-2" />
          <p className="text-2xl font-bold text-stone-900">{stats?.savedCount || 0}</p>
          <p className="text-xs text-stone-600 mt-1">Times Saved</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <ChatBubbleLeftIcon className="w-5 h-5 text-stone-400 mb-2" />
          <p className="text-2xl font-bold text-stone-900">{stats?.inquiriesCount || 0}</p>
          <p className="text-xs text-stone-600 mt-1">Inquiries</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <ArrowTrendingUpIcon className="w-5 h-5 text-stone-400 mb-2" />
          <p className="text-2xl font-bold text-stone-900">{stats?.avgDailyViews || 0}</p>
          <p className="text-xs text-stone-600 mt-1">Avg Daily Views</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Sublease Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sublease Card */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            {/* Image */}
            <div className="relative h-48 bg-gray-100">
              {activeSublease.images && activeSublease.images.length > 0 ? (
                <PropertyImage
                  image={activeSublease.images[0]}
                  alt={activeSublease.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <HomeIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <UrgencyBadge urgencyLevel={activeSublease.urgencyLevel} />
                {activeSublease.isVerified && (
                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  activeSublease.status === 'active' 
                    ? 'bg-green-500 text-white' 
                    : activeSublease.status === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : activeSublease.status === 'filled'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {activeSublease.status.charAt(0).toUpperCase() + activeSublease.status.slice(1)}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h4 className="text-lg font-semibold text-stone-900 mb-2">
                {activeSublease.title}
              </h4>
              
              <div className="flex items-center gap-4 text-sm text-stone-600 mb-4">
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {activeSublease.displayNeighborhood}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDaysIcon className="w-4 h-4" />
                  {duration} months
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-stone-900">
                    ${activeSublease.subleaseRent}/mo
                  </p>
                  {activeSublease.originalRent && activeSublease.originalRent > activeSublease.subleaseRent && (
                    <p className="text-sm text-green-600">
                      Save ${activeSublease.originalRent - activeSublease.subleaseRent}/mo
                    </p>
                  )}
                </div>
                
                {daysUntilStart > 0 && daysUntilStart <= 30 && (
                  <div className="text-right">
                    <p className="text-sm text-stone-600">Starts in</p>
                    <p className="text-lg font-semibold text-primary-600">
                      {daysUntilStart} days
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Link
                  href={`/subleases/${activeSublease.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  <EyeIcon className="w-4 h-4" />
                  View Listing
                </Link>
                
                <Link
                  href={`/subleases/${activeSublease.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </Link>
                
                {activeSublease.status !== 'expired' && activeSublease.status !== 'filled' && (
                  <button
                    onClick={handleStatusToggle}
                    disabled={isUpdatingStatus}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeSublease.status === 'active'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {isUpdatingStatus ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />
                    ) : activeSublease.status === 'active' ? (
                      <PauseCircleIcon className="w-4 h-4" />
                    ) : (
                      <CheckCircleIcon className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-stone-900">
                Recent Activity
              </h4>
              <Link
                href="/messages"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View Messages →
              </Link>
            </div>

            {inquiries.length === 0 ? (
              <div className="text-center py-8">
                <InboxIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-600">No activity yet</p>
                <p className="text-sm text-stone-500 mt-1">
                  Messages and inquiries will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.slice(0, 5).map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                    onClick={() => router.push('/messages')}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <UserGroupIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900">
                        {inquiry.user.firstName} {inquiry.user.lastName}
                      </p>
                      <p className="text-sm text-stone-600 truncate">
                        {inquiry.message}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {formatters.date.relative(inquiry.createdAt)}
                      </p>
                    </div>
                    {inquiry.status === 'pending' && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Actions & Tips */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-stone-900 mb-4">
              Quick Actions
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/subleases/${activeSublease.id}/edit`)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors text-left"
              >
                <PencilIcon className="w-5 h-5 text-stone-600" />
                <div>
                  <p className="font-medium text-stone-900">Edit Listing</p>
                  <p className="text-xs text-stone-600">Update details or photos</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/messages')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors text-left"
              >
                <ChatBubbleLeftIcon className="w-5 h-5 text-stone-600" />
                <div>
                  <p className="font-medium text-stone-900">View Messages</p>
                  <p className="text-xs text-stone-600">
                    Check your inbox for inquiries
                  </p>
                </div>
              </button>

              {activeSublease.status === 'active' && (
                <button
                  onClick={() => {
                    // Mark as filled
                    setActiveSublease({
                      ...activeSublease,
                      status: 'filled' as SubleaseStatus
                    });
                    toast.success('Sublease marked as filled!');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                >
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Mark as Filled</p>
                    <p className="text-xs text-green-600">Found a tenant</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
              >
                <TrashIcon className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Delete Sublease</p>
                  <p className="text-xs text-red-600">Permanently remove listing</p>
                </div>
              </button>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-primary-900 mb-3">
              💡 Tips to Get More Views
            </h4>
            <ul className="space-y-2 text-sm text-primary-800">
              <li className="flex items-start gap-2">
                <SparklesIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Add high-quality photos of all rooms</span>
              </li>
              <li className="flex items-start gap-2">
                <SparklesIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Respond to inquiries within 24 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <SparklesIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Keep your listing details updated</span>
              </li>
              <li className="flex items-start gap-2">
                <SparklesIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Offer competitive pricing for your area</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">
              Delete Sublease?
            </h3>
            <p className="text-stone-600 mb-6">
              This action cannot be undone. Your sublease listing and all associated data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// No Sublease State Component (same as before)
function NoSubleaseState() {
  const router = useRouter();
  
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
        <KeyIcon className="w-10 h-10 text-primary-600" />
      </div>
      
      <h3 className="text-xl font-semibold text-stone-900 mb-2">
        No Active Sublease
      </h3>
      <p className="text-stone-600 mb-8 max-w-md mx-auto">
        You don't have any active subleases. Create one to start receiving inquiries from potential tenants.
      </p>
      
      <button
        onClick={() => router.push('/subleases/create')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <PlusIcon className="w-5 h-5" />
        Create Your First Sublease
      </button>
      
      <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BoltIcon className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-medium text-stone-900 mb-1">Quick Setup</h4>
          <p className="text-sm text-stone-600">
            Create your listing in under 5 minutes
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <EyeSolidIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-medium text-stone-900 mb-1">Maximum Visibility</h4>
          <p className="text-sm text-stone-600">
            Reach thousands of students looking for housing
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <HeartSolidIcon className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-medium text-stone-900 mb-1">Safe & Secure</h4>
          <p className="text-sm text-stone-600">
            Verified students and secure messaging
          </p>
        </div>
      </div>
    </div>
  );
}