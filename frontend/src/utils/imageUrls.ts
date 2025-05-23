// src/utils/imageUrls.ts
import config from '@/config';

export function getImageUrl(imageInput: string | { image: string } | undefined | null): string {
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
  
  // Handle Django media URLs - convert to correct backend URL
  if (imageUrl.includes('/media/') || imageUrl.startsWith('media/')) {
    // Extract the path after 'media/'
    const mediaPath = imageUrl.includes('/media/') 
      ? imageUrl.split('/media/')[1] 
      : imageUrl.replace(/^media\//, '');
    
    if (mediaPath) {
      // Use the backend URL directly, not the frontend proxy
      const backendUrl = config.apiUrl.replace('/api', ''); // Remove /api from the end
      const fullUrl = `${backendUrl}/media/${mediaPath}`;
      
      if (config.isDevelopment) {
        console.debug(`Image URL: ${imageUrl} → ${fullUrl}`);
      }
      
      return fullUrl;
    }
  }
  
  // For any other relative URLs, prepend the backend media URL
  const normalizedPath = !imageUrl.startsWith('/') ? `/${imageUrl}` : imageUrl;
  const backendUrl = config.apiUrl.replace('/api', '');
  const finalUrl = `${backendUrl}/media${normalizedPath}`;
  
  if (config.isDevelopment) {
    console.debug(`Fallback image URL: ${imageUrl} → ${finalUrl}`);
  }
  
  return finalUrl;
}