// frontend/src/components/common/DateInput.tsx
import { useState, useRef, useEffect } from 'react';
import Calendar from './Calendar';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

export default function DateInput({
  label,
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  className = '',
  error
}: DateInputProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return placeholder;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCalendar]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className={`
          w-full px-4 py-3 
          border rounded-lg 
          text-left 
          flex items-center justify-between 
          transition-all
          bg-white
          ${error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 hover:border-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
          }
        `}
      >
        <span className={`${value ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {formatDate(value)}
        </span>
        <CalendarIcon className="h-5 w-5 text-gray-400" />
      </button>
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      
      {showCalendar && (
        <Calendar
          value={value}
          onChange={(date) => {
            onChange(date);
            setShowCalendar(false);
          }}
          min={min}
          max={max}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}