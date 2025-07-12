// frontend/src/components/common/PropertyImage.tsx
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/utils/imageUrls';
import config from '@/config';

interface PropertyImageProps {
  image: any;
  alt: string;
  fill?: boolean;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  quality?: number;
  unoptimized?: boolean;
}

// Custom loader that handles Docker URLs
const dockerAwareLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
  // Transform any backend URLs to localhost for client-side loading
  if (typeof window !== 'undefined') {
    // Handle both backend:8000 and http://backend:8000 formats
    if (src.includes('backend:8000') || src.includes('://backend')) {
      src = src
        .replace('http://backend:8000', 'http://localhost:8000')
        .replace('https://backend:8000', 'https://localhost:8000')
        .replace('//backend:8000', '//localhost:8000');
    }
  }
  
  // For Next.js image optimization, just return the URL with params
  return `${src}${src.includes('?') ? '&' : '?'}w=${width}&q=${quality || 90}`;
};

export default function PropertyImage({ 
  image, 
  alt, 
  fill = false,
  className = '',
  width,
  height,
  priority = false,
  onLoad,
  quality = 90,
  unoptimized = false
}: PropertyImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState('/placeholder-property.jpg');
  
  useEffect(() => {
    // Process the image URL - this will handle all transformations
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
  
  const imageProps = {
    src: imageSrc,
    alt: alt,
    className: `${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    onLoad: () => {
      setIsLoading(false);
      onLoad?.();
    },
    onError: () => {
      console.error(`Failed to load image: ${imageSrc}`);
      setHasError(true);
    },
    quality: quality,
    priority: priority,
    placeholder: 'empty' as const,
    loading: priority ? undefined : 'lazy' as const,
    // Use custom loader unless unoptimized
    ...(unoptimized ? { unoptimized: true } : { loader: dockerAwareLoader })
  };
  
  return fill ? (
    <>
      {isLoading && (
        <div className={`absolute inset-0 bg-stone-200 animate-pulse ${className}`} />
      )}
      <Image
        {...imageProps}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, (max-width: 1280px) 70vw, 60vw"
      />
    </>
  ) : (
    <>
      {isLoading && (
        <div 
          className="bg-stone-200 animate-pulse" 
          style={{ width: width || 300, height: height || 200 }}
        />
      )}
      <Image
        {...imageProps}
        width={width || 300}
        height={height || 200}
        // REMOVE the display:none style - this was causing the issue!
        // style={isLoading ? { display: 'none' } : {}}
      />
    </>
  );
}