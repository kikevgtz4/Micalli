// frontend/src/app/(dashboard)/dashboard/messages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";
import { formatters } from "@/utils/formatters";
import PropertyImage from "@/components/common/PropertyImage";
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import type { Conversation, Property } from "@/types/api";

type FilterStatus = "all" | "pending_response" | "active" | "archived";

export default function PropertyOwnerMessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [stats, setStats] = useState({
    totalInquiries: 0,
    pendingResponses: 0,
    averageResponseTime: "N/A",
    todayInquiries: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard/messages");
      return;
    }

    if (user?.userType !== "property_owner") {
      router.push("/messages");
      return;
    }

    fetchData();
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchConversations();
  }, [selectedProperty, statusFilter]);

  const fetchData = async () => {
    try {
      // Fetch owner's properties for filtering
      const propertiesResponse = await apiService.properties.getOwnerProperties();
      setProperties(propertiesResponse.data || []);
      
      await fetchConversations();
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    }
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      
      const params: Parameters<typeof apiService.messaging.getConversations>[0] = {
        type: "property_inquiry",
      };
      
      if (selectedProperty) {
        params.property = selectedProperty;
      }
      
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await apiService.messaging.getConversations(params);
      const conversationData = response.data.results || response.data;
      setConversations(Array.isArray(conversationData) ? conversationData : []);
      
      // Calculate stats
      calculateStats(conversationData);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (conversations: Conversation[]) => {
    const today = new Date().toDateString();
    const pending = conversations.filter(c => c.status === "pending_response").length;
    const todayCount = conversations.filter(c => 
      new Date(c.createdAt).toDateString() === today
    ).length;
    
    // Calculate average response time
    const withResponseTime = conversations.filter(c => c.ownerResponseTime);
    let avgResponseTime = "N/A";
    
    if (withResponseTime.length > 0) {
      // This would need proper duration parsing from backend format
      avgResponseTime = "2 hours"; // Placeholder - implement actual calculation
    }
    
    setStats({
      totalInquiries: conversations.length,
      pendingResponses: pending,
      averageResponseTime: avgResponseTime,
      todayInquiries: todayCount,
    });
  };

  const getPriorityIcon = (conversation: Conversation) => {
    if (conversation.status === "pending_response") {
      const hoursSinceCreated = (Date.now() - new Date(conversation.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreated > 24) {
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" title="Over 24 hours old" />;
      } else if (hoursSinceCreated > 12) {
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" title="Over 12 hours old" />;
      }
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending_response: "bg-orange-100 text-orange-800",
      active: "bg-green-100 text-green-800",
      archived: "bg-neutral-100 text-neutral-800",
      flagged: "bg-red-100 text-red-800",
      application_submitted: "bg-blue-100 text-blue-800",
      booking_confirmed: "bg-green-100 text-green-800",
    };
    
    return configs[status as keyof typeof configs] || configs.active;
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Property Inquiries</h1>
        <p className="text-neutral-600">Manage messages from potential tenants</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-neutral-500" />
            <span className="font-medium text-neutral-700">Filter by:</span>
          </div>
          
          {/* Property Filter */}
          <select
            value={selectedProperty || "all"}
            onChange={(e) => setSelectedProperty(e.target.value === "all" ? null : Number(e.target.value))}
            className="rounded-md border-neutral-300 text-sm focus:border-primary-500 focus:ring-primary-500"
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
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="rounded-md border-neutral-300 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="pending_response">Pending Response</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
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
                onClick={() => router.push(`/dashboard/messages/${conversation.id}`)}
                className={`hover:bg-neutral-50 transition-colors cursor-pointer p-4 ${
                  conversation.unreadCount > 0 ? "bg-blue-50/30" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Property Image */}
                  {conversation.propertyDetails?.mainImage ? (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                      <PropertyImage
                        image={conversation.propertyDetails.mainImage}
                        alt={conversation.propertyDetails.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <BuildingOfficeIcon className="h-8 w-8 text-neutral-400" />
                    </div>
                  )}
                  
                  {/* Conversation Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">
                          {conversation.otherParticipant?.name || 
                           conversation.otherParticipant?.firstName || 
                           conversation.otherParticipant?.username || 
                           "Unknown User"}
                        </h3>
                        {getPriorityIcon(conversation)}
                      </div>
                      
                      <div className="text-right flex items-center gap-2">
                        <span className="text-xs text-neutral-500">
                          {formatters.date.relative(conversation.updatedAt)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-primary-500 text-white text-xs rounded-full font-medium">
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
                        conversation.unreadCount > 0 && conversation.latestMessage.sender !== user?.id
                          ? "text-neutral-900 font-medium"
                          : "text-neutral-500"
                      }`}>
                        {conversation.latestMessage.sender === user?.id && "You: "}
                        {conversation.latestMessage.content}
                      </p>
                    )}
                    
                    {/* Status Badge */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(conversation.status)}`}>
                        {conversation.status === "pending_response" && <ClockIcon className="h-3 w-3 mr-1" />}
                        {conversation.status === "booking_confirmed" && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                        {conversation.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      
                      {conversation.hasFlaggedContent && (
                        <span className="inline-flex items-center text-xs text-red-600">
                          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                          Flagged
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