// frontend/src/components/messaging/shared/MessageBubble.tsx
import { CheckIcon } from "@heroicons/react/24/outline";
import { formatters } from "@/utils/formatters";
import type { Message } from "@/types/api";

interface MessageBubbleProps {
  message: Message;
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
    <div className={`flex mb-4 ${isOwn ? "justify-end" : "justify-start"}`}>
      {!isOwn && showAvatar && (
        <div className="mr-3 flex-shrink-0">
          {message.senderDetails.profilePicture ? (
            <img
              src={message.senderDetails.profilePicture}
              alt={message.senderDetails.name || message.senderDetails.username}
              className="h-8 w-8 rounded-full cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all"
              onClick={onAvatarClick}
            />
          ) : (
            <div 
              className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all"
              onClick={onAvatarClick}
            >
              <span className="text-xs font-medium text-neutral-600">
                {message.senderDetails.name?.[0] || 
                 message.senderDetails.firstName?.[0] || 
                 message.senderDetails.username?.[0] || 
                 '?'}
              </span>
            </div>
          )}
        </div>
      )}

      {!isOwn && !showAvatar && <div className="w-8 mr-3 flex-shrink-0"></div>}

      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {showSenderName && !isOwn && (
          <span className="text-xs text-neutral-500 mb-1 px-1">
            {message.senderDetails.name || message.senderDetails.username}
          </span>
        )}
        
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-primary-500 text-white"
              : "bg-white border border-neutral-200"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.hasFilteredContent && message.filteredContent
              ? message.filteredContent
              : message.content}
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-1 px-1">
          <span className="text-xs text-neutral-500">
            {formatMessageTime(message.createdAt)}
          </span>
          {isOwn && message.read && (
            <CheckIcon className="h-3 w-3 text-primary-500" />
          )}
          {message.hasFilteredContent && (
            <span className="text-xs text-yellow-600">(filtered)</span>
          )}
        </div>
      </div>
    </div>
  );
}