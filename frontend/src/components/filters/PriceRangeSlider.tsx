// frontend/src/components/filters/PriceRangeSlider.tsx
'use client';
import { useState, useEffect } from 'react';
import { formatters } from '@/utils/formatters';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export default function PriceRangeSlider({ 
  min, 
  max, 
  value, 
  onChange 
}: PriceRangeSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (index: number, newValue: number) => {
    const newRange: [number, number] = [...localValue] as [number, number];
    newRange[index] = newValue;
    
    // Ensure min doesn't exceed max
    if (index === 0 && newValue > localValue[1]) {
      newRange[1] = newValue;
    } else if (index === 1 && newValue < localValue[0]) {
      newRange[0] = newValue;
    }
    
    setLocalValue(newRange);
  };

  const handleChangeEnd = () => {
    onChange(localValue);
  };

  const percentage = (value: number) => ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-stone-700">Price Range</span>
        <span className="text-sm text-stone-600">
          ${formatters.number(localValue[0])} - ${formatters.number(localValue[1])}
        </span>
      </div>
      
      <div className="relative">
        <div className="relative h-2 bg-stone-200 rounded-full">
          <div
            className="absolute h-2 bg-primary-500 rounded-full"
            style={{
              left: `${percentage(localValue[0])}%`,
              right: `${100 - percentage(localValue[1])}%`,
            }}
          />
        </div>
        
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[0]}
          onChange={(e) => handleChange(0, Number(e.target.value))}
          onMouseUp={handleChangeEnd}
          onTouchEnd={handleChangeEnd}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        />
        
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[1]}
          onChange={(e) => handleChange(1, Number(e.target.value))}
          onMouseUp={handleChangeEnd}
          onTouchEnd={handleChangeEnd}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        />
      </div>
      
      <div className="flex justify-between">
        <input
          type="number"
          value={localValue[0]}
          onChange={(e) => handleChange(0, Number(e.target.value))}
          onBlur={handleChangeEnd}
          className="w-24 px-2 py-1 text-sm border border-stone-200 rounded-md"
          min={min}
          max={max}
        />
        <input
          type="number"
          value={localValue[1]}
          onChange={(e) => handleChange(1, Number(e.target.value))}
          onBlur={handleChangeEnd}
          className="w-24 px-2 py-1 text-sm border border-stone-200 rounded-md"
          min={min}
          max={max}
        />
      </div>
    </div>
  );
}