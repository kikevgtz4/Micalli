"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  propertyCount: number;
  activeViewingRequests: number;
  unreadMessages: number;
}

interface RecentActivity {
  id: number;
  type: 'message' | 'viewing_request' | 'property_view';
  content: string;
  date: string;
  link: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    propertyCount: 0,
    activeViewingRequests: 0,
    unreadMessages: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // For now, we'll simulate this data
        // In a real implementation, you'd call an API endpoint
        const fetchedStats = {
          propertyCount: 3,
          activeViewingRequests: 5,
          unreadMessages: 2,
        };
        
        const fetchedActivity = [
          {
            id: 1,
            type: 'message' as const,
            content: 'New message from Ana Martinez',
            date: '2025-05-15T14:30:00Z',
            link: '/dashboard/messages/1',
          },
          {
            id: 2,
            type: 'viewing_request' as const,
            content: 'Viewing request for Modern Apartment',
            date: '2025-05-14T10:15:00Z',
            link: '/dashboard/viewing-requests/2',
          },
          {
            id: 3,
            type: 'property_view' as const,
            content: 'Your property "Studio near UANL" was viewed 15 times today',
            date: '2025-05-14T23:45:00Z',
            link: '/dashboard/properties/3',
          },
        ];
        
        setStats(fetchedStats);
        setRecentActivity(fetchedActivity);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-8">Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium text-stone-700 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-lg shadow-sm border border-stone-100">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-primary-50 text-primary-600 mr-4">
                <BuildingIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-500">My Properties</p>
                <p className="text-2xl font-semibold text-stone-900">{stats.propertyCount}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/properties"
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                View all →
              </Link>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-lg shadow-sm border border-stone-100">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-success-50 text-success-600 mr-4">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-500">Viewing Requests</p>
                <p className="text-2xl font-semibold text-stone-900">{stats.activeViewingRequests}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/viewing-requests"
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                View all →
              </Link>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-lg shadow-sm border border-stone-100">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-warning-50 text-warning-600 mr-4">
                <ChatIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-500">Unread Messages</p>
                <p className="text-2xl font-semibold text-stone-900">{stats.unreadMessages}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/messages"
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                View all →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-stone-700">Recent Activity</h2>
          <Link
            href="/dashboard/list-property"
            className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            + Add New Property
          </Link>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-stone-100 overflow-hidden">
          <ul className="divide-y divide-stone-100">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <li key={activity.id}>
                  <Link href={activity.link} className="block hover:bg-stone-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-md mr-4 ${
                          activity.type === 'message' 
                            ? 'bg-info-50 text-info-600' 
                            : activity.type === 'viewing_request' 
                            ? 'bg-success-50 text-success-600' 
                            : 'bg-purple-50 text-purple-600'
                        }`}>
                          {activity.type === 'message' ? (
                            <ChatIcon className="h-5 w-5" />
                          ) : activity.type === 'viewing_request' ? (
                            <CalendarIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">{activity.content}</p>
                        </div>
                      </div>
                      <div className="text-xs text-stone-500">
                        {formatDate(activity.date)}
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-stone-500">
                No recent activity
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Icon for Property Views
function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

// Reusing the icons from the sidebar
function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}