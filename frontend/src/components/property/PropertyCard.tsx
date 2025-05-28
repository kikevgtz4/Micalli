"use client"
import { useState } from "react"
import type React from "react"

import Link from "next/link"
import type { Property } from "@/types/api"
import { formatters } from "@/utils/formatters"
import PropertyImage from "@/components/common/PropertyImage"

interface PropertyCardProps {
  property: Property
  className?: string
  showOwnerActions?: boolean
  onToggleActive?: (propertyId: number) => void
  isToggling?: boolean
}

export default function PropertyCard({
  property,
  className = "",
  showOwnerActions = false,
  onToggleActive,
  isToggling = false,
}: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const mainImage = property.images.find((img) => img.isMain) || property.images[0]
  const nearestUniversity = property.universityProximities?.[0]

  const handleToggleActive = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onToggleActive) {
      onToggleActive(property.id)
    }
  }

  return (
    <div
      className={`group bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${className}`}
    >
      <Link href={`/properties/${property.id}`} className="block">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <PropertyImage
            image={mainImage}
            alt={property.title}
            fill
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Loading skeleton */}
          {!imageLoaded && <div className="absolute inset-0 bg-stone-200 dark:bg-stone-700 animate-pulse" />}

          {/* Overlay badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {property.isFeatured && (
              <span className="bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-medium">Featured</span>
            )}
            {property.isVerified && (
              <span className="bg-success-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Verified
              </span>
            )}
            {!property.isActive && (
              <span className="bg-warning-500 text-white px-3 py-1 rounded-full text-xs font-medium">Inactive</span>
            )}
          </div>

          {/* Image count */}
          {property.images.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
              {property.images.length} photos
            </div>
          )}

          {/* Price overlay */}
          <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {formatters.currency(property.rentAmount)}
              <span className="text-sm text-stone-600 dark:text-stone-400 font-normal">
                /{property.paymentFrequency}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Title and Type */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {property.title}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {formatters.text.capitalize(property.propertyType)}
            </p>
          </div>

          {/* Location */}
          <div className="flex items-start mb-4">
            <svg
              className="w-4 h-4 text-stone-400 mr-2 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">{property.address}</span>
          </div>

          {/* University proximity */}
          {nearestUniversity && (
            <div className="flex items-center mb-4 text-sm text-stone-600 dark:text-stone-400">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
              </svg>
              <span className="truncate">
                {formatters.distance(nearestUniversity.distanceInMeters)} from {nearestUniversity.university.name}
              </span>
            </div>
          )}

          {/* Property details */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-sm text-stone-600 dark:text-stone-400">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 01-2-2v-2"
                  />
                </svg>
                <span>{formatters.area(property.totalArea)}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                  />
                </svg>
                <span>{property.bedrooms} bed</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                  />
                </svg>
                <span>{property.bathrooms} bath</span>
              </div>
            </div>

            {property.furnished && (
              <span className="bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-1 rounded-full text-xs font-medium">
                Furnished
              </span>
            )}
          </div>

          {/* Amenities preview */}
          {property.amenities.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {property.amenities.slice(0, 3).map((amenity, index) => (
                  <span
                    key={index}
                    className="bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-2 py-1 rounded text-xs"
                  >
                    {amenity}
                  </span>
                ))}
                {property.amenities.length > 3 && (
                  <span className="text-xs text-stone-500 dark:text-stone-400 px-2 py-1">
                    +{property.amenities.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-700">
            <div className="text-xs text-stone-500 dark:text-stone-400">
              Available {formatters.date.relative(property.availableFrom)}
            </div>

            {showOwnerActions && (
              <button
                onClick={handleToggleActive}
                disabled={isToggling}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  property.isActive
                    ? "bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/30"
                    : "bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 hover:bg-warning-200 dark:hover:bg-warning-900/30"
                } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isToggling ? "Updating..." : property.isActive ? "Active" : "Inactive"}
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
