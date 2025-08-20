// frontend/src/components/common/Calendar.tsx
import { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  onClose?: () => void;
  className?: string;
  position?: 'absolute' | 'static';
  minSelectableDate?: string;
  align?: 'left' | 'right'; // Add alignment prop
}

export default function Calendar({
  value,
  onChange,
  min,
  max,
  onClose,
  className = '',
  position = 'absolute',
  minSelectableDate,
  align = 'left' // Default to left alignment
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(value || new Date()));
  const [viewDate, setViewDate] = useState(new Date(value || new Date()));
  const calendarRef = useRef<HTMLDivElement>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value));
      setViewDate(new Date(value));
    } else if (min) {
      setViewDate(new Date(min));
    }
  }, [value, min]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePreviousMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateString = newDate.toISOString().split('T')[0];
    
    const effectiveMin = minSelectableDate || min;
    if (effectiveMin && dateString < effectiveMin) return;
    if (max && dateString > max) return;
    
    setCurrentDate(newDate);
    onChange(dateString);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    
    const effectiveMin = minSelectableDate || min;
    if (effectiveMin && dateString < effectiveMin) return true;
    if (max && dateString > max) return true;
    return false;
  };

  const isSelectedDate = (day: number) => {
    return currentDate.getDate() === day &&
           currentDate.getMonth() === viewDate.getMonth() &&
           currentDate.getFullYear() === viewDate.getFullYear();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === viewDate.getMonth() &&
           today.getFullYear() === viewDate.getFullYear();
  };

  const daysInMonth = getDaysInMonth(viewDate);
  const firstDayOfMonth = getFirstDayOfMonth(viewDate);
  
  const canGoPrevious = () => {
    if (!min) return true;
    const minDate = new Date(min);
    const firstOfViewMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const firstOfMinMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    return firstOfViewMonth > firstOfMinMonth;
  };

  const canGoNext = () => {
    if (!max) return true;
    const maxDate = new Date(max);
    const lastOfViewMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const lastOfMaxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    return lastOfViewMonth < lastOfMaxMonth;
  };

  // Determine positioning classes based on alignment
  const containerClasses = position === 'absolute' 
    ? `absolute top-full mt-2 z-[9999] ${align === 'right' ? 'right-0' : 'left-0'}` 
    : '';

  return (
    <div 
      ref={calendarRef}
      className={`${containerClasses} bg-white rounded-lg shadow-2xl border border-gray-200 p-3 w-[280px] ${className}`}
    >
      {/* Month/Year Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePreviousMonth}
          disabled={!canGoPrevious()}
          className={`p-1.5 rounded-lg transition-colors ${
            canGoPrevious() 
              ? 'hover:bg-gray-100 text-gray-700' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        
        <div className="text-center">
          <h3 className="text-sm font-semibold text-gray-900">
            {months[viewDate.getMonth()]}
          </h3>
          <p className="text-xs text-gray-600">
            {viewDate.getFullYear()}
          </p>
        </div>
        
        <button
          onClick={handleNextMonth}
          disabled={!canGoNext()}
          className={`p-1.5 rounded-lg transition-colors ${
            canGoNext() 
              ? 'hover:bg-gray-100 text-gray-700' 
              : 'text-gray-300 cursor-not-allowed'
          }`}
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map(day => (
          <div 
            key={day} 
            className="text-center py-1 text-xs font-medium text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-start-${index}`} className="h-8" />
        ))}
        
        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const isDisabled = isDateDisabled(day);
          const isSelected = isSelectedDate(day);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day}
              onClick={() => !isDisabled && handleDateSelect(day)}
              disabled={isDisabled}
              className={`
                h-8 w-full rounded text-sm transition-all
                flex items-center justify-center
                ${isSelected 
                  ? 'bg-primary-600 text-white font-semibold' 
                  : isTodayDate
                  ? 'bg-primary-50 text-primary-700 font-medium border border-primary-300'
                  : isDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'hover:bg-gray-100 text-gray-700'
                }
              `}
              aria-label={`${day} ${months[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
            >
              {day}
            </button>
          );
        })}
        
        {/* Empty cells to complete the grid */}
        {Array.from({ 
          length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7 
        }).map((_, index) => (
          <div key={`empty-end-${index}`} className="h-8" />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
        <button
          onClick={() => {
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            const effectiveMin = minSelectableDate || min;
            
            if ((!effectiveMin || todayString >= effectiveMin) && (!max || todayString <= max)) {
              setCurrentDate(today);
              setViewDate(today);
              onChange(todayString);
            }
          }}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          Today
        </button>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}