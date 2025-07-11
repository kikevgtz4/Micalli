// frontend/src/components/messaging/shared/ConversationListItem.tsx
import { formatters } from "@/utils/formatters";
import PropertyImage from "@/components/common/PropertyImage";
import type { Conversation } from "@/types/api";
import {
  BuildingOfficeIcon,
  UsersIcon,
  CheckBadgeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

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

  const getStatusIcon = () => {
    switch (conversation.status) {
      case 'pending_response':
        return <ClockIcon className="h-4 w-4 text-orange-500 animate-pulse" />;
      case 'booking_confirmed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'flagged':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getConversationTypeIcon = () => {
    if (conversation.conversationType === "roommate_inquiry") {
      return <UsersIcon className="h-5 w-5 text-purple-500" />;
    }
    return <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative group
        ${compact ? 'p-3' : 'p-5'}
        ${isUnread ? 'bg-gradient-to-r from-blue-50/50 to-transparent' : 'bg-white hover:bg-neutral-50'}
        transition-all duration-200 cursor-pointer
        ${!compact && 'hover:shadow-md'}
        animate-in slide-in-from-left-2 duration-300
      `}
    >
      {/* Unread indicator bar */}
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600"></div>
      )}
      
      <div className="flex items-start gap-3">
        {/* Avatar/Property Image */}
        <ConversationAvatar 
          conversation={conversation} 
          size={compact ? 'sm' : 'md'} 
        />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <ConversationHeader 
            conversation={conversation} 
            showPropertyInfo={showPropertyInfo}
            compact={compact}
            isUnread={isUnread}
            statusIcon={getStatusIcon()}
          />
          
          {/* Latest Message */}
          {latestMessage && (
            <p className={`
              text-sm truncate mt-1.5
              ${isUnread && !isOwnMessage ? 'font-semibold text-neutral-900' : 'text-neutral-600'}
            `}>
              {isOwnMessage && <span className="text-neutral-400 font-normal">You: </span>}
              {latestMessage.hasFilteredContent ? (
                <span className="italic text-amber-600">Message filtered for policy violation</span>
              ) : (
                latestMessage.content
              )}
            </p>
          )}
          
          {/* Additional Info */}
          {!compact && (
            <div className="flex items-center gap-3 mt-2">
              {conversation.status && conversation.status !== 'active' && (
                <span className={`
                  inline-flex items-center text-xs font-medium
                  ${conversation.status === 'pending_response' ? 'text-orange-600' : ''}
                  ${conversation.status === 'booking_confirmed' ? 'text-green-600' : ''}
                  ${conversation.status === 'archived' ? 'text-neutral-500' : ''}
                `}>
                  {getStatusIcon()}
                  <span className="ml-1">
                    {conversation.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </span>
              )}
              
              {conversation.hasFlaggedContent && (
                <span className="inline-flex items-center text-xs text-red-600 font-medium">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  Flagged content
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Meta Info */}
        <ConversationMeta 
          conversation={conversation} 
          compact={compact}
        />
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
    sm: 'h-12 w-12',
    md: 'h-14 w-14',
    lg: 'h-16 w-16'
  };

  const avatarSize = sizeClasses[size];

  if (conversation.propertyDetails?.mainImage) {
    return (
      <div className={`relative ${avatarSize} rounded-xl overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
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
      <div className="relative flex-shrink-0">
        <img
          src={conversation.otherParticipant.profilePicture}
          alt={conversation.otherParticipant.name || 'User'}
          className={`${avatarSize} rounded-xl object-cover shadow-sm group-hover:shadow-md transition-shadow`}
        />
        {conversation.otherParticipant.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
        )}
      </div>
    );
  }

  // Default avatar with initials
  const initials = conversation.otherParticipant?.name?.[0] || 
                   conversation.otherParticipant?.firstName?.[0] || 
                   '?';

  return (
    <div className={`relative ${avatarSize} rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-all`}>
      <span className="text-primary-600 font-semibold text-lg">
        {initials}
      </span>
      {conversation.otherParticipant?.isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
      )}
    </div>
  );
}

function ConversationHeader({ 
  conversation, 
  showPropertyInfo,
  compact,
  isUnread,
  statusIcon
}: { 
  conversation: Conversation; 
  showPropertyInfo?: boolean;
  compact?: boolean;
  isUnread?: boolean;
  statusIcon?: React.ReactNode;
}) {
  const title = conversation.propertyDetails?.title || 
                conversation.otherParticipant?.name ||
                conversation.otherParticipant?.firstName ||
                'Unknown';

  const getConversationTypeIcon = () => {
    if (conversation.conversationType === "roommate_inquiry") {
      return <UsersIcon className="h-4 w-4 text-purple-500" />;
    }
    return <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className={`
          font-semibold text-neutral-900 truncate 
          ${compact ? 'text-sm' : 'text-base'}
          ${isUnread ? 'font-bold' : ''}
        `}>
          {title}
        </h3>
        
        {conversation.otherParticipant?.emailVerified && (
          <CheckBadgeIcon className="h-4 w-4 text-green-500 flex-shrink-0" title="Verified" />
        )}
        
        {statusIcon}
        
        {conversation.conversationType && (
          <div className="flex-shrink-0">
            {getConversationTypeIcon()}
          </div>
        )}
      </div>
      
      {showPropertyInfo && conversation.propertyDetails && (
        <p className="text-xs text-neutral-600 truncate mt-0.5">
          <span className="font-medium text-primary-600">
            ${formatters.number(conversation.propertyDetails.rentAmount)}/mo
          </span>
          <span className="mx-1.5 text-neutral-400">•</span>
          <span>{conversation.propertyDetails.address}</span>
        </p>
      )}
    </div>
  );
}

function ConversationMeta({ 
  conversation, 
  compact 
}: { 
  conversation: Conversation;
  compact?: boolean;
}) {
  const timeAgo = formatters.date.relative(conversation.updatedAt);
  const isRecent = Date.now() - new Date(conversation.updatedAt).getTime() < 3600000; // 1 hour

  return (
    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
      <span className={`
        text-xs
        ${conversation.unreadCount > 0 ? 'text-primary-600 font-semibold' : 'text-neutral-500'}
        ${isRecent && !conversation.unreadCount ? 'text-neutral-700' : ''}
      `}>
        {timeAgo}
      </span>
      
      {conversation.unreadCount > 0 && (
        <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs rounded-full font-semibold shadow-sm animate-in zoom-in-50 duration-200">
          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
        </span>
      )}
      
      {!compact && conversation.ownerResponseTime && (
        <span className="text-xs text-green-600 font-medium">
          Responded quickly
        </span>
      )}
    </div>
  );
}

// Export sub-components for flexibility
export { ConversationAvatar, ConversationHeader, ConversationMeta };