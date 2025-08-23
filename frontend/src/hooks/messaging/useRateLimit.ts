import { useRef, useCallback } from 'react';

export function useRateLimit(limit: number = 30, windowMs: number = 60000) {
  const attemptsRef = useRef<number[]>([]);
  
  const checkLimit = useCallback(() => {
    const now = Date.now();
    
    // Remove old attempts outside the window
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < windowMs
    );
    
    // Check if under limit
    if (attemptsRef.current.length >= limit) {
      return false;
    }
    
    // Add current attempt
    attemptsRef.current.push(now);
    return true;
  }, [limit, windowMs]);
  
  const getRemainingAttempts = useCallback(() => {
    const now = Date.now();
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < windowMs
    );
    return Math.max(0, limit - attemptsRef.current.length);
  }, [limit, windowMs]);
  
  return { checkLimit, getRemainingAttempts };
}