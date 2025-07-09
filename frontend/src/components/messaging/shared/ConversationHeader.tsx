// frontend/src/components/messaging/shared/ConversationHeader.tsx
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  FlagIcon,
  CheckBadgeIcon,
  EllipsisHorizontalIcon,
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
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-neutral-600" />
            </button>

            <div className="flex items-center space-x-3">
              {/* Avatar */}
              {otherParticipant.profilePicture ? (
                <img
                  src={otherParticipant.profilePicture}
                  alt={otherParticipant.name || otherParticipant.username}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {otherParticipant.name?.[0] || 
                     otherParticipant.firstName?.[0] || 
                     otherParticipant.username?.[0] || 
                     '?'}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold text-neutral-900">
                    {otherParticipant.name || 
                     otherParticipant.firstName || 
                     otherParticipant.username}
                  </h2>
                  {otherParticipant.emailVerified && (
                    <CheckBadgeIcon className="h-5 w-5 text-primary-500" />
                  )}
                </div>
                <p className="text-sm text-neutral-600">
                  {otherParticipant.isOnline ? (
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                      Online
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
            {showPropertyButton && conversation.propertyDetails && (
              <button
                onClick={() =>
                  router.push(`/properties/${conversation.propertyDetails!.id}`)
                }
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="View Property"
              >
                <BuildingOfficeIcon className="h-5 w-5 text-neutral-600" />
              </button>
            )}

            {additionalActions}

            <button
              onClick={onFlag}
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
    </>
  );
}