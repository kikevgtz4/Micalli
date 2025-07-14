// frontend/src/hooks/usePropertyFilters.ts
import { useState, useEffect, useCallback } from 'react';
import { PropertyFilters, SavedSearch } from '@/types/filters';
import { useDebounce } from '../forms/useDebounce';

const FILTERS_STORAGE_KEY = 'property_filters';
const SAVED_SEARCHES_KEY = 'saved_property_searches';

export function usePropertyFilters() {
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const debouncedFilters = useDebounce(filters, 500);

  // Load saved filters and searches on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    }

    const searches = localStorage.getItem(SAVED_SEARCHES_KEY);
    if (searches) {
      try {
        setSavedSearches(JSON.parse(searches));
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === undefined || value === '' ? undefined : value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  }, []);

  const saveSearch = useCallback((name: string) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
  }, [filters, savedSearches]);

  const loadSavedSearch = useCallback((searchId: string) => {
    const search = savedSearches.find(s => s.id === searchId);
    if (search) {
      setFilters(search.filters);
    }
  }, [savedSearches]);

  const deleteSavedSearch = useCallback((searchId: string) => {
    const updated = savedSearches.filter(s => s.id !== searchId);
    setSavedSearches(updated);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
  }, [savedSearches]);

  return {
    filters,
    debouncedFilters,
    updateFilter,
    clearFilters,
    savedSearches,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
  };
}