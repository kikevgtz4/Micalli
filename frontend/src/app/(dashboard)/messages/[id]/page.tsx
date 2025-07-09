// frontend/src/app/(dashboard)/messages/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import apiService from "@/lib/api";
import { formatters } from "@/utils/formatters";
import PropertyImage from "@/components/common/PropertyImage";
import PolicyWarning from "@/components/messaging/PolicyWarning";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  InformationCircleIcon,
  FlagIcon,
  BuildingOfficeIcon,
  CheckIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface Message {
  id: number;
  content: string;
  sender: number;
  senderDetails: {
    id: number;
    username: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  read: boolean;
  messageType: string;
  hasFilteredContent: boolean;
  filteredContent?: string;
  filterWarnings?: any[];
}

interface ConversationDetail {
  id: number;
  otherParticipant: {
    id: number;
    username: string;
    name: string;
    profilePicture?: string;
    userType: string;
    isOnline: boolean;
    lastSeen?: string;
    emailVerified: boolean;
  };
  propertyDetails?: {
    id: number;
    title: string;
    address: string;
    rentAmount: number;
    mainImage?: string;
    owner: {
      id: number;
      firstName: string;
      lastName: string;
    };
  };
  messages: Message[];
  conversationType: string;
  status: string;
  canSendMessage: boolean;
}

export default function ConversationDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPolicyWarning, setShowPolicyWarning] = useState(false);
  const [contentViolations, setContentViolations] = useState<any[]>([]);

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
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast.error("Failed to load conversation");
      router.push("/messages");
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

      // Check for content warnings in response
      if (response.data.contentWarning) {
        setContentViolations(response.data.contentWarning.violations);
        setShowPolicyWarning(true);
        setIsSending(false);
        return;
      }

      // Success - add message to conversation
      const newMessage = response.data;
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMessage],
            }
          : null
      );

      setMessage("");
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

  const handleFlagConversation = async () => {
    // TODO: Implement flag conversation modal
    toast("Flag feature coming soon");
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
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

  if (isLoading) {
    return (
      <div className="flex h-screen bg-neutral-50">
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b px-6 py-4">
            <div className="animate-pulse flex items-center space-x-4">
              <div className="h-10 w-10 bg-neutral-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
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
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/messages")}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-neutral-600" />
              </button>

              <div className="flex items-center space-x-3">
                {/* Avatar */}
                {conversation.otherParticipant.profilePicture ? (
                  <img
                    src={conversation.otherParticipant.profilePicture}
                    alt={conversation.otherParticipant.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {conversation.otherParticipant.name[0]}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-semibold text-neutral-900">
                      {conversation.otherParticipant.name}
                    </h2>
                    {conversation.otherParticipant.emailVerified && (
                      <CheckBadgeIcon className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">
                    {conversation.otherParticipant.isOnline ? (
                      <span className="flex items-center">
                        <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                        Online
                      </span>
                    ) : conversation.otherParticipant.lastSeen ? (
                      `Last seen ${formatters.date.relative(
                        conversation.otherParticipant.lastSeen
                      )}`
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {conversation.propertyDetails && (
                <button
                  onClick={() =>
                    router.push(
                      `/properties/${conversation.propertyDetails!.id}`
                    )
                  }
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="View Property"
                >
                  <BuildingOfficeIcon className="h-5 w-5 text-neutral-600" />
                </button>
              )}

              <button
                onClick={handleFlagConversation}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Report Conversation"
              >
                <FlagIcon className="h-5 w-5 text-neutral-600" />
              </button>
            </div>
          </div>

          {/* Property Info Bar */}
          {conversation.propertyDetails && (
            <div className="mt-3 p-3 bg-neutral-50 rounded-lg flex items-center space-x-3">
              {conversation.propertyDetails.mainImage && (
                <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                  <PropertyImage
                    image={conversation.propertyDetails.mainImage}
                    alt={conversation.propertyDetails.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-neutral-900 truncate">
                  {conversation.propertyDetails.title}
                </p>
                <p className="text-xs text-neutral-600">
                  ${formatters.number(conversation.propertyDetails.rentAmount)}
                  /month • {conversation.propertyDetails.address}
                </p>
              </div>
            </div>
          )}
        </div>

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

              {/* Messages for this date */}
              {messages.map((msg, index) => {
                const isOwn = msg.sender === user?.id;
                const showAvatar =
                  index === 0 || messages[index - 1].sender !== msg.sender;

                return (
                  <div
                    key={msg.id}
                    className={`flex mb-4 ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isOwn && showAvatar && (
                      <div className="mr-3 flex-shrink-0">
                        {msg.senderDetails.profilePicture ? (
                          <img
                            src={msg.senderDetails.profilePicture}
                            alt={msg.senderDetails.name}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-neutral-600">
                              {msg.senderDetails.name[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {!isOwn && !showAvatar && (
                      <div className="w-8 mr-3 flex-shrink-0"></div>
                    )}

                    <div
                      className={`max-w-[70%] ${
                        isOwn ? "items-end" : "items-start"
                      } flex flex-col`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? "bg-primary-500 text-white"
                            : "bg-white border border-neutral-200"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.hasFilteredContent && msg.filteredContent
                            ? msg.filteredContent
                            : msg.content}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 mt-1 px-1">
                        <span className="text-xs text-neutral-500">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                        {isOwn && msg.read && (
                          <CheckIcon className="h-3 w-3 text-primary-500" />
                        )}
                        {msg.hasFilteredContent && (
                          <span className="text-xs text-yellow-600">
                            (filtered)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {conversation.canSendMessage ? (
          <div className="bg-white border-t px-6 py-4">
            <div className="flex items-end space-x-3">
              <button
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Attach file"
              >
                <PaperClipIcon className="h-5 w-5 text-neutral-600" />
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
              This conversation has been archived or flagged. You cannot send
              new messages.
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
                  // Retry sending with acknowledgment
                  handleSendMessage();
                }
          }
        />
      )}
    </div>
  );
}
