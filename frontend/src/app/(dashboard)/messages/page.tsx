// frontend/src/app/(dashboard)/messages/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import apiService from "@/lib/api";
import { formatters } from "@/utils/formatters";
import PropertyImage from "@/components/common/PropertyImage";
import {
  ChatBubbleLeftRightIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import type { Conversation } from "@/types/api";

export default function MessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'property'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/messages');
      return;
    }

    fetchConversations();
  }, [isAuthenticated]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      
      if (filter === 'unread') {
        params.unreadOnly = true;
      } else if (filter === 'property') {
        params.type = 'property_inquiry';
      }

      const response = await apiService.messaging.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (conversationId: number) => {
    router.push(`/messages/${conversationId}`);
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.propertyDetails) {
      return conversation.propertyDetails.title;
    }
    return conversation.otherParticipant?.name || 
           conversation.otherParticipant?.firstName || 
           conversation.otherParticipant?.username || 
           'Conversation';
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    if (conversation.propertyDetails) {
      return `$${formatters.number(conversation.propertyDetails.rentAmount)}/month`;
    }
    return conversation.otherParticipant?.userType === 'property_owner' 
      ? 'Property Owner' 
      : 'Student';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      pending_response: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Response' },
      pending_application: { color: 'bg-blue-100 text-blue-800', label: 'Application Pending' },
      booking_confirmed: { color: 'bg-purple-100 text-purple-800', label: 'Booking Confirmed' },
      archived: { color: 'bg-neutral-100 text-neutral-800', label: 'Archived' },
    };

    const config = statusConfig[status] || statusConfig.active;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex space-x-4">
                  <div className="h-16 w-16 bg-neutral-200 rounded-lg"></div>
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Messages</h1>
        <p className="text-neutral-600">
          Communicate with property owners and other students
        </p>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          All Messages
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('property')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'property'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          Property Inquiries
        </button>
      </div>

      {/* Conversation List */}
      {conversations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            No conversations yet
          </h3>
          <p className="text-neutral-600 mb-4">
            Start a conversation by contacting a property owner
          </p>
          <button
            onClick={() => router.push('/properties')}
            className="btn-primary"
          >
            Browse Properties
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationClick(conversation.id)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Avatar/Property Image */}
                  <div className="flex-shrink-0 relative">
                    {conversation.propertyDetails?.mainImage ? (
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden">
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
                        alt={conversation.otherParticipant.name || conversation.otherParticipant.username || 'User'}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-semibold text-lg">
                          {conversation.otherParticipant?.name?.[0] || 
                           conversation.otherParticipant?.firstName?.[0] || 
                           conversation.otherParticipant?.username?.[0] || 
                           '?'}
                        </span>
                      </div>
                    )}
                    
                    {/* Online indicator */}
                    {conversation.otherParticipant?.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Conversation Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-semibold text-neutral-900 truncate">
                          {getConversationTitle(conversation)}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {getConversationSubtitle(conversation)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        <span className="text-xs text-neutral-500">
                          {formatters.date.relative(conversation.updatedAt)}
                        </span>
                        {getStatusBadge(conversation.status)}
                      </div>
                    </div>

                    {/* Latest Message */}
                    {conversation.latestMessage && (
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate flex-1 ${
                          conversation.latestMessage.read || conversation.latestMessage.sender === user?.id
                            ? 'text-neutral-600'
                            : 'text-neutral-900 font-medium'
                        }`}>
                          {conversation.latestMessage.sender === user?.id && (
                            <span className="text-neutral-500">You: </span>
                          )}
                          {conversation.latestMessage.content}
                        </p>
                        
                        {/* Unread count */}
                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-1 bg-primary-500 text-white text-xs rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Property Info */}
                    {conversation.propertyDetails && (
                      <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                        <span className="flex items-center">
                          <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                          {conversation.propertyDetails.address}
                        </span>
                      </div>
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