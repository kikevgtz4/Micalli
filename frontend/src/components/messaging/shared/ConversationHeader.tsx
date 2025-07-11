// frontend/src/components/messaging/shared/ConversationHeader.tsx
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  FlagIcon,
  CheckBadgeIcon,
  EllipsisHorizontalIcon,
  VideoCameraIcon,
  PhoneIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { formatters } from "@/utils/formatters";
import PropertyImage from "@/components/common/PropertyImage";
import type { ConversationDetail } from "@/types/api";

interface ConversationHeaderProps {
  conversation: ConversationDetail;
  onBack: () => void;
  onFlag: () => void;
  showPropertyButton?: boolean;
  additionalActions?: React.ReactNode;
}

export function ConversationHeader({
  conversation,
  onBack,
  onFlag,
  showPropertyButton = true,
  additionalActions,
}: ConversationHeaderProps) {
  const router = useRouter();

  const otherParticipant = conversation.otherParticipant;
  
  if (!otherParticipant) {
    return (
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-neutral-600" />
          </button>
          <span className="text-neutral-500">Unknown participant</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2.5 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm"
            >
              <ArrowLeftIcon className="h-5 w-5 text-white" />
            </button>

            <div className="flex items-center space-x-3">
              {/* Avatar with online indicator */}
              <div className="relative">
                {otherParticipant.profilePicture ? (
                  <img
                    src={otherParticipant.profilePicture}
                    alt={otherParticipant.name || otherParticipant.username}
                    className="h-12 w-12 rounded-full object-cover border-2 border-white/30 shadow-lg"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg">
                    <span className="text-white font-semibold text-lg">
                      {otherParticipant.name?.[0] || 
                       otherParticipant.firstName?.[0] || 
                       otherParticipant.username?.[0] || 
                       '?'}
                    </span>
                  </div>
                )}
                
                {/* Online indicator */}
                {otherParticipant.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold text-white text-lg">
                    {otherParticipant.name || 
                     otherParticipant.firstName || 
                     otherParticipant.username}
                  </h2>
                  {otherParticipant.emailVerified && (
                    <div className="flex items-center bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      <CheckBadgeIcon className="h-3.5 w-3.5 text-white mr-1" />
                      <span className="text-xs text-white font-medium">Verified</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-white/80">
                  {otherParticipant.isOnline ? (
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                      Active now
                    </span>
                  ) : otherParticipant.lastSeen ? (
                    `Last seen ${formatters.date.relative(otherParticipant.lastSeen)}`
                  ) : (
                    "Offline"
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Call buttons (disabled for now) */}
            <button
              className="p-2.5 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm opacity-50 cursor-not-allowed"
              title="Voice call (coming soon)"
              disabled
            >
              <PhoneIcon className="h-5 w-5 text-white" />
            </button>
            
            <button
              className="p-2.5 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm opacity-50 cursor-not-allowed"
              title="Video call (coming soon)"
              disabled
            >
              <VideoCameraIcon className="h-5 w-5 text-white" />
            </button>

            {showPropertyButton && conversation.propertyDetails && (
              <button
                onClick={() =>
                  router.push(`/properties/${conversation.propertyDetails!.id}`)
                }
                className="p-2.5 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm"
                title="View Property"
              >
                <BuildingOfficeIcon className="h-5 w-5 text-white" />
              </button>
            )}

            {additionalActions}

            <div className="ml-2 pl-2 border-l border-white/20">
              <button
                onClick={onFlag}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm"
                title="Report Conversation"
              >
                <FlagIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Property Info Bar */}
        {conversation.propertyDetails && (
          <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-xl flex items-center space-x-3 border border-white/20">
            {conversation.propertyDetails.mainImage && (
              <div className="relative h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                <PropertyImage
                  image={conversation.propertyDetails.mainImage}
                  alt={conversation.propertyDetails.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">
                {conversation.propertyDetails.title}
              </p>
              <p className="text-sm text-white/80 flex items-center">
                <span className="font-medium">${formatters.number(conversation.propertyDetails.rentAmount)}/month</span>
                <span className="mx-2 text-white/60">•</span>
                <span className="truncate">{conversation.propertyDetails.address}</span>
              </p>
            </div>
            <button
              onClick={() => router.push(`/properties/${conversation.propertyDetails!.id}`)}
              className="flex-shrink-0 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium text-white transition-all"
            >
              View Details
            </button>
          </div>
        )}
      </div>
    </>
  );
}