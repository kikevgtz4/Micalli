// frontend/src/app/(main)/messages/[id]/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useConversation } from "@/hooks/messaging/useConversation";
import { useMessageFiltering } from "@/hooks/messaging/useMessageFiltering";
import { MessageList } from "@/components/messaging/shared/MessageList";
import { MessageInput } from "@/components/messaging/shared/MessageInput";
import { ConversationHeader } from "@/components/messaging/shared/ConversationHeader";
import { TypingIndicator } from "@/components/messaging/shared/TypingIndicator";
import { ConnectionStatus } from "@/components/messaging/shared/ConnectionStatus";
import PolicyWarning from "@/components/messaging/PolicyWarning";
import { toast } from "react-hot-toast";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export default function StudentConversationPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = Number(params.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the WebSocket-enabled hook - IT ALREADY HAS WEBSOCKET INTEGRATED!
  const {
    conversation,
    isLoading,
    isSending,
    isConnected,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
  } = useConversation(conversationId, {
    enableWebSocket: true, // This enables WebSocket!
    onUnauthorized: () => router.push(`/login?redirect=/messages/${conversationId}`),
  });

  // Message filtering hook
  const {
    showWarning,
    violations,
    pendingMessage,
    isBlocked,
    handleFilterResult,
    handleRevise,
    handleProceed,
    reset,
  } = useMessageFiltering();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/messages/${conversationId}`);
      return;
    }
  }, [isAuthenticated, conversationId, router]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSendMessage = async (content: string, metadata?: any) => {
    const result = await sendMessage(content, metadata);
    
    if (!result.success) {
      if (result.error === 'content_warning' || result.error === 'policy_violation') {
        handleFilterResult(
          result.data,
          content,
          () => sendMessage(content, metadata)
        );
      } else {
        toast.error('Failed to send message');
      }
    } else {
      reset();
    }
  };

  const handleFlagConversation = () => {
    toast("Report feature coming soon");
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

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Connection Status - Shows when disconnected */}
      <ConnectionStatus isConnected={isConnected} isConnecting={!isConnected && !isLoading} />
      
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full bg-white shadow-xl">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <ConversationHeader
            conversation={conversation}
            onBack={() => router.push("/messages")}
            onFlag={handleFlagConversation}
          />
        </div>

        {/* Messages Container with scroll */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-50 to-white">
          <MessageList
            messages={conversation.messages}
            currentUserId={user!.id}
            onUserClick={(userId) => console.log('User clicked:', userId)}
            isLoading={false}
          />
          
          {/* Typing Indicator - Shows when other user is typing */}
          {typingUsers.size > 0 && (
            <div className="px-4 sm:px-6 lg:px-8 pb-2">
              <TypingIndicator
                typingUsers={typingUsers}
                participants={conversation.participantsDetails}
                currentUserId={user!.id}
              />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Message Input with typing indicators */}
        {conversation.canSendMessage ? (
          <MessageInput
            onSendMessage={handleSendMessage}
            onStartTyping={startTyping}
            onStopTyping={stopTyping}
            disabled={!isConnected || isSending}
            placeholder={
              !isConnected 
                ? "Connecting..." 
                : "Type a message..."
            }
            showAttachment={true}
          />
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
      {showWarning && (
        <PolicyWarning
          violations={violations}
          onRevise={handleRevise}
          isBlocked={isBlocked}
          onAccept={!isBlocked ? handleProceed : undefined}
        />
      )}
    </div>
  );
}