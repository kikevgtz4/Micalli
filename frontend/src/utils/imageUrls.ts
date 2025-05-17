/**
 * Convert a possibly relative image URL to an absolute URL
 * that can be used with Next.js Image component with dual-stack support
 */
export function getImageUrl(imageUrl: string | undefined): string {
  if (!imageUrl) return '/placeholder-property.jpg';
  
  // If it's already an absolute URL, return it
  if (imageUrl.startsWith('http')) return imageUrl;
  
  // If it's a relative URL without leading slash, add it
  if (!imageUrl.startsWith('/')) imageUrl = `/${imageUrl}`;
  
  // Determine backend URL dynamically
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  const port = '8000';
  
  return `${protocol}//${hostname}:${port}${imageUrl}`;
}