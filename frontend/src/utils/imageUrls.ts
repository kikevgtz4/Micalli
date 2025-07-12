// frontend/src/utils/imageUrls.ts
import config from '@/config';

/**
 * Determine if we're running on the server or client
 */
const isServer = typeof window === 'undefined';

/**
 * Get the correct base URL for media based on execution context
 */
const getMediaBaseUrl = (): string => {
  if (isServer) {
    // Server-side: use internal URL (for Docker)
    // This is the KEY CHANGE - use internalMediaUrl instead of apiUrl
    const baseUrl = config.internalMediaUrl || config.mediaUrl;
    return baseUrl.replace('/media', '');
  }
  // Client-side: use public URL
  return config.mediaUrl.replace('/media', '');
};

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
  
  // Handle absolute URLs - but transform localhost URLs when on server
  if (imageUrl.startsWith('http')) {
    // KEY CHANGE: If server-side and URL contains localhost, replace with backend
    if (isServer && imageUrl.includes('localhost:8000')) {
      return imageUrl.replace('http://localhost:8000', config.internalMediaUrl.replace('/media', ''));
    }
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
      // Use the appropriate base URL based on context
      const baseUrl = getMediaBaseUrl();
      const fullUrl = `${baseUrl}/media/${mediaPath}`;
      
      if (config.isDevelopment && !isServer) {
        console.debug(`Image URL: ${imageUrl} → ${fullUrl}`);
      }
      
      return fullUrl;
    }
  }
  
  // For any other relative URLs, prepend the backend media URL
  const normalizedPath = !imageUrl.startsWith('/') ? `/${imageUrl}` : imageUrl;
  const baseUrl = getMediaBaseUrl();
  const finalUrl = `${baseUrl}/media${normalizedPath}`;
  
  if (config.isDevelopment && !isServer) {
    console.debug(`Fallback image URL: ${imageUrl} → ${finalUrl}`);
  }
  
  return finalUrl;
}