// src/utils/caseConversion.ts
import { getImageUrl } from './imageUrls';

/**
 * Converts snake_case keys to camelCase
 */
export function snakeToCamel<T = any>(obj: any): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel) as any;
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {} as any);
}

/**
 * Converts camelCase keys to snake_case
 */
export function camelToSnake<T = any>(obj: any): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake) as any;
  }

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = camelToSnake(obj[key]);
    return acc;
  }, {} as any);
}

/**
 * Processes image URLs in an object to ensure they work correctly
 * in both server and client contexts (Docker vs browser)
 */
export function processImageUrls(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(processImageUrls);
  }
  
  const processed = { ...obj };
  
  // Process specific image fields
  const imageFields = ['image', 'imageUrl', 'profilePicture', 'avatar'];
  
  for (const field of imageFields) {
    if (processed[field]) {
      processed[field] = getImageUrl(processed[field]);
    }
  }
  
  // Process images array (common in property responses)
  if (processed.images && Array.isArray(processed.images)) {
    processed.images = processed.images.map((img: any) => {
      if (typeof img === 'object' && img !== null) {
        // Handle both {image: url} and direct url formats
        if (img.image) {
          return { ...img, image: getImageUrl(img.image) };
        }
        // Also check if the object has other image-like properties
        return processImageUrls(img);
      } else if (typeof img === 'string') {
        // Handle direct string URLs in images array
        return getImageUrl(img);
      }
      return img;
    });
  }
  
  // Recursively process nested objects
  for (const key in processed) {
    if (typeof processed[key] === 'object' && processed[key] !== null) {
      processed[key] = processImageUrls(processed[key]);
    }
  }
  
  return processed;
}