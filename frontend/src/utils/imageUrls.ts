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
    const baseUrl = config.internalMediaUrl || config.mediaUrl;
    return baseUrl.replace('/media', '');
  }
  // Client-side: use public URL
  return config.mediaUrl.replace('/media', '');
};

/**
 * Transform a URL from internal (backend:8000) to public (localhost:8000) format
 * This is crucial for URLs that were generated server-side but need to work client-side
 */
const transformInternalToPublicUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return url;
  
  // Replace any Docker internal URLs with public URLs
  const internalBase = config.internalMediaUrl?.replace('/media', '') || 'http://backend:8000';
  const publicBase = config.mediaUrl.replace('/media', '');
  
  return url
    .replace(internalBase, publicBase)
    .replace('http://backend:8000', publicBase);
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
  
  // Handle placeholder image
  if (imageUrl === '/placeholder-property.jpg') {
    return imageUrl;
  }
  
  // Handle absolute URLs
  if (imageUrl.startsWith('http')) {
    // CRITICAL: Transform internal Docker URLs to public URLs when on client
    if (!isServer) {
      return transformInternalToPublicUrl(imageUrl);
    }
    
    // On server, transform localhost to internal URL if needed
    if (isServer && (imageUrl.includes('localhost:8000') || imageUrl.includes('127.0.0.1:8000'))) {
      const internalBase = config.internalMediaUrl.replace('/media', '');
      return imageUrl
        .replace('http://localhost:8000', internalBase)
        .replace('http://127.0.0.1:8000', internalBase);
    }
    
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