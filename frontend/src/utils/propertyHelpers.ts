// frontend/src/utils/propertyHelpers.ts

/**
 * Format walking time from minutes to human-readable string
 */
export function formatWalkingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Get display name for property owner
 */
export function getOwnerDisplayName(owner?: {
  firstName?: string;
  lastName?: string;
  username?: string;
}): string {
  if (!owner) return 'Property Owner';
  
  if (owner.firstName && owner.lastName) {
    return `${owner.firstName} ${owner.lastName}`;
  }
  
  if (owner.firstName) {
    return owner.firstName;
  }
  
  return owner.username || 'Property Owner';
}

/**
 * Get privacy-aware display location
 */
export function getDisplayLocation(property: {
  displayNeighborhood?: string;
  displayArea?: string;
  address?: string;
}): string {
  if (property.displayNeighborhood) {
    return property.displayNeighborhood;
  }
  
  if (property.displayArea) {
    return property.displayArea;
  }
  
  if (property.address) {
    // Extract neighborhood/area from address (usually after first comma)
    const parts = property.address.split(',');
    if (parts.length > 1) {
      return parts[1].trim();
    }
  }
  
  return 'Monterrey, N.L.';
}