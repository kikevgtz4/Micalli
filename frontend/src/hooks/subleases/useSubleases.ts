// frontend/src/hooks/useSubleases.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import apiService from '@/lib/api';
import { Sublease, SubleaseFilters, SubleaseListResponse } from '@/types/sublease';
import { toast } from 'react-hot-toast';
import { useDebounce } from '../forms/useDebounce';

interface UseSubleaseOptions {
  filters?: SubleaseFilters;
  autoFetch?: boolean;
  debounceDelay?: number;
}

export function useSubleases(options: UseSubleaseOptions = {}) {
  const { 
    filters: initialFilters = {}, 
    autoFetch = true,
    debounceDelay = 500 
  } = options;
  
  const [subleases, setSubleases] = useState<Sublease[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SubleaseFilters>(initialFilters);
  
  // Debounce filters to avoid excessive API calls
  const debouncedFilters = useDebounce(filters, debounceDelay);

  const fetchSubleases = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.subleases.getAll({
        ...debouncedFilters,
        page,
        pageSize: debouncedFilters.pageSize || 12,
      });
      
      setSubleases(response.data.results);
      setTotalCount(response.data.count);
      setHasNext(!!response.data.next);
      setHasPrevious(!!response.data.previous);
      setCurrentPage(page);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load subleases';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters]);

  const refreshSubleases = useCallback(() => {
    return fetchSubleases(currentPage);
  }, [fetchSubleases, currentPage]);

  const goToPage = useCallback((page: number) => {
    return fetchSubleases(page);
  }, [fetchSubleases]);

  const nextPage = useCallback(() => {
    if (hasNext) {
      return fetchSubleases(currentPage + 1);
    }
  }, [fetchSubleases, currentPage, hasNext]);

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      return fetchSubleases(currentPage - 1);
    }
  }, [fetchSubleases, currentPage, hasPrevious]);

  // Update filter function
  const updateFilter = useCallback(<K extends keyof SubleaseFilters>(
    key: K,
    value: SubleaseFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === undefined || value === '' ? undefined : value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  // Fetch when debounced filters change
  useEffect(() => {
    if (autoFetch) {
      fetchSubleases(1);
    }
  }, [debouncedFilters, autoFetch]); // Use debouncedFilters instead of filters

  // Memoized stats
  const stats = useMemo(() => ({
    totalCount,
    currentPage,
    totalPages: Math.ceil(totalCount / (filters.pageSize || 12)),
    hasResults: subleases.length > 0,
    isFirstPage: currentPage === 1,
    isLastPage: !hasNext,
  }), [totalCount, currentPage, filters.pageSize, subleases.length, hasNext]);

  return {
    // Data
    subleases,
    stats,
    
    // Pagination
    totalCount,
    hasNext,
    hasPrevious,
    currentPage,
    
    // Loading/Error states
    isLoading,
    error,
    
    // Filter management
    filters,
    updateFilter,
    clearFilters,
    
    // Actions
    fetchSubleases,
    refreshSubleases,
    goToPage,
    nextPage,
    previousPage,
  };
}

// Hook for single sublease
export function useSublease(id: number | null) {
  const [sublease, setSublease] = useState<Sublease | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSublease = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.subleases.getById(id);
      setSublease(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load sublease';
      setError(errorMessage);
      if (err.response?.status !== 404) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchSublease();
    }
  }, [id, fetchSublease]);

  const toggleSave = useCallback(async () => {
    if (!id) return false;
    
    try {
      const response = await apiService.subleases.toggleSave(id);
      toast.success(response.data.message);
      
      // Update local state optimistically
      if (sublease) {
        setSublease(prev => prev ? {
          ...prev,
          savedCount: response.data.isSaved 
            ? prev.savedCount + 1 
            : Math.max(0, prev.savedCount - 1),
        } : null);
      }
      
      return response.data.isSaved;
    } catch (err: any) {
      toast.error('Failed to save sublease');
      return false;
    }
  }, [id, sublease]);

  const updateSublease = useCallback(async (data: Partial<Sublease>) => {
    if (!id) return false;
    
    try {
      setIsLoading(true);
      const response = await apiService.subleases.update(id, data as any);
      setSublease(response.data);
      toast.success('Sublease updated successfully');
      return true;
    } catch (err: any) {
      toast.error('Failed to update sublease');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  return {
    sublease,
    isLoading,
    error,
    refetch: fetchSublease,
    toggleSave,
    updateSublease,
  };
}

// Hook for user's subleases
export function useMySubleases() {
  const [subleases, setSubleases] = useState<Sublease[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMySubleases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.subleases.getMySubleases();
      setSubleases(response.data.results);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load your subleases';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMySubleases();
  }, [fetchMySubleases]);

  const deleteSubLease = useCallback(async (id: number) => {
    try {
      await apiService.subleases.delete(id);
      toast.success('Sublease deleted successfully');
      
      // Update local state optimistically
      setSubleases(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete sublease';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const toggleSubleaseStatus = useCallback(async (id: number, status: 'active' | 'inactive') => {
  try {
    // Use the new toggleStatus endpoint
    const response = await apiService.subleases.toggleStatus(id, status);
    
    // Update local state
    setSubleases(prev => prev.map(s => 
      s.id === id ? { ...s, status: response.data.status } : s
    ));
    
    toast.success(`Sublease ${status === 'active' ? 'activated' : 'deactivated'}`);
    return true;
  } catch (err: any) {
    toast.error('Failed to update sublease status');
    return false;
  }
}, []);

  // Memoized stats like useProperties
  const stats = useMemo(() => {
    return {
      total: subleases.length,
      active: subleases.filter(s => s.status === 'active').length,
      inactive: subleases.filter(s => s.status !== 'active').length,
      urgent: subleases.filter(s => s.urgencyLevel === 'urgent').length,
      filled: subleases.filter(s => s.status === 'filled').length,
    };
  }, [subleases]);

  return {
    // Data
    subleases,
    stats,
    
    // States
    isLoading,
    error,
    
    // Actions
    refetch: fetchMySubleases,
    deleteSubLease,
    toggleSubleaseStatus,
  };
}

// Hook for dashboard stats
export function useSubleaseDashboardStats() {
  const [stats, setStats] = useState({
    activeSubleases: 0,
    pendingApplications: 0,
    totalApplications: 0,
    unreadMessages: 0,
    profileViews: 0,
    responseRate: 0,
    savedCount: 0,
    viewsThisWeek: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.subleases.getDashboardStats();
      setStats(response.data);
    } catch (err: any) {
      const errorMessage = 'Failed to load dashboard stats';
      setError(errorMessage);
      console.error('Dashboard stats error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Memoized computed values
  const computedStats = useMemo(() => ({
    ...stats,
    hasActiveSubleases: stats.activeSubleases > 0,
    hasPendingApplications: stats.pendingApplications > 0,
    responseRatePercent: Math.round(stats.responseRate * 100),
    applicationAcceptRate: stats.totalApplications > 0 
      ? Math.round((stats.pendingApplications / stats.totalApplications) * 100)
      : 0,
  }), [stats]);

  return {
    stats: computedStats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

// Hook for sublease filters with localStorage persistence (like usePropertyFilters)
export function useSubleaseFilters() {
  const FILTERS_STORAGE_KEY = 'sublease_filters';
  const SAVED_SEARCHES_KEY = 'saved_sublease_searches';
  
  const [filters, setFilters] = useState<SubleaseFilters>({});
  const debouncedFilters = useDebounce(filters, 500);

  // Load saved filters on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof SubleaseFilters>(
    key: K,
    value: SubleaseFilters[K]
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

  return {
    filters,
    debouncedFilters,
    updateFilter,
    clearFilters,
  };
}