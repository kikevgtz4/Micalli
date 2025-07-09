// frontend/src/app/(dashboard)/dashboard/messages/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import apiService from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  InformationCircleIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import PolicyWarning from "@/components/messaging/PolicyWarning";
import { MessageBubble } from "@/components/messaging/shared/MessageBubble";
import { ConversationHeader } from "@/components/messaging/shared/ConversationHeader";
import { withRole } from "@/contexts/AuthContext";
import { getMessageTemplate, TEMPLATE_TYPES } from "@/utils/constants";
import type { ConversationDetail, Message } from "@/types/api";

function PropertyOwnerConversationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPolicyWarning, setShowPolicyWarning] = useState(false);
  const [contentViolations, setContentViolations] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  // Owner-specific state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const conversationStartTime = useRef<Date | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchConversation();
    markAsRead();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const fetchConversation = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.messaging.getConversation(
        parseInt(conversationId)
      );
      setConversation(response.data);
      
      // Track response time if this is the first response
      if (response.data.status === 'pending_response' && !conversationStartTime.current) {
        conversationStartTime.current = new Date(response.data.createdAt);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast.error("Failed to load conversation");
      router.push("/dashboard/messages");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await apiService.messaging.markConversationRead(parseInt(conversationId));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await apiService.messaging.sendMessage(
        parseInt(conversationId),
        message.trim()
      );

      // Check for content warnings
      if (response.data.contentWarning) {
        setContentViolations(response.data.contentWarning.violations);
        setShowPolicyWarning(true);
        setIsSending(false);
        return;
      }

      // Success
      const newMessage = response.data;
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMessage],
              status: prev.status === 'pending_response' ? 'active' : prev.status,
            }
          : null
      );

      // Track response time
      if (conversation?.status === 'pending_response' && conversationStartTime.current) {
        const responseTime = new Date().getTime() - conversationStartTime.current.getTime();
        console.log('Response time:', Math.round(responseTime / 1000 / 60), 'minutes');
      }

      setMessage("");
      setShowTemplates(false);
      messageInputRef.current?.focus();
    } catch (error: any) {
      if (error.response?.data?.violations) {
        setContentViolations(error.response.data.violations);
        setShowPolicyWarning(true);
      } else {
        toast.error("Failed to send message");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTemplateSelect = (templateType: string) => {
    const template = getMessageTemplate(templateType as any);
    if (template && conversation) {
      let filledContent = template.content
        .replace("{property_title}", conversation.propertyDetails?.title || "")
        .replace("{move_in_date}", "[Please specify]")
        .replace("{duration}", "[Please specify]")
        .replace("{occupants}", "[Please specify]");
      
      setMessage(filledContent);
      setSelectedTemplate(templateType);
      setShowTemplates(false);
      messageInputRef.current?.focus();
    }
  };

  const updateConversationStatus = async (newStatus: string) => {
    if (!conversation) return;
    
    setIsUpdatingStatus(true);
    try {
      // This would be a real API call to update status
      // await apiService.messaging.updateConversationStatus(conversation.id, newStatus);
      
      setConversation({ ...conversation, status: newStatus });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFlagConversation = () => {
    toast("Report feature coming soon");
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach((msg) => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  // Additional actions for owner header
  const additionalHeaderActions = (
    <>
      <select
        value={conversation?.status || 'active'}
        onChange={(e) => updateConversationStatus(e.target.value)}
        className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5"
        disabled={isUpdatingStatus}
      >
        <option value="active">Active</option>
        <option value="pending_response">Pending Response</option>
        <option value="application_submitted">Application Submitted</option>
        <option value="booking_confirmed">Booking Confirmed</option>
        <option value="archived">Archived</option>
      </select>
    </>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen bg-neutral-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const messageGroups = groupMessagesByDate(conversation.messages);

  return (
    <div className="flex h-screen bg-neutral-50">
      <div className="flex-1 flex flex-col">
        {/* Header with owner-specific actions */}
        <ConversationHeader
          conversation={conversation}
          onBack={() => router.push("/dashboard/messages")}
          onFlag={handleFlagConversation}
          additionalActions={additionalHeaderActions}
        />

        {/* Response Time Alert */}
        {conversation.status === 'pending_response' && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  This inquiry is awaiting your response
                </span>
              </div>
              <button
                onClick={() => setShowTemplates(true)}
                className="text-sm text-yellow-700 font-medium hover:text-yellow-800"
              >
                Use Quick Response →
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {Object.entries(messageGroups).map(([date, messages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-neutral-200 text-neutral-600 text-xs px-3 py-1 rounded-full">
                  {date === new Date().toDateString() ? "Today" : date}
                </div>
              </div>

              {/* Messages */}
              {messages.map((msg, index) => {
                const isOwn = msg.sender === user?.id;
                const showAvatar =
                  index === 0 || messages[index - 1].sender !== msg.sender;

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                  />
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Response Templates */}
        {showTemplates && (
          <div className="bg-white border-t border-b px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-neutral-900">Quick Responses</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATE_TYPES.filter(type => type !== 'initial_inquiry').map((templateType) => {
                const template = getMessageTemplate(templateType);
                return (
                  <button
                    key={templateType}
                    onClick={() => handleTemplateSelect(templateType)}
                    className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-start space-x-2">
                      <DocumentTextIcon className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-neutral-900">
                          {template.title}
                        </p>
                        <p className="text-xs text-neutral-600 mt-0.5">
                          Quick template for common inquiries
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Input */}
        {conversation.canSendMessage ? (
          <div className="bg-white border-t px-6 py-4">
            <div className="flex items-center space-x-2 mb-3">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                Quick Response
              </button>
              {conversation.status !== 'archived' && (
                <button
                  onClick={() => updateConversationStatus('archived')}
                  className="text-sm text-neutral-600 hover:text-neutral-700 font-medium flex items-center"
                >
                  <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                  Archive
                </button>
              )}
            </div>

            <div className="flex items-end space-x-3">
              <button
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Attach file (coming soon)"
                disabled
              >
                <PaperClipIcon className="h-5 w-5 text-neutral-400" />
              </button>

              <div className="flex-1">
                <textarea
                  ref={messageInputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  style={{ minHeight: "40px", maxHeight: "120px" }}
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isSending}
                className={`p-2 rounded-lg transition-colors ${
                  message.trim() && !isSending
                    ? "bg-primary-500 hover:bg-primary-600 text-white"
                    : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                }`}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 mt-2 flex items-center">
              <InformationCircleIcon className="h-3 w-3 mr-1" />
              Keep all communication on UniHousing for your safety
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-4">
            <p className="text-sm text-yellow-800 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              This conversation has been archived or flagged. You cannot send new messages.
            </p>
          </div>
        )}
      </div>

      {/* Policy Warning Modal */}
      {showPolicyWarning && (
        <PolicyWarning
          violations={contentViolations}
          onRevise={() => setShowPolicyWarning(false)}
          isBlocked={contentViolations.some((v) => v.severity === "critical")}
          onAccept={
            contentViolations.some((v) => v.severity === "critical")
              ? undefined
              : () => {
                  setShowPolicyWarning(false);
                  handleSendMessage();
                }
          }
        />
      )}
    </div>
  );
}

export default withRole(['property_owner'])(PropertyOwnerConversationPage);