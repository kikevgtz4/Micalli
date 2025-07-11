// frontend/src/app/(main)/messages/[id]/page.tsx
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
  PhotoIcon,
  FaceSmileIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import PolicyWarning from "@/components/messaging/PolicyWarning";
import { MessageBubble } from "@/components/messaging/shared/MessageBubble";
import { ConversationHeader } from "@/components/messaging/shared/ConversationHeader";
import type { ConversationDetail, Message } from "@/types/api";

export default function StudentConversationPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPolicyWarning, setShowPolicyWarning] = useState(false);
  const [contentViolations, setContentViolations] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/messages/${conversationId}`);
      return;
    }

    fetchConversation();
    markAsRead();
  }, [conversationId, isAuthenticated]);

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

      // Check for content warnings
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

  const handleFlagConversation = () => {
    // TODO: Implement flag modal
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

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-neutral-600">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const messageGroups = groupMessagesByDate(conversation.messages);
  const today = new Date().toDateString();

  return (
    <div className="flex h-screen bg-neutral-50">
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full bg-white shadow-xl">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <ConversationHeader
            conversation={conversation}
            onBack={() => router.push("/messages")}
            onFlag={handleFlagConversation}
          />
        </div>

        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-50 to-white"
        >
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {Object.entries(messageGroups).map(([date, messages]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center my-6 first:mt-0">
                  <div className="bg-white shadow-sm text-neutral-600 text-sm px-4 py-1.5 rounded-full border border-neutral-200">
                    {date === today ? "Today" : 
                     date === new Date(Date.now() - 86400000).toDateString() ? "Yesterday" : 
                     new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Messages for this date */}
                {messages.map((msg, index) => {
                  const isOwn = msg.sender === user?.id;
                  const showAvatar =
                    index === 0 || messages[index - 1].sender !== msg.sender;
                  const isLastInGroup = 
                    index === messages.length - 1 || messages[index + 1].sender !== msg.sender;

                  return (
                    <div
                      key={msg.id}
                      className={`flex mb-1 ${isOwn ? "justify-end" : "justify-start"} ${isLastInGroup ? "mb-4" : ""}`}
                    >
                      {!isOwn && showAvatar && (
                        <div className="mr-3 flex-shrink-0">
                          {msg.senderDetails.profilePicture ? (
                            <img
                              src={msg.senderDetails.profilePicture}
                              alt={msg.senderDetails.name || msg.senderDetails.username}
                              className="h-10 w-10 rounded-full object-cover shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium shadow-sm">
                              {msg.senderDetails.name?.[0] || 
                               msg.senderDetails.firstName?.[0] || 
                               msg.senderDetails.username?.[0] || 
                               '?'}
                            </div>
                          )}
                        </div>
                      )}

                      {!isOwn && !showAvatar && <div className="w-10 mr-3 flex-shrink-0"></div>}

                      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                        <div
                          className={`px-4 py-2.5 shadow-sm ${
                            isOwn
                              ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl rounded-br-md"
                              : "bg-white text-neutral-900 rounded-2xl rounded-bl-md border border-neutral-200"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {msg.hasFilteredContent && msg.filteredContent
                              ? msg.filteredContent
                              : msg.content}
                          </p>
                        </div>

                        {/* Show time only for last message in group */}
                        {isLastInGroup && (
                          <div className="flex items-center space-x-2 mt-1 px-1">
                            <span className="text-xs text-neutral-500">
                              {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                            {isOwn && msg.read && (
                              <span className="text-xs text-primary-500">Read</span>
                            )}
                            {msg.hasFilteredContent && (
                              <span className="text-xs text-yellow-600">(filtered)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
                <span className="text-sm text-neutral-500">typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Enhanced Message Input */}
        {conversation.canSendMessage ? (
          <div className="bg-white border-t">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-end space-x-3">
                <div className="flex space-x-2">
                  <button
                    className="p-2.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Attach file (coming soon)"
                    disabled
                  >
                    <PaperClipIcon className="h-5 w-5 text-neutral-400" />
                  </button>
                  <button
                    className="p-2.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Add photo (coming soon)"
                    disabled
                  >
                    <PhotoIcon className="h-5 w-5 text-neutral-400" />
                  </button>
                </div>

                <div className="flex-1 relative">
                  <textarea
                    ref={messageInputRef}
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-3 pr-12 bg-neutral-100 border-0 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    style={{ minHeight: "44px" }}
                  />
                  <button
                    className="absolute right-2 bottom-2 p-1.5 hover:bg-neutral-200 rounded-lg transition-colors"
                    title="Add emoji"
                  >
                    <FaceSmileIcon className="h-5 w-5 text-neutral-400" />
                  </button>
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending}
                  className={`p-3 rounded-xl transition-all transform ${
                    message.trim() && !isSending
                      ? "bg-gradient-to-r from-primary-500 to-primary-600 hover:shadow-lg hover:scale-105 text-white"
                      : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  }`}
                >
                  {isSending ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <PaperAirplaneIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center mt-3">
                <p className="text-xs text-neutral-500 flex items-center">
                  <InformationCircleIcon className="h-3 w-3 mr-1" />
                  Keep all communication on UniHousing for your safety
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-t border-yellow-200 px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-sm text-yellow-800 flex items-center justify-center">
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