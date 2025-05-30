// src/components/common/PropertyImage.tsx
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
  onLoad?: () => void; // Add this to accept the onLoad prop
}

export default function PropertyImage({ 
  image, 
  alt, 
  fill = false,
  className = '',
  width,
  height,
  priority = false,
  onLoad // Destructure onLoad here
}: PropertyImageProps) {
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState('/placeholder-property.jpg');
  
  useEffect(() => {
    // Process the image URL when the component mounts or image prop changes
    const processedUrl = getImageUrl(image);
    setImageSrc(processedUrl);
    // Reset error state when image changes
    setHasError(false);
  }, [image]);
  
  if (hasError) {
    return (
      <div className={`bg-stone-200 flex items-center justify-center ${className}`} 
           style={!fill && width && height ? {width, height} : {}}>
        <span className="text-stone-500">Image unavailable</span>
      </div>
    );
  }
  
  return fill ? (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className={className}
      onLoad={onLoad} // Pass onLoad to the NextImage component
      onError={() => setHasError(true)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={priority}
    />
  ) : (
    <Image
      src={imageSrc}
      alt={alt}
      width={width || 300}
      height={height || 200}
      className={className}
      onLoad={onLoad} // Pass onLoad to the NextImage component
      onError={() => setHasError(true)}
      priority={priority}
    />
  );
}