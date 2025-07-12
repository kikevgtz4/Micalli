// frontend/src/hooks/useApi.ts
import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | undefined>;
  reset: () => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<{ data: T }>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const response = await apiFunction(...args);
        setState({
          data: response.data,
          isLoading: false,
          error: null,
        });
        return response.data;
      } catch (error) {
        console.error('API Error:', error);
        
        const errorMessage = error instanceof AxiosError
          ? error.response?.data?.detail || error.response?.data?.message || error.message
          : 'An unexpected error occurred';
          
        setState({
          data: null,
          isLoading: false,
          error: errorMessage,
        });
        return undefined;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return { ...state, execute, reset };
}