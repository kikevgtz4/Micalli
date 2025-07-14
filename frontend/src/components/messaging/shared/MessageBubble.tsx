// frontend/src/components/messaging/shared/MessageBubble.tsx
import { CheckIcon } from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";
import { formatters } from "@/utils/formatters";
import type { Message } from "@/types/api";

interface ExtendedMessage extends Message {
  delivered: boolean;
  deliveredAt?: string;
  readAt?: string;
}

interface MessageBubbleProps {
  message: ExtendedMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  showSenderName?: boolean;
  onAvatarClick?: () => void;
}

export function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar = true,
  showSenderName = false,
  onAvatarClick 
}: MessageBubbleProps) {
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
        year: diffInHours > 8760 ? "numeric" : undefined,
      });
    }
  };

  return (
    <div className={`flex mb-2 ${isOwn ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
      {!isOwn && showAvatar && (
        <div className="mr-3 flex-shrink-0">
          {message.senderDetails.profilePicture ? (
            <img
              src={message.senderDetails.profilePicture}
              alt={message.senderDetails.name || message.senderDetails.username}
              className="h-10 w-10 rounded-full object-cover cursor-pointer hover:ring-4 hover:ring-primary-100 transition-all duration-200 shadow-sm"
              onClick={onAvatarClick}
            />
          ) : (
            <div 
              className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center cursor-pointer hover:ring-4 hover:ring-primary-100 transition-all duration-200 shadow-sm"
              onClick={onAvatarClick}
            >
              <span className="text-sm font-semibold text-white">
                {message.senderDetails.name?.[0] || 
                 message.senderDetails.firstName?.[0] || 
                 message.senderDetails.username?.[0] || 
                 '?'}
              </span>
            </div>
          )}
        </div>
      )}

      {!isOwn && !showAvatar && <div className="w-10 mr-3 flex-shrink-0"></div>}

      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {showSenderName && !isOwn && (
          <span className="text-xs text-neutral-600 font-medium mb-1 px-1">
            {message.senderDetails.name || message.senderDetails.username}
          </span>
        )}
        
        <div
          className={`px-4 py-2.5 shadow-sm transition-all hover:shadow-md ${
            isOwn
              ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl rounded-br-md"
              : "bg-white border border-neutral-200 text-neutral-900 rounded-2xl rounded-bl-md"
          }`}
        >
          {message.hasFilteredContent && (
            <div className={`text-xs font-medium mb-1 ${
              isOwn ? "text-white/80" : "text-amber-600"
            }`}>
              ⚠️ This message was filtered for policy violations
            </div>
          )}
          
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.hasFilteredContent && message.filteredContent
              ? message.filteredContent
              : message.content}
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-1 px-1">
          <span className={`text-xs ${isOwn ? "text-neutral-500" : "text-neutral-400"}`}>
            {formatMessageTime(message.createdAt)}
          </span>
          
          {isOwn && (
            <div className="flex items-center">
              {message.read ? (
                // Double check for read
                <div className="flex -space-x-1">
                  <CheckIcon className="h-3.5 w-3.5 text-primary-500" />
                  <CheckIcon className="h-3.5 w-3.5 text-primary-500" />
                </div>
              ) : message.delivered ? (
                // Double check for delivered (gray)
                <div className="flex -space-x-1">
                  <CheckIcon className="h-3.5 w-3.5 text-neutral-400" />
                  <CheckIcon className="h-3.5 w-3.5 text-neutral-400" />
                </div>
              ) : (
                // Single check for sent
                <CheckIcon className="h-3.5 w-3.5 text-neutral-400" />
              )}
            </div>
          )}
          
          {message.isEdited && (
            <span className="text-xs text-neutral-400 italic">edited</span>
          )}
        </div>
      </div>
    </div>
  );
}