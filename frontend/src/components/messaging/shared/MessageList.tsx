// frontend/src/components/messaging/shared/MessageList.tsx
import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { formatters } from "@/utils/formatters";
import type { Message } from "@/types/api";

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  onUserClick?: (userId: number) => void;
  isLoading?: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  onUserClick,
  isLoading = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500">No messages yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            Start the conversation!
          </p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 px-6 py-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="flex justify-center my-4">
            <span className="px-3 py-1 bg-white border border-neutral-200 rounded-full text-xs text-neutral-600">
              {formatters.date.full(date)}
            </span>
          </div>
          
          {dateMessages.map((message, index) => {
            const showAvatar = 
              index === 0 || 
              dateMessages[index - 1]?.sender !== message.sender;
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender === currentUserId}
                showAvatar={showAvatar}
                onAvatarClick={() => onUserClick?.(message.sender)}
              />
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}