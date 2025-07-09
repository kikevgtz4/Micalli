// frontend/src/app/(dashboard)/dashboard/messages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";
import { formatters } from "@/utils/formatters";
import PropertyImage from "@/components/common/PropertyImage";
import { withRole } from "@/contexts/AuthContext";
import {
  ChatBubbleLeftRightIcon,
  BuildingOfficeIcon,
  ClockIcon,
  FunnelIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import type { Conversation } from "@/types/api";

function PropertyOwnerMessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [properties, setProperties] = useState<Array<{ id: number; title: string }>>([]);

  // Stats for the dashboard
  const [stats, setStats] = useState({
    totalInquiries: 0,
    pendingResponses: 0,
    averageResponseTime: "N/A",
    todayInquiries: 0,
  });

  useEffect(() => {
    fetchData();
  }, [selectedProperty, statusFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch conversations with filters
      const params: any = {
        type: 'property_inquiry', // Only show property inquiries for owners
      };
      
      if (selectedProperty !== 'all') {
        params.property = selectedProperty;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const [conversationsRes, propertiesRes] = await Promise.all([
        apiService.messaging.getConversations(params),
        apiService.properties.getOwnerProperties(),
      ]);

      setConversations(conversationsRes.data);
      setProperties(propertiesRes.data.map((p: any) => ({ id: p.id, title: p.title })));
      
      // Calculate stats
      calculateStats(conversationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (convs: Conversation[]) => {
    const today = new Date().toDateString();
    const pending = convs.filter(c => c.status === 'pending_response').length;
    const todayCount = convs.filter(c => 
      new Date(c.createdAt).toDateString() === today
    ).length;

    setStats({
      totalInquiries: convs.length,
      pendingResponses: pending,
      averageResponseTime: "2 hours", // TODO: Calculate from actual data
      todayInquiries: todayCount,
    });
  };

  const handleConversationClick = (conversationId: number) => {
    router.push(`/dashboard/messages/${conversationId}`);
  };

  const getPriorityIcon = (conversation: Conversation) => {
    if (conversation.status === 'pending_response') {
      const hoursSinceCreated = (Date.now() - new Date(conversation.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreated > 24) {
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      } else if (hoursSinceCreated > 12) {
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Property Inquiries</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Inquiries</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalInquiries}</p>
              </div>
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Pending Responses</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingResponses}</p>
              </div>
              <BellIcon className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.averageResponseTime}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Today's Inquiries</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.todayInquiries}</p>
              </div>
              <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-neutral-500" />
            <span className="font-medium text-neutral-700">Filter by:</span>
          </div>
          
          {/* Property Filter */}
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="rounded-md border-neutral-300 text-sm"
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.title}
              </option>
            ))}
          </select>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-neutral-300 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending_response">Pending Response</option>
            <option value="active">Active</option>
            <option value="application_submitted">Application Submitted</option>
            <option value="booking_confirmed">Booking Confirmed</option>
          </select>
        </div>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            No inquiries yet
          </h3>
          <p className="text-neutral-600">
            Property inquiries will appear here when students contact you.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-neutral-200">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className="hover:bg-neutral-50 transition-colors cursor-pointer p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Property Image */}
                  {conversation.propertyDetails?.mainImage && (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                      <PropertyImage
                        image={conversation.propertyDetails.mainImage}
                        alt={conversation.propertyDetails.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Conversation Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">
                          {conversation.otherParticipant?.name || 
                           conversation.otherParticipant?.firstName || 
                           conversation.otherParticipant?.username}
                        </h3>
                        {getPriorityIcon(conversation)}
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs text-neutral-500">
                          {formatters.date.relative(conversation.updatedAt)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] px-1 bg-primary-500 text-white text-xs rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Property Info */}
                    <p className="text-sm text-neutral-600 mb-1">
                      <BuildingOfficeIcon className="inline h-4 w-4 mr-1" />
                      {conversation.propertyDetails?.title} • ${formatters.number(conversation.propertyDetails?.rentAmount || 0)}/month
                    </p>
                    
                    {/* Latest Message */}
                    {conversation.latestMessage && (
                      <p className={`text-sm truncate ${
                        conversation.latestMessage.read || conversation.latestMessage.sender === user?.id
                          ? 'text-neutral-500'
                          : 'text-neutral-900 font-medium'
                      }`}>
                        {conversation.latestMessage.sender === user?.id && "You: "}
                        {conversation.latestMessage.content}
                      </p>
                    )}
                    
                    {/* Status Badge */}
                    <div className="mt-2">
                      {conversation.status === 'pending_response' && (
                        <span className="inline-flex items-center text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Awaiting your response
                        </span>
                      )}
                      {conversation.status === 'booking_confirmed' && (
                        <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Booking confirmed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Protect this page for property owners only
export default withRole(['property_owner'])(PropertyOwnerMessagesPage);