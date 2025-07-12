// frontend/src/app/(main)/messages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useConversationList } from "@/hooks/messaging/useConversationList";
import { formatters } from "@/utils/formatters";
import PropertyImage from "@/components/common/PropertyImage";
import {
  ChatBubbleLeftRightIcon,
  BuildingOfficeIcon,
  UsersIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import type { Conversation } from "@/types/api";

type TabType = "all" | "property" | "roommate";

export default function StudentMessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
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
    type: undefined, // Will be set based on activeTab
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/messages");
      return;
    }

    // Redirect property owners to their dashboard
    if (user?.userType === "property_owner") {
      router.push("/dashboard/messages");
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleTabChange = (tab: TabType) => {
    if (tab === "all") {
      updateFilters({ type: undefined });
    } else if (tab === "property") {
      updateFilters({ type: "property_inquiry" });
    } else if (tab === "roommate") {
      updateFilters({ type: "roommate_inquiry" });
    }
  };

  const handleConversationClick = (conversationId: number) => {
    router.push(`/messages/${conversationId}`);
  };

  const getConversationIcon = (conversation: Conversation) => {
    if (conversation.conversationType === "roommate_inquiry") {
      return <UsersIcon className="h-5 w-5 text-purple-500" />;
    }
    return <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />;
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.propertyDetails) {
      return conversation.propertyDetails.title;
    }
    if (conversation.conversationType === "roommate_inquiry") {
      const name = conversation.otherParticipant?.name || 
                   conversation.otherParticipant?.firstName ||
                   conversation.otherParticipant?.username ||
                   "Unknown";
      return `Chat with ${name}`;
    }
    return conversation.otherParticipant?.name || 
           conversation.otherParticipant?.firstName ||
           conversation.otherParticipant?.username ||
           "Conversation";
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    if (conversation.propertyDetails) {
      return `$${formatters.number(conversation.propertyDetails.rentAmount)}/month • ${conversation.propertyDetails.address}`;
    }
    if (conversation.conversationType === "roommate_inquiry") {
      return "Potential roommate match";
    }
    return conversation.otherParticipant?.userType === "property_owner" 
      ? "Property Owner" 
      : "Student";
  };

  // Determine active tab from filters
  const activeTab: TabType = 
    filters.type === "property_inquiry" ? "property" :
    filters.type === "roommate_inquiry" ? "roommate" : "all";

  // Filter conversations based on search
  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const title = getConversationTitle(c).toLowerCase();
    const subtitle = getConversationSubtitle(c).toLowerCase();
    const latestMessage = c.latestMessage?.content.toLowerCase() || "";
    const searchLower = searchQuery.toLowerCase();
    
    return title.includes(searchLower) || 
           subtitle.includes(searchLower) || 
           latestMessage.includes(searchLower);
  });

  const counts = {
    all: stats.total,
    property: conversations.filter(c => c.conversationType === "property_inquiry").length,
    roommate: conversations.filter(c => c.conversationType === "roommate_inquiry").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded-lg w-48 mb-8"></div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-14 w-14 bg-neutral-200 rounded-xl"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                      <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-neutral-900">Messages</h1>
            {stats.unread > 0 && (
              <div className="flex items-center bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full">
                <BellIcon className="h-4 w-4 mr-1.5" />
                <span className="text-sm font-medium">{stats.unread} unread</span>
              </div>
            )}
          </div>
          <p className="text-neutral-600">
            Your conversations with property owners and roommates
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              onClick={() => updateFilters({ unreadOnly: !filters.unreadOnly })}
              title={filters.unreadOnly ? "Show all" : "Show unread only"}
            >
              <FunnelIcon className={`h-5 w-5 ${filters.unreadOnly ? 'text-primary-500' : 'text-neutral-500'}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6 p-1.5">
          <nav className="flex space-x-1">
            <button
              onClick={() => handleTabChange("all")}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                activeTab === "all"
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <InboxIcon className="h-5 w-5 mr-2" />
              All Messages
              {counts.all > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === "all" ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700"
                }`}>
                  {counts.all}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("property")}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                activeTab === "property"
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              Property Inquiries
              {counts.property > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === "property" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                }`}>
                  {counts.property}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("roommate")}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                activeTab === "roommate"
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <UsersIcon className="h-5 w-5 mr-2" />
              Roommate Chats
              {counts.roommate > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === "roommate" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                }`}>
                  {counts.roommate}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Conversation List */}
        {filteredConversations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChatBubbleLeftRightIcon className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {searchQuery 
                  ? "No conversations found"
                  : activeTab === "roommate" 
                  ? "No roommate conversations yet"
                  : activeTab === "property"
                  ? "No property inquiries yet"
                  : "No conversations yet"
                }
              </h3>
              <p className="text-neutral-600 mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : activeTab === "roommate" 
                  ? "Connect with potential roommates through the roommate finder"
                  : "Start a conversation by contacting a property owner"
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => router.push(activeTab === "roommate" ? "/roommates" : "/properties")}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
                >
                  {activeTab === "roommate" ? "Find Roommates" : "Browse Properties"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className={`relative hover:bg-neutral-50 transition-all cursor-pointer p-5 
                    ${conversation.unreadCount > 0 ? "bg-gradient-to-r from-blue-50/50 to-transparent" : ""}
                  `}
                >
                  {/* Unread indicator bar */}
                  {conversation.unreadCount > 0 && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600"></div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Avatar/Image with online indicator */}
                    <div className="relative flex-shrink-0">
                      {conversation.propertyDetails?.mainImage ? (
                        <div className="relative h-14 w-14 rounded-xl overflow-hidden shadow-sm">
                          <PropertyImage
                            image={conversation.propertyDetails.mainImage}
                            alt={conversation.propertyDetails.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : conversation.otherParticipant?.profilePicture ? (
                        <img
                          src={conversation.otherParticipant.profilePicture}
                          alt={conversation.otherParticipant.name || conversation.otherParticipant.username || "User"}
                          className="h-14 w-14 rounded-xl object-cover shadow-sm"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center shadow-sm">
                          {getConversationIcon(conversation)}
                        </div>
                      )}
                      
                      {/* Online indicator */}
                      {conversation.otherParticipant?.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                      )}
                    </div>

                    {/* Conversation Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-neutral-900 ${
                            conversation.unreadCount > 0 ? "font-bold" : ""
                          }`}>
                            {getConversationTitle(conversation)}
                          </h3>
                          <p className="text-sm text-neutral-600 mt-0.5">
                            {getConversationSubtitle(conversation)}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end ml-4">
                          <span className={`text-xs ${
                            conversation.unreadCount > 0 ? "text-primary-600 font-semibold" : "text-neutral-500"
                          }`}>
                            {formatters.date.relative(conversation.updatedAt)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="mt-1.5 inline-flex items-center justify-center h-6 min-w-[24px] px-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs rounded-full font-semibold shadow-sm">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Latest Message */}
                      {conversation.latestMessage && (
                        <p className={`text-sm truncate pr-4 ${
                          conversation.unreadCount > 0 && conversation.latestMessage.sender !== user?.id
                            ? "text-neutral-900 font-medium"
                            : "text-neutral-500"
                        }`}>
                          {conversation.latestMessage.sender === user?.id && (
                            <span className="text-neutral-400 font-normal">You: </span>
                          )}
                          {conversation.latestMessage.content}
                        </p>
                      )}

                      {/* Status Indicators */}
                      <div className="flex items-center gap-3 mt-2">
                        {conversation.status === "pending_response" && (
                          <span className="inline-flex items-center text-xs">
                            <span className="h-2 w-2 bg-orange-400 rounded-full mr-1.5 animate-pulse"></span>
                            <span className="text-orange-600 font-medium">Awaiting response</span>
                          </span>
                        )}
                        {conversation.status === "booking_confirmed" && (
                          <span className="inline-flex items-center text-xs">
                            <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                            <span className="text-green-600 font-medium">Booking confirmed</span>
                          </span>
                        )}
                        {conversation.hasFlaggedContent && (
                          <span className="inline-flex items-center text-xs">
                            <span className="h-2 w-2 bg-red-500 rounded-full mr-1.5"></span>
                            <span className="text-red-600 font-medium">Flagged</span>
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
    </div>
  );
}