// frontend/src/hooks/useMessageFiltering.ts
import { useState, useCallback } from 'react';
import type { PolicyViolation } from '@/types/api';

interface FilterResult {
  violations: PolicyViolation[];
  action: 'allow' | 'warn' | 'block';
  filteredContent?: string;
}

export function useMessageFiltering() {
  const [showWarning, setShowWarning] = useState(false);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [pendingMessage, setPendingMessage] = useState('');
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const handleFilterResult = useCallback((
    result: FilterResult,
    message: string,
    onProceed: () => void
  ) => {
    if (result.action === 'block' || result.action === 'warn') {
      setViolations(result.violations);
      setPendingMessage(message);
      setPendingCallback(() => onProceed);
      setShowWarning(true);
      return false;
    }
    return true;
  }, []);

  const handleRevise = useCallback(() => {
    setShowWarning(false);
    setViolations([]);
    setPendingMessage('');
    setPendingCallback(null);
  }, []);

  const handleProceed = useCallback(() => {
    if (pendingCallback) {
      setShowWarning(false);
      pendingCallback();
    }
  }, [pendingCallback]);

  const reset = useCallback(() => {
    setShowWarning(false);
    setViolations([]);
    setPendingMessage('');
    setPendingCallback(null);
  }, []);

  return {
    showWarning,
    violations,
    pendingMessage,
    isBlocked: violations.some(v => v.severity === 'critical'),
    handleFilterResult,
    handleRevise,
    handleProceed,
    reset,
  };
}