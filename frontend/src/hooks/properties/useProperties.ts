// frontend/src/hooks/useProperties.ts
import { useCallback, useMemo } from 'react';
import { useApi } from '../api/useApi';
import apiService from '@/lib/api';
import { Property } from '@/types/api';
import { toast } from 'react-hot-toast';

export function useProperties() {
  // Main properties fetch hook
  const {
    data: properties,
    isLoading,
    error,
    execute: fetchProperties,
    reset
  } = useApi<Property[]>(apiService.properties.getOwnerProperties);

  // Toggle active status hook
  const {
    execute: executeToggle,
    isLoading: isToggling
  } = useApi(apiService.properties.toggleActive);

  // Toggle property active status
  const toggleActiveStatus = useCallback(async (propertyId: number) => {
    const result = await executeToggle(propertyId);
    if (result) {
      // Refetch properties to get updated data
      await fetchProperties();
      toast.success('Property status updated successfully!');
      return true;
    }
    return false;
  }, [executeToggle, fetchProperties]);

  // Bulk activate all inactive properties
  const activateAllInactive = useCallback(async () => {
    if (!properties) return false;
    
    const inactiveProperties = properties.filter(p => !p.isActive);
    if (inactiveProperties.length === 0) return false;

    const shouldActivate = window.confirm(
      `You have ${inactiveProperties.length} inactive properties. Would you like to activate them all so students can see them?`
    );
    
    if (!shouldActivate) return false;

    let successCount = 0;
    for (const property of inactiveProperties) {
      const success = await toggleActiveStatus(property.id);
      if (success) successCount++;
      // Small delay between requests to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (successCount > 0) {
      toast.success(`Successfully activated ${successCount} properties!`);
    }
    
    return successCount === inactiveProperties.length;
  }, [properties, toggleActiveStatus]);

  // Memoized calculations to prevent unnecessary re-calculations
  const stats = useMemo(() => {
    if (!properties) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        verified: 0,
        featured: 0
      };
    }

    return {
      total: properties.length,
      active: properties.filter(p => p.isActive).length,
      inactive: properties.filter(p => !p.isActive).length,
      verified: properties.filter(p => p.isVerified).length,
      featured: properties.filter(p => p.isFeatured).length
    };
  }, [properties]);

  return {
    // Data
    properties: properties || [],
    stats,
    
    // Loading states
    isLoading,
    isToggling,
    
    // Error state
    error,
    
    // Actions
    fetchProperties,
    toggleActiveStatus,
    activateAllInactive,
    reset
  };
}