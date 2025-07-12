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
  LightBulbIcon,
  SparklesIcon,
  DocumentCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  StarIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import PropertyImage from "@/components/common/PropertyImage";
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
      <div className="flex-1 flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4 mx-auto"></div>
          <p className="text-neutral-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  const inquirerProfile = conversation.otherParticipant;
  const property = conversation.propertyDetails;

  // Get response time for pending conversations
  const getResponseTimeWarning = () => {
    if (conversation.status !== "pending_response" || !conversationStartTime.current) return null;
    const hoursSince = (Date.now() - conversationStartTime.current.getTime()) / (1000 * 60 * 60);
    
    if (hoursSince > 24) return { level: 'critical', message: 'Over 24 hours - Response urgently needed!' };
    if (hoursSince > 12) return { level: 'warning', message: 'Over 12 hours - Please respond soon' };
    if (hoursSince > 6) return { level: 'info', message: 'Response needed within 24 hours' };
    return null;
  };

  const responseWarning = getResponseTimeWarning();

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-neutral-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white shadow-xl">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600">
          <ConversationHeader
            conversation={conversation}
            onBack={() => router.push("/dashboard/messages")}
            onFlag={handleFlagConversation}
            showPropertyButton={false}
            additionalActions={
              <div className="flex items-center gap-2">
                <select
                  value={conversation.status}
                  onChange={(e) => updateConversationStatus(e.target.value)}
                  className="text-sm bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/50"
                  disabled={isUpdatingStatus}
                >
                  <option value="active" className="text-neutral-900">Active</option>
                  <option value="pending_response" className="text-neutral-900">Pending Response</option>
                  <option value="application_submitted" className="text-neutral-900">Application Submitted</option>
                  <option value="booking_confirmed" className="text-neutral-900">Booking Confirmed</option>
                  <option value="archived" className="text-neutral-900">Archived</option>
                </select>
                
                {property && (
                  <button
                    onClick={() => router.push(`/dashboard/properties/${property.id}/edit`)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Edit Property"
                  >
                    <DocumentTextIcon className="h-5 w-5 text-white" />
                  </button>
                )}
              </div>
            }
          />
        </div>

        {/* Response Time Alert */}
        {responseWarning && (
          <div className={`px-6 py-4 ${
            responseWarning.level === 'critical' ? 'bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200' :
            responseWarning.level === 'warning' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200' :
            'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClockIcon className={`h-5 w-5 mr-3 ${
                  responseWarning.level === 'critical' ? 'text-red-600 animate-pulse' :
                  responseWarning.level === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <span className={`text-sm font-medium ${
                  responseWarning.level === 'critical' ? 'text-red-800' :
                  responseWarning.level === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {responseWarning.message}
                </span>
              </div>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={`text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity ${
                  responseWarning.level === 'critical' ? 'text-red-700' :
                  responseWarning.level === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}
              >
                <SparklesIcon className="h-4 w-4" />
                Use Quick Response
                <ChevronRightIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Response Templates */}
        {showTemplates && (
          <div className="bg-gradient-to-b from-neutral-50 to-white border-b px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-neutral-900">Quick Response Templates</h3>
                <p className="text-sm text-neutral-600 mt-0.5">Choose a template to respond quickly</p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATE_TYPES.filter(type => type !== "initial_inquiry").map((templateType) => {
                const template = getMessageTemplate(templateType);
                const icons = {
                  property_available: <CheckBadgeIcon className="h-5 w-5 text-green-500" />,
                  schedule_viewing: <CalendarIcon className="h-5 w-5 text-blue-500" />,
                  provide_details: <DocumentTextIcon className="h-5 w-5 text-purple-500" />,
                  application_next_steps: <DocumentCheckIcon className="h-5 w-5 text-indigo-500" />,
                  not_available: <ArchiveBoxIcon className="h-5 w-5 text-neutral-500" />,
                };
                
                return (
                  <button
                    key={templateType}
                    onClick={() => handleTemplateSelect(templateType)}
                    className="p-4 bg-white hover:bg-neutral-50 rounded-xl text-left transition-all border border-neutral-200 hover:border-primary-300 hover:shadow-md group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-neutral-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                        {icons[templateType as keyof typeof icons] || <ChatBubbleLeftIcon className="h-5 w-5 text-primary-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-neutral-900 mb-1">
                          {template.title}
                        </p>
                        <p className="text-xs text-neutral-600 line-clamp-2">
                          {template.content.substring(0, 80)}...
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages */}
        <MessageList
          messages={conversation.messages}
          currentUserId={user!.id}
          isLoading={false}
        />

        {/* Message Input */}
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

      {/* Enhanced Sidebar */}
      <div className="w-96 border-l bg-gradient-to-b from-neutral-50 to-white overflow-y-auto">
        {/* Inquirer Information Section */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-neutral-600" />
            Inquirer Information
          </h3>
          
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              {inquirerProfile?.profilePicture ? (
                <img
                  src={inquirerProfile.profilePicture}
                  alt={inquirerProfile.name || "User"}
                  className="h-14 w-14 rounded-full object-cover border-2 border-neutral-200"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                  {inquirerProfile?.name?.[0] || inquirerProfile?.username?.[0] || '?'}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-neutral-900 text-lg">
                  {inquirerProfile?.name || inquirerProfile?.username}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {inquirerProfile?.emailVerified ? (
                    <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckBadgeIcon className="h-3 w-3 mr-1" />
                      Verified Student
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-neutral-600">
                <CalendarIcon className="h-4 w-4 mr-3 text-neutral-400" />
                <span>Member since {inquirerProfile?.dateJoined 
                  ? new Date(inquirerProfile.dateJoined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : "Unknown"}</span>
              </div>
              
              {inquirerProfile?.university && (
                <div className="flex items-center text-neutral-600">
                  <AcademicCapIcon className="h-4 w-4 mr-3 text-neutral-400" />
                  <span>{inquirerProfile.university.name}</span>
                </div>
              )}
              
              {inquirerProfile?.email && (
                <div className="flex items-center text-neutral-600">
                  <EnvelopeIcon className="h-4 w-4 mr-3 text-neutral-400" />
                  <span className="truncate">{inquirerProfile.email}</span>
                </div>
              )}
            </div>
            
            {/* Tenant Score/Rating */}
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Tenant Score</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-neutral-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium text-neutral-900">4.5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Details Section */}
        {property && (
          <div className="p-6 border-b">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2 text-neutral-600" />
              Property Details
            </h3>
            
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              {property.mainImage && (
                <div className="relative h-40 w-full">
                  <PropertyImage
                    image={property.mainImage}
                    alt={property.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-semibold text-white text-lg mb-1">{property.title}</p>
                    <p className="text-white/90 text-sm flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      {property.address}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Monthly Rent</span>
                  <span className="font-semibold text-primary-600 text-lg">${property.rentAmount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Bedrooms</span>
                  <span className="font-medium">{property.bedrooms} bed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Bathrooms</span>
                  <span className="font-medium">{property.bathrooms} bath</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Available</span>
                  <span className="font-medium">
                    {new Date(property.availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-6">
          <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
            <LightBulbIcon className="h-5 w-5 mr-2 text-neutral-600" />
            Quick Actions
          </h3>
          
          <div className="space-y-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="w-full text-left px-4 py-3 text-sm rounded-lg bg-white hover:bg-neutral-50 transition-colors flex items-center border border-neutral-200 text-gray-800"
            >
              <ChatBubbleLeftIcon className="h-5 w-5 mr-3 text-primary-500" />
              <span className="flex-1">Send Template Response</span>
              <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
            </button>
            
            <button
              onClick={() => router.push(`/dashboard/properties/${property?.id}/applications`)}
              className="w-full text-left px-4 py-3 text-sm rounded-lg bg-white hover:bg-neutral-50 transition-colors flex items-center border border-neutral-200 text-gray-800"
            >
              <DocumentCheckIcon className="h-5 w-5 mr-3 text-green-500" />
              <span className="flex-1">View Application</span>
              <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
            </button>
            
            <button
              onClick={() => updateConversationStatus("archived")}
              className="w-full text-left px-4 py-3 text-sm rounded-lg bg-white hover:bg-neutral-50 transition-colors flex items-center border border-neutral-200 text-gray-800"
              disabled={conversation.status === "archived"}
            >
              <ArchiveBoxIcon className="h-5 w-5 mr-3 text-neutral-500" />
              <span className="flex-1">Archive Conversation</span>
              <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
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