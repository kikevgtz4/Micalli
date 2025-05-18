// src/components/common/PropertyImage.tsx
import { useState } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/utils/imageUrls';

interface PropertyImageProps {
  image: any;
  alt: string;
  fill?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export default function PropertyImage({ 
  image, 
  alt, 
  fill = false,
  className = '',
  width,
  height
}: PropertyImageProps) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = getImageUrl(image);
  
  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} 
           style={!fill && width && height ? {width, height} : {}}>
        <span className="text-gray-500">Image unavailable</span>
      </div>
    );
  }
  
  return fill ? (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className={className}
      onError={() => setHasError(true)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
    />
  ) : (
    <Image
      src={imageSrc}
      alt={alt}
      width={width || 300}
      height={height || 200}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}