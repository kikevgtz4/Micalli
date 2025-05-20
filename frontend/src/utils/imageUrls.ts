// src/utils/imageUrls.ts
import config from '@/config';

export function getImageUrl(imageInput: string | { image: string } | undefined | null): string {
  // For debugging
  if (config.isDevelopment) {
    console.debug("Processing image input:", imageInput);
  }
  
  // Handle null, undefined
  if (!imageInput) {
    return '/placeholder-property.jpg';
  }
  
  // Handle object with image property (common API response format)
  const imageUrl = typeof imageInput === 'object' && 'image' in imageInput 
    ? imageInput.image 
    : imageInput;
    
  // Handle empty string
  if (typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return '/placeholder-property.jpg';
  }
  
  // Handle absolute URLs
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Handle placeholder image
  if (imageUrl === '/placeholder-property.jpg') {
    return imageUrl;
  }
  
  // Handle media URLs
  if (imageUrl.includes('/media/')) {
    const mediaPath = imageUrl.split('/media/')[1];
    if (mediaPath) {
      const apiMediaUrl = `/api/media/${mediaPath}`;
      if (config.isDevelopment) {
        console.debug(`Transformed media URL: ${imageUrl} → ${apiMediaUrl}`);
      }
      return apiMediaUrl;
    }
  }
  
  // Ensure path starts with /
  const normalizedPath = !imageUrl.startsWith('/') ? `/${imageUrl}` : imageUrl;
  const finalUrl = `/api/media/${normalizedPath.replace(/^\//, '')}`;
  
  if (config.isDevelopment) {
    console.debug(`Normalized URL: ${imageUrl} → ${finalUrl}`);
  }
  
  return finalUrl;
}