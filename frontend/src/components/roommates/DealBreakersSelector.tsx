import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';

export const DEAL_BREAKER_OPTIONS = [
  { value: 'no_smoking', label: 'No Smoking', icon: '🚭', description: 'Smoke-free living space' },
  { value: 'no_pets', label: 'No Pets', icon: '🚫', description: 'Pet-free environment' },
  { value: 'same_gender_only', label: 'Same Gender Only', icon: '👥', description: 'Gender-specific housing' },
  { value: 'quiet_study_required', label: 'Quiet Study Hours', icon: '📚', description: 'Designated quiet times' },
  { value: 'no_overnight_guests', label: 'No Overnight Guests', icon: '🏠', description: 'No overnight visitors' },
];

interface DealBreakersSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
}

export default function DealBreakersSelector({ 
  selected = [], 
  onChange,
  maxSelections = 3 
}: DealBreakersSelectorProps) {
  
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else if (selected.length < maxSelections) {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-stone-900">
          Deal Breakers
        </h3>
        <span className="text-sm text-stone-500">
          {selected.length}/{maxSelections} selected
        </span>
      </div>

      <p className="text-sm text-stone-600 mb-6">
        Select up to {maxSelections} non-negotiable preferences for your living situation
      </p>

      <div className="grid gap-3">
        {DEAL_BREAKER_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.value);
          const isDisabled = !isSelected && selected.length >= maxSelections;

          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              disabled={isDisabled}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-red-500 bg-red-50'
                  : isDisabled
                  ? 'border-stone-200 bg-stone-50 opacity-50 cursor-not-allowed'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{option.icon}</div>
                <div className="flex-1 text-left">
                  <h4 className={`font-medium ${
                    isSelected ? 'text-red-900' : 'text-stone-900'
                  }`}>
                    {option.label}
                  </h4>
                  <p className={`text-sm ${
                    isSelected ? 'text-red-700' : 'text-stone-600'
                  }`}>
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <CheckIcon className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {selected.length === maxSelections && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 text-center"
        >
          Maximum selections reached. Remove one to select another.
        </motion.p>
      )}
    </div>
  );
}