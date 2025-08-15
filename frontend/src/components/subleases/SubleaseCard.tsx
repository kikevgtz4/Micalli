// frontend/src/components/subleases/SubleaseCard.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import PropertyImage from '@/components/common/PropertyImage';
import UrgencyBadge from './UrgencyBadge';
import { formatters } from '@/utils/formatters';
import { 
  calculateSavings, 
  formatDuration, 
  calculateDurationMonths,
  type Sublease 
} from '@/types/sublease';

interface SubleaseCardProps {
  sublease: Sublease;
  onSave?: (id: number) => Promise<boolean>;
  variant?: 'grid' | 'list';
  showOwnerInfo?: boolean;
  className?: string;
}

export default function SubleaseCard({
  sublease,
  onSave,
  variant = 'grid',
  showOwnerInfo = false,
  className = '',
}: SubleaseCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const savings = calculateSavings(sublease.originalRent, sublease.subleaseRent);
  const savingsPercent = Math.round((savings / sublease.originalRent) * 100);
  const duration = calculateDurationMonths(sublease.startDate, sublease.endDate);
  
  // Get main image or fallback
  const mainImage = sublease.images?.find(img => img.isMain) || sublease.images?.[0];
  
  // Privacy-aware location display
  const displayLocation = sublease.displayNeighborhood || sublease.displayArea || 
    sublease.address?.split(',')[1]?.trim() || 'Monterrey';

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      const saved = await onSave(sublease.id);
      setIsSaved(saved);
    } catch (error) {
      console.error('Failed to save sublease:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${window.location.origin}/subleases/${sublease.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: sublease.title,
          text: `Check out this sublease: ${sublease.title}`,
          url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
    }
  };

  const getSubleaseTypeLabel = () => {
    const labels = {
      entire_place: 'Entire Place',
      private_room: 'Private Room',
      shared_room: 'Shared Room',
    };
    return labels[sublease.subleaseType] || sublease.subleaseType;
  };

  const getListingTypeLabel = () => {
    const labels = {
      summer: 'Summer',
      semester: 'Semester',
      temporary: 'Temporary',
      takeover: 'Lease Takeover',
    };
    return labels[sublease.listingType] || sublease.listingType;
  };

  // Grid variant (matching PropertyCard style)
  return (
    <Link href={`/subleases/${sublease.id}`}>
      <div className={`group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${className}`}>
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <PropertyImage
            image={{ image: mainImage?.image }}
            alt={sublease.title}
            fill
            className={`object-cover transition-all duration-500 group-hover:scale-110 ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsImageLoaded(true)}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Top badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <UrgencyBadge urgencyLevel={sublease.urgencyLevel} size="sm" />
            {sublease.isVerified && (
              <span className="px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-medium text-primary-600 shadow-md">
                ✓ Verified
              </span>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="absolute top-4 right-4 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <svg 
              className={`w-5 h-5 transition-colors ${isSaved ? 'text-red-500 fill-current' : 'text-neutral-600'}`} 
              fill={isSaved ? 'currentColor' : 'none'} 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="absolute top-4 right-16 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <svg 
              className="w-5 h-5 text-neutral-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
            </svg>
          </button>

          {/* Price overlay with savings */}
          <div className="absolute bottom-4 left-4">
            <p className="text-2xl font-bold text-white">
              ${formatters.number(sublease.subleaseRent)}
              <span className="text-sm font-normal opacity-90">/month</span>
            </p>
            {savings > 0 && (
              <p className="text-sm text-green-300 font-medium">
                Save ${formatters.number(savings)} ({savingsPercent}%)
              </p>
            )}
          </div>

          {/* Image count */}
          {sublease.images?.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-xs">
              {sublease.images.length} photos
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Type badges */}
          <div className="flex gap-2 mb-2">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
              {getSubleaseTypeLabel()}
            </span>
            <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-medium">
              {getListingTypeLabel()}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-neutral-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {sublease.title}
          </h3>
          
          {/* Location */}
          <p className="text-sm text-neutral-600 mb-3 line-clamp-1 flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {displayLocation}
          </p>

          {/* Duration and dates */}
          <div className="flex items-center justify-between text-sm text-neutral-600 mb-3">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDuration(duration)}
            </span>
            {sublease.availableImmediately && (
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                Available Now
              </span>
            )}
          </div>

          {/* Features */}
          {(sublease.bedrooms !== undefined || sublease.bathrooms !== undefined || sublease.totalArea) && (
            <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-3">
              {sublease.bedrooms !== undefined && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {sublease.bedrooms} bed
                </span>
              )}
              {sublease.bathrooms !== undefined && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  {sublease.bathrooms} bath
                </span>
              )}
              {sublease.totalArea && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  {sublease.totalArea} m²
                </span>
              )}
            </div>
          )}

          {/* Roommates info if applicable */}
          {sublease.totalRoommates && (
            <div className="flex items-center text-sm text-neutral-600 mb-3">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {sublease.currentRoommates}/{sublease.totalRoommates} roommates
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {sublease.furnished && (
              <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium">
                Furnished
              </span>
            )}
            <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-medium">
              {formatters.date.relative(sublease.startDate)} - {formatters.date.relative(sublease.endDate)}
            </span>
          </div>

          {/* Owner info if requested */}
          {showOwnerInfo && sublease.user && (
            <div className="mt-3 pt-3 border-t text-sm text-neutral-600">
              Listed by {sublease.user.firstName || sublease.user.username}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}