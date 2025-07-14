// frontend/src/components/messaging/shared/MessageList.tsx
import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { formatters } from "@/utils/formatters";
import type { Message } from "@/types/api";
import { CalendarIcon, SparklesIcon } from "@heroicons/react/24/outline";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-neutral-50 to-white">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <SparklesIcon className="h-6 w-6 text-primary-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-sm text-neutral-600 mt-4">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-neutral-50 to-white">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="h-10 w-10 text-neutral-400" />
          </div>
          <p className="text-lg font-medium text-neutral-700 mb-2">No messages yet</p>
          <p className="text-sm text-neutral-500">
            Start the conversation! Say hello and introduce yourself.
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

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const formatDateSeparator = (dateString: string) => {
    if (dateString === today) return "Today";
    if (dateString === yesterday) return "Yesterday";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gradient-to-b from-neutral-50 to-white"
    >
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome message for new conversations */}
        {messages.length === 1 && (
          <div className="text-center mb-8 animate-in fade-in duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mb-4">
              <SparklesIcon className="h-8 w-8 text-primary-600" />
            </div>
            <p className="text-lg font-medium text-neutral-700 mb-1">Conversation Started!</p>
            <p className="text-sm text-neutral-500">Remember to keep all communication on UniHousing</p>
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-6 first:mt-0">
              <div className="flex items-center bg-white shadow-sm text-neutral-600 text-sm px-4 py-1.5 rounded-full border border-neutral-200">
                <CalendarIcon className="h-3.5 w-3.5 mr-2 text-neutral-400" />
                {formatDateSeparator(date)}
              </div>
            </div>
            
            {/* Messages for this date */}
            {dateMessages.map((message, index) => {
              const showAvatar = 
                index === 0 || 
                dateMessages[index - 1]?.sender !== message.sender;
              
              const isFirstInGroup = showAvatar;
              const isLastInGroup = 
                index === dateMessages.length - 1 || 
                dateMessages[index + 1]?.sender !== message.sender;
              
              return (
                <div
                  key={message.id}
                  className={`
                    ${isFirstInGroup ? 'mt-4' : 'mt-1'}
                    ${isLastInGroup ? 'mb-4' : 'mb-1'}
                  `}
                >
                  <MessageBubble
                    message={message}
                    isOwn={message.sender === currentUserId}
                    showAvatar={showAvatar}
                    onAvatarClick={() => onUserClick?.(message.sender)}
                  />
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Typing indicator placeholder */}
        <div id="typing-indicator" />
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}