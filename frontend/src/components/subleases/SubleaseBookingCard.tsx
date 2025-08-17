// frontend/src/components/sublease/SubleaseBookingCard.tsx
import { useState } from 'react';
import PropertyImage from '@/components/common/PropertyImage';
import { formatters } from '@/utils/formatters';
import {
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  StarIcon,
  CheckBadgeIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  CheckBadgeIcon as CheckBadgeIconSolid,
} from '@heroicons/react/24/solid';

interface SubleaseBookingCardProps {
  sublease: any;
  isSaved: boolean;
  onSave: () => void;
  onShare: () => void;
  onContact: () => void;
}

export default function SubleaseBookingCard({
  sublease,
  isSaved,
  onSave,
  onShare,
  onContact,
}: SubleaseBookingCardProps) {
  const [checkInDate, setCheckInDate] = useState(sublease.startDate);
  const [checkOutDate, setCheckOutDate] = useState(sublease.endDate);

  const calculateMonths = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    return Math.max(1, months);
  };

  const duration = calculateMonths(checkInDate, checkOutDate);

  return (
    <div className="sticky top-24">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Host Section */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b">
          <div className="flex items-center gap-4">
            <div className="relative">
              {sublease.user?.profilePicture ? (
                <PropertyImage
                  image={sublease.user.profilePicture}
                  alt={sublease.user.firstName}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-white">
                  <span className="text-lg font-bold text-white">
                    {sublease.user?.firstName?.[0]}
                  </span>
                </div>
              )}
              {sublease.user?.emailVerified && (
                <CheckBadgeIconSolid className="absolute -bottom-1 -right-1 h-5 w-5 text-primary-500 bg-white rounded-full" />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {sublease.user?.firstName} {sublease.user?.lastName}
              </h3>
              {sublease.user?.university && (
                <p className="text-sm text-gray-600">
                  {typeof sublease.user.university === 'object' 
                    ? sublease.user.university.name 
                    : 'University'}
                </p>
              )}
              {sublease.user?.rating && sublease.user.rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-gray-700">
                    {sublease.user.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({sublease.user.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Price Section */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                ${formatters.number(sublease.subleaseRent)}
              </span>
              <span className="text-gray-600">/month</span>
            </div>
            
            {sublease.discountPercentage && sublease.discountPercentage > 0 && (
              <div className="mt-2 inline-flex items-center gap-2">
                <span className="text-sm line-through text-gray-500">
                  ${formatters.number(sublease.originalRent)}
                </span>
                <span className="px-2 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                  Save {sublease.discountPercentage}%
                </span>
              </div>
            )}
            
            {sublease.depositAmount && sublease.depositAmount > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Deposit: ${formatters.number(sublease.depositAmount)}
              </p>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              {sublease.utilitiesIncluded?.length 
                ? `✓ ${sublease.utilitiesIncluded.length} utilities included` 
                : '✗ Utilities not included'}
            </p>
          </div>

          {/* Date Selection */}
          <div className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  CHECK-IN
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={checkInDate}
                    min={sublease.startDate}
                    max={sublease.endDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  CHECK-OUT
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={checkOutDate}
                    min={checkInDate}
                    max={sublease.endDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Duration</span>
                <span className="font-semibold text-gray-900">
                  {duration} {duration === 1 ? 'month' : 'months'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-600">Total</span>
                <span className="font-bold text-lg text-gray-900">
                  ${formatters.number(sublease.subleaseRent * duration)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Button */}
          <button
            onClick={onContact}
            className="w-full bg-gradient-to-r bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
            Contact Host
          </button>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
            >
              {isSaved ? (
                <HeartIconSolid className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4" />
              )}
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button
              onClick={onShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
            >
              <ShareIcon className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Urgency Notice */}
          {sublease.urgencyLevel === 'urgent' && (
            <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
              <div className="flex items-start gap-2">
                <BellAlertIcon className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">High demand</p>
                  <p className="text-xs text-orange-700 mt-0.5">
                    This place is getting lots of attention
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Report Link */}
        <div className="px-6 pb-4">
          <button className="text-xs text-gray-400 hover:text-gray-600 underline flex items-center gap-1 mx-auto">
            <ExclamationTriangleIcon className="h-3 w-3" />
            Report this listing
          </button>
        </div>
      </div>
    </div>
  );
}