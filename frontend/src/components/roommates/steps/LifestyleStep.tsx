// frontend/src/components/roommates/steps/LifestyleStep.tsx

import { StepProps } from "@/types/roommates";
import { CLEANLINESS_LEVELS, NOISE_TOLERANCE_LEVELS, GUEST_POLICIES } from '@/utils/constants';

export const LifestyleStep = ({ data, onChange, errors }: StepProps) => {
  const renderScale = (
    field: 'cleanliness' | 'noiseTolerance',
    label: string,
    options: readonly { value: number; label: string }[]
  ) => (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-4">
        {label}
      </label>
      <div className="flex justify-between mb-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(field, option.value)}
            className={`flex-1 mx-1 py-3 px-2 text-sm font-medium rounded-lg transition-all ${
              data[field] === option.value
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <div className="text-lg mb-1">{option.value}</div>
            <div className="text-xs">{option.label}</div>
          </button>
        ))}
      </div>
      {errors[field] && (
        <p className="mt-1 text-sm text-red-600">{errors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          Lifestyle Preferences
        </h3>
        <p className="text-stone-600 mb-6">
          Help us match you with compatible roommates based on your lifestyle
        </p>
      </div>

      {/* Cleanliness Level */}
      {renderScale('cleanliness', 'How clean do you keep your space?', CLEANLINESS_LEVELS)}

      {/* Noise Tolerance */}
      {renderScale('noiseTolerance', 'Your noise tolerance level?', NOISE_TOLERANCE_LEVELS)}

      {/* Guest Policy */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-4">
          How often do you have guests over?
        </label>
        <div className="grid grid-cols-3 gap-4">
          {GUEST_POLICIES.map((policy) => (
            <button
              key={policy.value}
              type="button"
              onClick={() => onChange('guestPolicy', policy.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                data.guestPolicy === policy.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-2xl mb-2">{policy.icon}</div>
              <div className="font-medium">{policy.label}</div>
            </button>
          ))}
        </div>
        {errors.guestPolicy && (
          <p className="mt-1 text-sm text-red-600">{errors.guestPolicy}</p>
        )}
      </div>

      {/* Study Habits */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Describe your study habits
        </label>
        <textarea
          value={data.studyHabits || ''}
          onChange={(e) => onChange('studyHabits', e.target.value)}
          placeholder="e.g., I prefer studying in quiet spaces, usually in the evening..."
          rows={3}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-stone-300"
        />
      </div>
    </div>
  );
};