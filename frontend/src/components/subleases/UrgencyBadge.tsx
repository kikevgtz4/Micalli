// frontend/src/components/subleases/UrgencyBadge.tsx
'use client';

import { cn } from '@/lib/utils';
import type { UrgencyLevel } from '@/types/sublease';

interface UrgencyBadgeProps {
  urgencyLevel: UrgencyLevel;
  showOnlyHighAndUrgent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UrgencyBadge({
  urgencyLevel,
  showOnlyHighAndUrgent = true,
  size = 'md',
  className,
}: UrgencyBadgeProps) {
  // Only show badge for urgent and high levels based on requirements
  if (showOnlyHighAndUrgent && urgencyLevel !== 'urgent' && urgencyLevel !== 'high') {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const urgencyConfig = {
    urgent: {
      label: '🔥 URGENT',
      className: 'bg-red-100 text-red-800 border-red-300 animate-pulse-subtle',
      dotColor: 'bg-red-500',
    },
    high: {
      label: 'High Priority',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
    },
    medium: {
      label: 'Medium',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      dotColor: 'bg-blue-500',
    },
    low: {
      label: 'Low',
      className: 'bg-gray-50 text-gray-600 border-gray-200',
      dotColor: 'bg-gray-400',
    },
  };

  const config = urgencyConfig[urgencyLevel];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        sizeClasses[size],
        config.className,
        className
      )}
    >
      {/* Dot indicator for high priority */}
      {urgencyLevel === 'high' && (
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      )}
      
      <span>{config.label}</span>
    </span>
  );
}

// Add the pulse animation to your globals.css if not already there
// @keyframes pulse-subtle {
//   0%, 100% { opacity: 1; }
//   50% { opacity: 0.8; }
// }
// .animate-pulse-subtle {
//   animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
// }