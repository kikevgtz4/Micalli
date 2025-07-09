// frontend/src/app/(main)/messages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";
import { formatters } from "@/utils/formatters";
import PropertyImage from "@/components/common/PropertyImage";
import {
  ChatBubbleLeftRightIcon,
  BuildingOfficeIcon,
  UsersIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import type { Conversation } from "@/types/api";

type TabType = "all" | "property" | "roommate";

export default function StudentMessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");

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

    fetchConversations();
  }, [isAuthenticated, user, activeTab]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      
      const params: Parameters<typeof apiService.messaging.getConversations>[0] = {};
      
      if (activeTab === "property") {
        params.type = "property_inquiry";
      } else if (activeTab === "roommate") {
        params.type = "roommate_inquiry";
      }

      const response = await apiService.messaging.getConversations(params);
      // Handle both paginated and non-paginated responses
      const conversationData = response.data.results || response.data;
      setConversations(Array.isArray(conversationData) ? conversationData : []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
      setConversations([]);
    } finally {
      setIsLoading(false);
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

  // Count conversations by type for tab badges
  const filteredConversations = conversations.filter(c => {
    if (activeTab === "all") return true;
    if (activeTab === "property") return c.conversationType === "property_inquiry";
    if (activeTab === "roommate") return c.conversationType === "roommate_inquiry";
    return true;
  });

  const counts = {
    all: conversations.length,
    property: conversations.filter(c => c.conversationType === "property_inquiry").length,
    roommate: conversations.filter(c => c.conversationType === "roommate_inquiry").length,
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex space-x-4">
                  <div className="h-12 w-12 bg-neutral-200 rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                    <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Messages</h1>
        <p className="text-neutral-600">
          Your conversations with property owners and roommates
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "all"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            <InboxIcon className="h-5 w-5 inline mr-2" />
            All Messages
            {counts.all > 0 && (
              <span className="ml-2 bg-neutral-100 text-neutral-600 text-xs px-2 py-0.5 rounded-full">
                {counts.all}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("property")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "property"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            <BuildingOfficeIcon className="h-5 w-5 inline mr-2" />
            Property Inquiries
            {counts.property > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                {counts.property}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("roommate")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "roommate"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            <UsersIcon className="h-5 w-5 inline mr-2" />
            Roommate Chats
            {counts.roommate > 0 && (
              <span className="ml-2 bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">
                {counts.roommate}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Conversation List */}
      {filteredConversations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            {activeTab === "roommate" 
              ? "No roommate conversations yet"
              : activeTab === "property"
              ? "No property inquiries yet"
              : "No conversations yet"
            }
          </h3>
          <p className="text-neutral-600 mb-4">
            {activeTab === "roommate" 
              ? "Connect with potential roommates through the roommate finder"
              : "Start a conversation by contacting a property owner"
            }
          </p>
          <button
            onClick={() => router.push(activeTab === "roommate" ? "/roommates" : "/properties")}
            className="btn-primary"
          >
            {activeTab === "roommate" ? "Find Roommates" : "Browse Properties"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationClick(conversation.id)}
              className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-4 
                ${conversation.unreadCount > 0 ? "border-l-4 border-primary-500" : ""}
              `}
            >
              <div className="flex items-start space-x-4">
                {/* Avatar/Image */}
                <div className="flex-shrink-0 relative">
                  {conversation.propertyDetails?.mainImage ? (
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden">
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
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-neutral-100 flex items-center justify-center">
                      {getConversationIcon(conversation)}
                    </div>
                  )}
                  
                  {/* Online indicator */}
                  {conversation.otherParticipant?.isOnline && (
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 text-sm">
                        {getConversationTitle(conversation)}
                      </h3>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        {getConversationSubtitle(conversation)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-neutral-500">
                        {formatters.date.relative(conversation.updatedAt)}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 bg-primary-500 text-white text-xs rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Latest Message */}
                  {conversation.latestMessage && (
                    <p className={`text-sm mt-1 truncate ${
                      conversation.unreadCount > 0 && conversation.latestMessage.sender !== user?.id
                        ? "text-neutral-900 font-medium"
                        : "text-neutral-500"
                    }`}>
                      {conversation.latestMessage.sender === user?.id && (
                        <span className="text-neutral-500 font-normal">You: </span>
                      )}
                      {conversation.latestMessage.content}
                    </p>
                  )}

                  {/* Status Indicators */}
                  <div className="flex items-center gap-2 mt-1">
                    {conversation.status === "pending_response" && (
                      <span className="inline-flex items-center text-xs text-orange-600">
                        <span className="h-1.5 w-1.5 bg-orange-500 rounded-full mr-1"></span>
                        Awaiting response
                      </span>
                    )}
                    {conversation.status === "booking_confirmed" && (
                      <span className="inline-flex items-center text-xs text-green-600">
                        <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1"></span>
                        Booking confirmed
                      </span>
                    )}
                    {conversation.hasFlaggedContent && (
                      <span className="inline-flex items-center text-xs text-red-600">
                        <span className="h-1.5 w-1.5 bg-red-500 rounded-full mr-1"></span>
                        Flagged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}