// frontend/src/components/common/DateRangePicker.tsx
import { useState, useRef, useEffect } from 'react';
import Calendar from './Calendar';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  minDate: string;
  maxDate: string;
  minStayMonths?: number;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
  minStayMonths = 1
}: DateRangePickerProps) {
  const [activeField, setActiveField] = useState<'start' | 'end' | null>(null);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getMinEndDate = () => {
    if (!tempStartDate) return minDate;
    const start = new Date(tempStartDate);
    start.setMonth(start.getMonth() + minStayMonths);
    const minEndDateString = start.toISOString().split('T')[0];
    return minEndDateString > maxDate ? maxDate : minEndDateString;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveField(null);
      }
    };

    if (activeField) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeField]);

  const handleStartDateSelect = (date: string) => {
    setTempStartDate(date);
    onStartDateChange(date);
    
    setTimeout(() => {
      setActiveField('end');
    }, 100);
    
    const minEnd = new Date(date);
    minEnd.setMonth(minEnd.getMonth() + minStayMonths);
    const minEndString = minEnd.toISOString().split('T')[0];
    
    if (!endDate || endDate < minEndString) {
      onEndDateChange(minEndString > maxDate ? maxDate : minEndString);
    }
  };

  const handleEndDateSelect = (date: string) => {
    onEndDateChange(date);
    setActiveField(null);
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      <h3 className="text-sm font-semibold text-gray-900">Rental Period</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Move-in Date - Calendar aligned left */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase">
            Move-in Date
          </label>
          <button
            type="button"
            onClick={() => setActiveField(activeField === 'start' ? null : 'start')}
            className={`
              w-full px-3 py-2.5 
              border rounded-lg 
              text-sm text-left 
              flex items-center justify-between 
              transition-all bg-white
              ${activeField === 'start' 
                ? 'border-primary-500 ring-2 ring-primary-200' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <span className="font-medium text-gray-900">
              {formatDate(startDate)}
            </span>
            <CalendarIcon className="h-4 w-4 text-gray-400" />
          </button>
          
          {activeField === 'start' && (
            <Calendar
              value={startDate}
              onChange={handleStartDateSelect}
              min={minDate}
              max={maxDate}
              onClose={() => setActiveField(null)}
              align="left" // Align to left edge
            />
          )}
        </div>

        {/* Move-out Date - Calendar aligned right */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase">
            Move-out Date
          </label>
          <button
            type="button"
            onClick={() => setActiveField(activeField === 'end' ? null : 'end')}
            disabled={!tempStartDate}
            className={`
              w-full px-3 py-2.5 
              border rounded-lg 
              text-sm text-left 
              flex items-center justify-between 
              transition-all bg-white
              ${activeField === 'end' 
                ? 'border-primary-500 ring-2 ring-primary-200' 
                : tempStartDate
                ? 'border-gray-300 hover:border-gray-400'
                : 'border-gray-200 cursor-not-allowed opacity-50'
              }
            `}
          >
            <span className={`font-medium ${endDate ? 'text-gray-900' : 'text-gray-500'}`}>
              {tempStartDate ? formatDate(endDate) : 'Select move-in first'}
            </span>
            <CalendarIcon className="h-4 w-4 text-gray-400" />
          </button>
          
          {activeField === 'end' && tempStartDate && (
            <Calendar
              value={endDate}
              onChange={handleEndDateSelect}
              min={minDate}
              max={maxDate}
              minSelectableDate={getMinEndDate()}
              onClose={() => setActiveField(null)}
              align="right" // Align to right edge
            />
          )}
        </div>
      </div>
      
      {minStayMonths > 1 && (
        <p className="text-xs text-gray-500 italic">
          Minimum stay: {minStayMonths} months
        </p>
      )}
    </div>
  );
}