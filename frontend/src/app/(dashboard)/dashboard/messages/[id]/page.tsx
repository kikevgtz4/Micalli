// frontend/src/app/(dashboard)/dashboard/messages/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import apiService from "@/lib/api";
import { toast } from "react-hot-toast";
import { ConversationHeader } from "@/components/messaging/shared/ConversationHeader";
import { MessageList } from "@/components/messaging/shared/MessageList";
import { MessageInput } from "@/components/messaging/shared/MessageInput";
import PolicyWarning from "@/components/messaging/PolicyWarning";
import { getMessageTemplate, TEMPLATE_TYPES } from "@/utils/constants";
import {
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  ArchiveBoxIcon,
  CheckBadgeIcon,
  CalendarIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import type { ConversationDetail, PolicyViolation } from "@/types/api";

export default function PropertyOwnerConversationPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = Number(params.id);

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showPolicyWarning, setShowPolicyWarning] = useState(false);
  const [policyViolations, setPolicyViolations] = useState<PolicyViolation[]>([]);
  const [pendingMessage, setPendingMessage] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const conversationStartTime = useRef<Date | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard/messages");
      return;
    }

    if (user?.userType !== "property_owner") {
      router.push("/messages");
      return;
    }

    fetchConversation();
  }, [conversationId, user, isAuthenticated]);

  const fetchConversation = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.messaging.getConversation(conversationId);
      setConversation(response.data);
      
      // Track response time for pending conversations
      if (response.data.status === "pending_response" && !conversationStartTime.current) {
        conversationStartTime.current = new Date(response.data.createdAt);
      }
      
      // Mark messages as read
      await apiService.messaging.markConversationRead(conversationId);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast.error("Failed to load conversation");
      router.push("/dashboard/messages");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string, metadata?: any) => {
    if (!conversation || isSending) return;

    setIsSending(true);
    setPendingMessage(content);

    try {
      const response = await apiService.messaging.sendMessage(
        conversationId,
        content,
        metadata
      );

      // Check for content warnings
      if (response.data.contentWarning) {
        setPolicyViolations(response.data.contentWarning.violations);
        setShowPolicyWarning(true);
        setIsSending(false);
        return;
      }

      // Track response time if this was first response
      if (conversation.status === "pending_response" && conversationStartTime.current) {
        const responseTime = new Date().getTime() - conversationStartTime.current.getTime();
        console.log("Response time:", Math.round(responseTime / 1000 / 60), "minutes");
      }

      // Success - refresh conversation
      await fetchConversation();
      toast.success("Message sent");
      setShowTemplates(false);
    } catch (error: any) {
      if (error.response?.data?.violations) {
        setPolicyViolations(error.response.data.violations);
        setShowPolicyWarning(true);
      } else {
        toast.error("Failed to send message");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateSelect = (templateType: string) => {
    const template = getMessageTemplate(templateType as any);
    if (!template || !conversation) return;

    let filledContent = template.content
      .replace("{property_title}", conversation.propertyDetails?.title || "")
      .replace("{move_in_date}", "[Please specify]")
      .replace("{duration}", "[Please specify]")
      .replace("{occupants}", "[Please specify]");
    
    handleSendMessage(filledContent, { templateUsed: templateType });
  };

  const updateConversationStatus = async (newStatus: string) => {
    if (!conversation) return;
    
    setIsUpdatingStatus(true);
    try {
      // API call to update status would go here
      // await apiService.messaging.updateConversationStatus(conversationId, { status: newStatus });
      
      setConversation({ ...conversation, status: newStatus as any });
      toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFlagConversation = async () => {
    toast("Flag conversation feature coming soon");
  };

  const handleReviseMessage = () => {
    setShowPolicyWarning(false);
    setPolicyViolations([]);
  };

  const handleSendAnyway = async () => {
    setShowPolicyWarning(false);
    await handleSendMessage(pendingMessage);
  };

  if (isLoading || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const inquirerProfile = conversation.otherParticipant;
  const property = conversation.propertyDetails;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <ConversationHeader
          conversation={conversation}
          onBack={() => router.push("/dashboard/messages")}
          onFlag={handleFlagConversation}
          additionalActions={
            <>
              <select
                value={conversation.status}
                onChange={(e) => updateConversationStatus(e.target.value)}
                className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 mr-2"
                disabled={isUpdatingStatus}
              >
                <option value="active">Active</option>
                <option value="pending_response">Pending Response</option>
                <option value="application_submitted">Application Submitted</option>
                <option value="booking_confirmed">Booking Confirmed</option>
                <option value="archived">Archived</option>
              </select>
              
              {property && (
                <button
                  onClick={() => router.push(`/properties/${property.id}/edit`)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Edit Property"
                >
                  <DocumentTextIcon className="h-5 w-5 text-neutral-600" />
                </button>
              )}
            </>
          }
        />

        {/* Response Time Alert */}
        {conversation.status === "pending_response" && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  This inquiry is awaiting your response
                </span>
              </div>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-sm text-yellow-700 font-medium hover:text-yellow-800"
              >
                Use Quick Response →
              </button>
            </div>
          </div>
        )}

        {/* Quick Response Templates */}
        {showTemplates && (
          <div className="bg-neutral-50 border-b px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-neutral-900">Quick Response Templates</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATE_TYPES.filter(type => type !== "initial_inquiry").map((templateType) => {
                const template = getMessageTemplate(templateType);
                return (
                  <button
                    key={templateType}
                    onClick={() => handleTemplateSelect(templateType)}
                    className="p-3 bg-white hover:bg-neutral-100 rounded-lg text-left transition-colors border border-neutral-200"
                  >
                    <div className="flex items-start space-x-2">
                      <ChatBubbleLeftIcon className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-neutral-900">
                          {template.title}
                        </p>
                        <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">
                          {template.content.substring(0, 60)}...
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <MessageList
          messages={conversation.messages}
          currentUserId={user!.id}
          isLoading={false}
        />

        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!conversation.canSendMessage || isSending}
          placeholder={
            conversation.status === "archived"
              ? "This conversation is archived"
              : conversation.status === "flagged"
              ? "This conversation has been flagged"
              : "Type your response..."
          }
        />
      </div>

      {/* Sidebar with Inquirer Info */}
      <div className="w-80 border-l bg-neutral-50 p-6 overflow-y-auto">
        <h3 className="font-semibold text-neutral-900 mb-4">Inquirer Information</h3>
        
        {/* Profile Section */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            {inquirerProfile?.profilePicture ? (
              <img
                src={inquirerProfile.profilePicture}
                alt={inquirerProfile.name || "User"}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-primary-600" />
              </div>
            )}
            <div>
              <p className="font-medium text-neutral-900">
                {inquirerProfile?.name || inquirerProfile?.username}
              </p>
              <div className="flex items-center text-sm text-neutral-600">
                {inquirerProfile?.emailVerified && (
                  <CheckBadgeIcon className="h-4 w-4 text-green-500 mr-1" />
                )}
                {inquirerProfile?.emailVerified ? "Verified" : "Unverified"} Student
              </div>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-neutral-600">
              <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              Member since {inquirerProfile?.dateJoined 
                ? new Date(inquirerProfile.dateJoined).toLocaleDateString()
                : "Unknown"}
            </div>
            {inquirerProfile?.university && (
              <div className="flex items-center text-neutral-600">
                <BuildingOfficeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                {inquirerProfile.university.name}
              </div>
            )}
          </div>
        </div>

        {/* Property Info */}
        {property && (
          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-medium text-neutral-900 mb-3">Property Details</h4>
            {property.mainImage && (
              <img 
                src={property.mainImage} 
                alt={property.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}
            <div className="space-y-2 text-sm">
              <p className="font-medium">{property.title}</p>
              <p className="text-neutral-600">${property.rentAmount}/month</p>
              <p className="text-neutral-600">
                {property.bedrooms} bed • {property.bathrooms} bath
              </p>
              <p className="text-neutral-600">{property.address}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-medium text-neutral-900 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-neutral-100 transition-colors flex items-center"
            >
              <ChatBubbleLeftIcon className="h-4 w-4 mr-2 text-neutral-600" />
              Send Template Response
            </button>
            <button
              onClick={() => updateConversationStatus("archived")}
              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-neutral-100 transition-colors flex items-center"
              disabled={conversation.status === "archived"}
            >
              <ArchiveBoxIcon className="h-4 w-4 mr-2 text-neutral-600" />
              Archive Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Policy Warning Modal */}
      {showPolicyWarning && (
        <PolicyWarning
          violations={policyViolations}
          onRevise={handleReviseMessage}
          onAccept={policyViolations.some(v => v.severity === "critical") ? undefined : handleSendAnyway}
          isBlocked={policyViolations.some(v => v.severity === "critical")}
        />
      )}
    </div>
  );
}