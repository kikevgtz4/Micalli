// frontend/src/components/messaging/shared/ConversationListItem.tsx
import { formatters } from "@/utils/formatters";
import PropertyImage from "@/components/common/PropertyImage";
import type { Conversation } from "@/types/api";

interface ConversationListItemProps {
  conversation: Conversation;
  currentUserId?: number;
  onClick: () => void;
  showPropertyInfo?: boolean;
  compact?: boolean;
}

export function ConversationListItem({
  conversation,
  currentUserId,
  onClick,
  showPropertyInfo = true,
  compact = false
}: ConversationListItemProps) {
  const isUnread = conversation.unreadCount > 0;
  const latestMessage = conversation.latestMessage;
  const isOwnMessage = latestMessage?.sender === currentUserId;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white hover:bg-neutral-50 transition-colors cursor-pointer
        ${compact ? 'p-3' : 'p-4'}
        ${isUnread ? 'border-l-4 border-primary-500' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar/Property Image */}
        <ConversationAvatar conversation={conversation} size={compact ? 'sm' : 'md'} />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <ConversationHeader 
            conversation={conversation} 
            showPropertyInfo={showPropertyInfo}
            compact={compact}
          />
          
          {latestMessage && (
            <p className={`
              text-sm truncate mt-1
              ${isUnread && !isOwnMessage ? 'font-medium text-neutral-900' : 'text-neutral-600'}
            `}>
              {isOwnMessage && <span className="text-neutral-500">You: </span>}
              {latestMessage.content}
            </p>
          )}
        </div>
        
        {/* Meta Info */}
        <ConversationMeta conversation={conversation} />
      </div>
    </div>
  );
}

// Sub-components for reusability
function ConversationAvatar({ 
  conversation, 
  size = 'md' 
}: { 
  conversation: Conversation; 
  size?: 'sm' | 'md' | 'lg' 
}) {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const avatarSize = sizeClasses[size];

  if (conversation.propertyDetails?.mainImage) {
    return (
      <div className={`relative ${avatarSize} rounded-lg overflow-hidden flex-shrink-0`}>
        <PropertyImage
          image={conversation.propertyDetails.mainImage}
          alt={conversation.propertyDetails.title}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  if (conversation.otherParticipant?.profilePicture) {
    return (
      <img
        src={conversation.otherParticipant.profilePicture}
        alt={conversation.otherParticipant.name || 'User'}
        className={`${avatarSize} rounded-lg object-cover flex-shrink-0`}
      />
    );
  }

  // Default avatar with initials
  const initials = conversation.otherParticipant?.name?.[0] || 
                   conversation.otherParticipant?.firstName?.[0] || 
                   '?';

  return (
    <div className={`${avatarSize} rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0`}>
      <span className="text-primary-600 font-semibold">
        {initials}
      </span>
    </div>
  );
}

function ConversationHeader({ 
  conversation, 
  showPropertyInfo,
  compact 
}: { 
  conversation: Conversation; 
  showPropertyInfo?: boolean;
  compact?: boolean;
}) {
  const title = conversation.propertyDetails?.title || 
                conversation.otherParticipant?.name ||
                conversation.otherParticipant?.firstName ||
                'Unknown';

  return (
    <div>
      <h3 className={`font-semibold text-neutral-900 truncate ${compact ? 'text-sm' : ''}`}>
        {title}
      </h3>
      {showPropertyInfo && conversation.propertyDetails && (
        <p className="text-xs text-neutral-600 truncate">
          ${formatters.number(conversation.propertyDetails.rentAmount)}/month
        </p>
      )}
    </div>
  );
}

function ConversationMeta({ conversation }: { conversation: Conversation }) {
  return (
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <span className="text-xs text-neutral-500">
        {formatters.date.relative(conversation.updatedAt)}
      </span>
      {conversation.unreadCount > 0 && (
        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-primary-500 text-white text-xs rounded-full">
          {conversation.unreadCount}
        </span>
      )}
    </div>
  );
}

// Export sub-components for flexibility
export { ConversationAvatar, ConversationHeader, ConversationMeta };