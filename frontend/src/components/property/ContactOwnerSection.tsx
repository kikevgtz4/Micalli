// frontend/src/components/property/ContactOwnerSection.tsx
import { useState } from "react";
import { Property } from "@/types/api";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from "next/navigation";
import {
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  ClockIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import ContactOwnerModal from "../messaging/ContactOwnerModal";
import PropertyImage from "@/components/common/PropertyImage";
import { formatters } from "@/utils/formatters";

interface ContactOwnerSectionProps {
  property: Property;
}

export default function ContactOwnerSection({
  property,
}: ContactOwnerSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showContactModal, setShowContactModal] = useState(false);

  // Don't show if user is the owner
  if (user?.id === property.owner.id) {
    return null;
  }

  const handleContactClick = () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/properties/${property.id}`);
      return;
    }
    setShowContactModal(true);
  };

  const handleContactSuccess = (conversationId: number) => {
    // Redirect to the conversation
    router.push(`/messages/${conversationId}`);
  };

  // Calculate owner stats (would come from API in real implementation)
  const ownerStats = {
    responseTime: "2 hours",
    responseRate: 95,
    memberSince: new Date(property.owner.dateJoined || new Date()), // Fixed: use dateJoined
    totalProperties: 1,
    rating: 4.8,
  };

  return (
    <>
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        {/* Owner Info Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Owner Avatar */}
            <div className="relative">
              {property.owner.profilePicture ? (
                <PropertyImage
                  image={property.owner.profilePicture}
                  alt={`${property.owner.firstName} ${property.owner.lastName}`}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    {property.owner.firstName?.[0]}
                    {property.owner.lastName?.[0]}
                  </span>
                </div>
              )}
              {property.owner.emailVerified && (
                <CheckBadgeIcon className="absolute -bottom-1 -right-1 h-6 w-6 text-green-500 bg-white rounded-full" />
              )}
            </div>

            {/* Owner Details */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                {property.owner.firstName} {property.owner.lastName}
              </h3>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center text-sm text-neutral-600">
                  <CheckBadgeIcon className="h-4 w-4 text-green-500 mr-1" />
                  Verified Owner
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                  {ownerStats.rating}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="text-right text-sm">
            <div className="text-neutral-600">
              Member since{" "}
              {formatters.date.short(ownerStats.memberSince.toISOString())}
            </div>
            <div className="text-neutral-600 mt-1">
              {ownerStats.totalProperties}{" "}
              {ownerStats.totalProperties === 1 ? "property" : "properties"}
            </div>
          </div>
        </div>

        {/* Response Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-neutral-50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <ClockIcon className="h-5 w-5 text-primary-600 mr-1" />
              <span className="font-semibold text-neutral-900">
                {ownerStats.responseTime}
              </span>
            </div>
            <div className="text-sm text-neutral-600">Avg. response time</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <span className="font-semibold text-neutral-900">
                {ownerStats.responseRate}%
              </span>
            </div>
            <div className="text-sm text-neutral-600">Response rate</div>
          </div>
        </div>

        {/* Contact Button */}
        <button
          onClick={handleContactClick}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          <span>Contact {property.owner.firstName}</span>
        </button>

        {/* Safety Tips */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Safety tip:</strong> Always communicate and pay through
            UniHousing for your protection. We never ask for wire transfers or
            payments outside the platform.
          </p>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <ContactOwnerModal
          property={property}
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          onSuccess={handleContactSuccess}
        />
      )}
    </>
  );
}