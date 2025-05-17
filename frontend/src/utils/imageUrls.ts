// src/utils/imageUrls.ts
export function getImageUrl(imageUrl: string | undefined | null): string {
  // Handle null, undefined or non-string values
  if (!imageUrl || typeof imageUrl !== 'string') {
    return '/placeholder-property.jpg';
  }
  
  // Now we know imageUrl is a string, so it's safe to call trim()
  if (imageUrl.trim() === '') {
    return '/placeholder-property.jpg';
  }
  
  // Rest of the function remains the same
  if (imageUrl.startsWith('http')) return imageUrl;
  
  if (imageUrl === '/placeholder-property.jpg') return imageUrl;
  
  if (imageUrl.includes('/media/')) {
    const mediaPath = imageUrl.split('/media/')[1];
    if (mediaPath) {
      return `/api/media/${mediaPath}`;
    }
  }
  
  if (!imageUrl.startsWith('/')) imageUrl = `/${imageUrl}`;
  
  return `/api/media/${imageUrl.replace(/^\//, '')}`;
}