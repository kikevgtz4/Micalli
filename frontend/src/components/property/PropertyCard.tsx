// frontend/src/components/property/PropertyCard.tsx
"use client"
import { useState } from "react"
import Link from "next/link"
import PropertyImage from "@/components/common/PropertyImage"
import { formatters } from "@/utils/formatters"

interface PropertyCardProps {
  id: number
  title: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  latitude?: number
  longitude?: number
  imageUrl?: string
  isVerified?: boolean
  universityDistance?: string
  furnished?: boolean
  totalArea?: number
  availableFrom?: string
}

export default function PropertyCard(props: PropertyCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <Link href={`/properties/${props.id}`}>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <PropertyImage
            image={{ image: props.imageUrl }}
            alt={props.title}
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
            {props.isVerified && (
              <span className="px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-medium text-primary-600 shadow-md">
                ✓ Verified
              </span>
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setIsFavorite(!isFavorite)
            }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <svg 
              className={`w-5 h-5 transition-colors ${isFavorite ? 'text-red-500 fill-current' : 'text-neutral-600'}`} 
              fill={isFavorite ? 'currentColor' : 'none'} 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Price overlay */}
          <div className="absolute bottom-4 left-4">
            <p className="text-2xl font-bold text-white">
              ${formatters.number(props.price)}
              <span className="text-sm font-normal opacity-90">/month</span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title and location */}
          <h3 className="text-lg font-semibold text-neutral-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {props.title}
          </h3>
          <p className="text-sm text-neutral-600 mb-3 line-clamp-1 flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {props.address}
          </p>

          {/* University distance */}
          {props.universityDistance && (
            <p className="text-sm text-primary-600 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v7" />
              </svg>
              {props.universityDistance}
            </p>
          )}

          {/* Features */}
          <div className="flex items-center justify-between text-sm text-neutral-600 mb-3">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {props.bedrooms} bed
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                {props.bathrooms} bath
              </span>
              {props.totalArea && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  {props.totalArea} m²
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {props.furnished && (
              <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium">
                Furnished
              </span>
            )}
            {props.availableFrom && (
              <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-medium">
                Available {formatters.date.relative(props.availableFrom)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}