// frontend/src/app/(dashboard)/dashboard/messages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useConversationList } from "@/hooks/useConversationList";
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
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import type { Property } from "@/types/api";
import apiService from "@/lib/api";

type FilterStatus = "all" | "pending_response" | "active" | "archived";

export default function PropertyOwnerMessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Use the WebSocket-enabled hook
  const {
    conversations,
    isLoading,
    filters,
    stats,
    updateFilters,
    refreshConversations,
  } = useConversationList({
    type: "property_inquiry",
    property: selectedProperty || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
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

    fetchProperties();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    updateFilters({
      property: selectedProperty || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    });
  }, [selectedProperty, statusFilter, updateFilters]);

  const fetchProperties = async () => {
    try {
      const response = await apiService.properties.getOwnerProperties();
      setProperties(response.data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
    }
  };

  // Calculate additional stats
  const enhancedStats = {
    totalInquiries: stats.total,
    pendingResponses: stats.pending,
    averageResponseTime: "2 hours", // TODO: Calculate from actual data
    todayInquiries: stats.today,
  };

  const getPriorityIcon = (conversation: any) => {
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
      pending_response: {
        bg: "bg-gradient-to-r from-orange-100 to-amber-100",
        text: "text-orange-800",
        icon: <ClockIcon className="h-3 w-3 mr-1" />,
      },
      active: {
        bg: "bg-gradient-to-r from-green-100 to-emerald-100",
        text: "text-green-800",
        icon: <CheckCircleIcon className="h-3 w-3 mr-1" />,
      },
      archived: {
        bg: "bg-neutral-100",
        text: "text-neutral-800",
        icon: null,
      },
      flagged: {
        bg: "bg-gradient-to-r from-red-100 to-pink-100",
        text: "text-red-800",
        icon: <ExclamationTriangleIcon className="h-3 w-3 mr-1" />,
      },
      application_submitted: {
        bg: "bg-gradient-to-r from-blue-100 to-indigo-100",
        text: "text-blue-800",
        icon: null,
      },
      booking_confirmed: {
        bg: "bg-gradient-to-r from-green-100 to-teal-100",
        text: "text-green-800",
        icon: <CheckCircleIcon className="h-3 w-3 mr-1" />,
      },
    };
    
    return configs[status as keyof typeof configs] || configs.active;
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const userName = c.otherParticipant?.name || c.otherParticipant?.firstName || c.otherParticipant?.username || "";
    const propertyTitle = c.propertyDetails?.title || "";
    const latestMessage = c.latestMessage?.content || "";
    const searchLower = searchQuery.toLowerCase();
    
    return userName.toLowerCase().includes(searchLower) || 
           propertyTitle.toLowerCase().includes(searchLower) || 
           latestMessage.toLowerCase().includes(searchLower);
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4 mx-auto"></div>
          <p className="text-neutral-600">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Property Inquiries</h1>
        <p className="text-neutral-600">Manage messages from potential tenants</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600" />
              </div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm text-neutral-600 mb-1">Total Inquiries</p>
            <p className="text-2xl font-bold text-neutral-900">{enhancedStats.totalInquiries}</p>
            <p className="text-xs text-green-600 mt-2">+12% from last week</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl">
                <BellIcon className="h-6 w-6 text-orange-600" />
              </div>
              {enhancedStats.pendingResponses > 0 && (
                <span className="animate-pulse h-2 w-2 bg-orange-500 rounded-full"></span>
              )}
            </div>
            <p className="text-sm text-neutral-600 mb-1">Pending Responses</p>
            <p className="text-2xl font-bold text-orange-600">{enhancedStats.pendingResponses}</p>
            <p className="text-xs text-neutral-500 mt-2">Respond quickly to boost ranking</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <ChartBarIcon className="h-5 w-5 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-600 mb-1">Avg Response Time</p>
            <p className="text-2xl font-bold text-neutral-900">{enhancedStats.averageResponseTime}</p>
            <p className="text-xs text-green-600 mt-2">Excellent response rate</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <UserGroupIcon className="h-5 w-5 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-600 mb-1">Today's Inquiries</p>
            <p className="text-2xl font-bold text-neutral-900">{enhancedStats.todayInquiries}</p>
            <p className="text-xs text-neutral-500 mt-2">Peak time: 2-4 PM</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search Bar */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, property, or message..."
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <FunnelIcon className="h-5 w-5 text-neutral-500" />
            
            {/* Property Filter */}
            <select
              value={selectedProperty || "all"}
              onChange={(e) => setSelectedProperty(e.target.value === "all" ? null : Number(e.target.value))}
              className="rounded-lg border-neutral-200 text-sm focus:border-primary-500 focus:ring-primary-500"
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
              className="rounded-lg border-neutral-200 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending_response">Pending Response</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <ChatBubbleLeftRightIcon className="h-10 w-10 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              {searchQuery ? "No inquiries found" : "No inquiries yet"}
            </h3>
            <p className="text-neutral-600">
              {searchQuery 
                ? "Try adjusting your search terms"
                : "Property inquiries will appear here when students contact you."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {filteredConversations.map((conversation) => {
              const statusConfig = getStatusBadge(conversation.status);
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => router.push(`/dashboard/messages/${conversation.id}`)}
                  className={`relative hover:bg-neutral-50 transition-all cursor-pointer p-5 group
                    ${conversation.unreadCount > 0 ? "bg-gradient-to-r from-blue-50/50 to-transparent" : ""}
                  `}
                >
                  {/* Priority indicator bar */}
                  {conversation.status === "pending_response" && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-amber-500"></div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    {/* Property Image */}
                    {conversation.propertyDetails?.mainImage ? (
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                        <PropertyImage
                          image={conversation.propertyDetails.mainImage}
                          alt={conversation.propertyDetails.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center flex-shrink-0">
                        <BuildingOfficeIcon className="h-8 w-8 text-neutral-400" />
                      </div>
                    )}
                    
                    {/* Conversation Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-neutral-900 ${
                            conversation.unreadCount > 0 ? "font-bold" : ""
                          }`}>
                            {conversation.otherParticipant?.name || 
                             conversation.otherParticipant?.firstName || 
                             conversation.otherParticipant?.username || 
                             "Unknown User"}
                          </h3>
                          {getPriorityIcon(conversation)}
                          {conversation.otherParticipant?.emailVerified && (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" title="Verified user" />
                          )}
                        </div>
                        
                        <div className="text-right flex items-center gap-3">
                          <span className={`text-xs ${
                            conversation.unreadCount > 0 ? "text-primary-600 font-semibold" : "text-neutral-500"
                          }`}>
                            {formatters.date.relative(conversation.updatedAt)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs rounded-full font-semibold shadow-sm">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Property Info */}
                      <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                        <BuildingOfficeIcon className="h-4 w-4 text-neutral-400" />
                        <span className="font-medium">{conversation.propertyDetails?.title}</span>
                        <span className="text-neutral-400">•</span>
                        <span className="text-primary-600 font-semibold">
                          ${formatters.number(conversation.propertyDetails?.rentAmount || 0)}/month
                        </span>
                      </div>
                      
                      {/* Latest Message */}
                      {conversation.latestMessage && (
                        <p className={`text-sm truncate mb-2 ${
                          conversation.unreadCount > 0 && conversation.latestMessage.sender !== user?.id
                            ? "text-neutral-900 font-medium"
                            : "text-neutral-500"
                        }`}>
                          {conversation.latestMessage.sender === user?.id && (
                            <span className="text-neutral-400">You: </span>
                          )}
                          {conversation.latestMessage.content}
                        </p>
                      )}
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center text-xs px-3 py-1.5 rounded-full font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.icon}
                          {conversation.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        
                        {conversation.hasFlaggedContent && (
                          <span className="inline-flex items-center text-xs text-red-600">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            Flagged content
                          </span>
                        )}
                        
                        {conversation.status === "pending_response" && (
                          <span className="text-xs text-orange-600 font-medium ml-auto">
                            Response needed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}