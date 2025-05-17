/**
 * Convert a possibly relative image URL to an absolute URL
 * that can be used with Next.js Image component
 */
export function getImageUrl(imageUrl: string | undefined): string {
  if (!imageUrl) return '/placeholder-property.jpg';
  
  // If it's already an absolute URL, return it
  if (imageUrl.startsWith('http')) return imageUrl;
  
  // If it's a placeholder image, serve it from the public directory
  if (imageUrl === '/placeholder-property.jpg') return imageUrl;
  
  // Check if it's a media file from the Django backend
  if (imageUrl.includes('/media/')) {
    // Extract the media path and use our proxy
    const mediaPath = imageUrl.split('/media/')[1];
    if (mediaPath) {
      return `/api/media/${mediaPath}`;
    }
  }
  
  // If it's a relative URL without leading slash, add it
  if (!imageUrl.startsWith('/')) imageUrl = `/${imageUrl}`;
  
  // Fallback to direct URL if not a media path
  return `http://127.0.0.1:8000${imageUrl}`;
}