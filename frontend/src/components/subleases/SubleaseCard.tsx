// frontend/src/components/subleases/SubleaseCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyImage from "@/components/common/PropertyImage";
import UrgencyBadge from "./UrgencyBadge";
import { formatters } from "@/utils/formatters";
import {
  calculateSavings,
  formatDuration,
  calculateDurationMonths,
  type Sublease,
} from "@/types/sublease";
import {
  HeartIcon,
  ShareIcon,
  MapPinIcon,
  CalendarIcon,
  HomeIcon,
  UsersIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

interface SubleaseCardProps {
  sublease: Sublease;
  onSave?: (id: number) => Promise<boolean>;
  variant?: "grid" | "list";
  showOwnerInfo?: boolean;
  className?: string;
}

export default function SubleaseCard({
  sublease,
  onSave,
  variant = "grid",
  showOwnerInfo = false,
  className = "",
}: SubleaseCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Calculate savings
  const savings = calculateSavings(
    sublease.originalRent,
    sublease.subleaseRent
  );
  const savingsPercent =
    sublease.originalRent > 0
      ? Math.round((savings / sublease.originalRent) * 100)
      : 0;
  const duration = calculateDurationMonths(
    sublease.startDate,
    sublease.endDate
  );

  // Handle both mainImage and images array
  let imageUrl: string | null = null;
  let imageCount = 0;

  // Check for mainImage (what the API actually returns)
  if ((sublease as any).mainImage) {
    const mainImage = (sublease as any).mainImage;
    // Use cardDisplayUrl if available (optimized for cards), otherwise use full image
    imageUrl = mainImage.cardDisplayUrl || mainImage.image || null;
    imageCount = 1; // At least one image
  }
  // Fallback to images array if it exists (for future compatibility)
  else if (sublease.images && sublease.images.length > 0) {
    const mainImage =
      sublease.images.find((img) => img.isMain) || sublease.images[0];
    imageUrl = mainImage.cardDisplayUrl || mainImage.image || null;
    imageCount = sublease.images.length;
  }

  // Privacy-aware location display
  const displayLocation =
    sublease.displayNeighborhood ||
    sublease.displayArea ||
    sublease.address?.split(",")[0]?.trim() ||
    "Monterrey";

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onSave) return;

    setIsSaving(true);
    try {
      const saved = await onSave(sublease.id);
      setIsSaved(saved);
    } catch (error) {
      console.error("Failed to save sublease:", error);
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
        console.error("Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch (err) {
        console.error("Copy to clipboard failed:", err);
      }
    }
  };

  const getSubleaseTypeLabel = () => {
    const labels: Record<string, string> = {
      entire_place: "Entire Place",
      private_room: "Private Room",
      shared_room: "Shared Room",
      full_property: "Full Property",
    };
    return labels[sublease.subleaseType] || sublease.subleaseType;
  };

  const getListingTypeLabel = () => {
    const labels: Record<string, string> = {
      summer: "Summer",
      semester: "Semester",
      temporary: "Temporary",
      takeover: "Lease Takeover",
      sublease: "Sublease",
    };
    return labels[sublease.listingType] || sublease.listingType;
  };

  // Format dates properly with month names
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Grid variant (default)
  return (
    <Link href={`/subleases/${sublease.id}`}>
      <div
        className={`group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${className}`}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {imageUrl ? (
            <>
              <PropertyImage
                image={imageUrl}
                alt={sublease.title}
                fill
                className={`object-cover transition-all duration-700 ${
                  isImageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setIsImageLoaded(true)}
              />

              {/* Additional hover effect - slight darkening */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
            </>
          ) : (
            // No image placeholder
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
              <HomeIcon className="w-16 h-16 text-gray-300 mb-2" />
              <span className="text-sm text-gray-400">no photo</span>
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <UrgencyBadge urgencyLevel={sublease.urgencyLevel} size="sm" />
            {sublease.isVerified && (
              <span className="px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-medium text-primary-600 shadow-md flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>

          {/* Save and Share buttons with improved hover effects */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={handleShare}
              className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
              aria-label="Share sublease"
            >
              <ShareIcon className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
              aria-label={isSaved ? "Remove from saved" : "Save sublease"}
            >
              {isSaved ? (
                <HeartSolidIcon className="w-5 h-5 text-red-500" />
              ) : (
                <HeartIcon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>

          {/* Image count - improved styling */}
          {imageCount > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs z-10 border border-white/10">
              {imageCount} photos
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Type + Location as Title */}
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
              {getSubleaseTypeLabel()} in {displayLocation}
            </h3>
            {/* Subtext with additional context */}
            <p className="text-sm text-gray-500 mt-0.5">
              {sublease.listingType === "summer" && "Summer sublease • "}
              {sublease.listingType === "semester" && "Semester sublease • "}
              {sublease.listingType === "takeover" && "Lease takeover • "}
              {duration || (sublease as any).durationMonths || 0} months
            </p>
          </div>

          {/* Price Section - Now more prominent without title */}
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-gray-900">
                ${formatters.number(sublease.subleaseRent)}
              </span>
              <span className="text-sm text-gray-500 font-normal ml-1">
                /month
              </span>
            </div>
            {savings > 0 && (
              <span className="text-sm text-green-600 font-medium">
                Save ${formatters.number(savings)}
              </span>
            )}
          </div>

          {/* Remove the separate Type Badges section since it's now in the title */}

          {/* Compact Features Row */}
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
            {/* Beds */}
            {sublease.bedrooms !== undefined && sublease.bedrooms !== null && (
              <div className="flex items-center">
                <HomeIcon className="w-3.5 h-3.5 mr-1 text-gray-400" />
                <span>
                  {sublease.bedrooms} bed{sublease.bedrooms !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Baths */}
            {sublease.bathrooms !== undefined &&
              sublease.bathrooms !== null && (
                <div className="flex items-center">
                  <svg
                    className="w-3.5 h-3.5 mr-1 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                    />
                  </svg>
                  <span>
                    {sublease.bathrooms} bath
                    {sublease.bathrooms !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

            {/* Area if available */}
            {sublease.totalArea && (
              <div className="flex items-center">
                <span>{sublease.totalArea} m²</span>
              </div>
            )}
          </div>

          {/* Bottom Row: Date and Status */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {formatDate(sublease.startDate)}
            </span>
            <div className="flex items-center gap-2">
              {sublease.furnished && (
                <span className="text-green-600 font-medium">Furnished</span>
              )}
              {sublease.urgencyLevel === "urgent" && (
                <span className="text-red-600 font-medium">Urgent</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
