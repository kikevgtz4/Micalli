// frontend/src/components/common/PropertyImage.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/utils/imageUrls';

interface PropertyImageProps {
  image: any;
  alt: string;
  fill?: boolean;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  quality?: number; // Add quality prop
  unoptimized?: boolean; // Add unoptimized prop for full quality
}

export default function PropertyImage({ 
  image, 
  alt, 
  fill = false,
  className = '',
  width,
  height,
  priority = false,
  onLoad,
  quality = 90, // Default to 90% quality (was 75% by default)
  unoptimized = false // Allow disabling optimization for critical images
}: PropertyImageProps) {
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState('/placeholder-property.jpg');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Process the image URL when the component mounts or image prop changes
    const processedUrl = getImageUrl(image);
    setImageSrc(processedUrl);
    // Reset error state when image changes
    setHasError(false);
    setIsLoading(true);
  }, [image]);
  
  if (hasError) {
    return (
      <div className={`bg-stone-200 flex items-center justify-center ${className}`} 
           style={!fill && width && height ? {width, height} : {}}>
        <svg 
          className="w-16 h-16 text-stone-400"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }
  
  const imageElement = fill ? (
    <>
      {/* Loading skeleton */}
      {isLoading && (
        <div className={`absolute inset-0 bg-stone-200 animate-pulse ${className}`} />
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => setHasError(true)}
        // Enhanced quality settings
        quality={quality}
        unoptimized={unoptimized}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, (max-width: 1280px) 70vw, 60vw"
        priority={priority}
        // Use webp format for better quality/size ratio
        placeholder="empty"
        loading={priority ? undefined : "lazy"}
      />
    </>
  ) : (
    <>
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className="bg-stone-200 animate-pulse" 
          style={{ width: width || 300, height: height || 200 }}
        />
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        width={width || 300}
        height={height || 200}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => setHasError(true)}
        // Enhanced quality settings
        quality={quality}
        unoptimized={unoptimized}
        priority={priority}
        placeholder="empty"
        loading={priority ? undefined : "lazy"}
        style={isLoading ? { display: 'none' } : {}}
      />
    </>
  );
  
  return imageElement;
}