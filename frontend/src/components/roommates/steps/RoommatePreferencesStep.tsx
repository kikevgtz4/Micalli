// frontend/src/components/roommates/steps/RoommatePreferencesStep.tsx

import { StepProps } from "@/types/roommates";
import { GENDER_PREFERENCES } from '@/utils/constants';

export const RoommatePreferencesStep = ({ data, onChange, errors }: StepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          Roommate Preferences
        </h3>
        <p className="text-stone-600 mb-6">
          Tell us what you're looking for in a roommate
        </p>
      </div>

      {/* Gender Preference */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-4">
          Preferred Roommate Gender
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GENDER_PREFERENCES.map((pref) => (
            <button
              key={pref.value}
              type="button"
              onClick={() => onChange('preferredRoommateGender', pref.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                data.preferredRoommateGender === pref.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-2xl mb-2">{pref.icon}</div>
              <div className="font-medium text-sm">{pref.label}</div>
            </button>
          ))}
        </div>
        {errors.preferredRoommateGender && (
          <p className="mt-1 text-sm text-red-600">{errors.preferredRoommateGender}</p>
        )}
      </div>

      {/* Age Range */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Preferred Age Range
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="number"
              value={data.ageRangeMin || ''}
              onChange={(e) => onChange('ageRangeMin', parseInt(e.target.value) || null)}
              placeholder="Min age"
              min="18"
              max="99"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-stone-300"
            />
          </div>
          <div>
            <input
              type="number"
              value={data.ageRangeMax || ''}
              onChange={(e) => onChange('ageRangeMax', parseInt(e.target.value) || null)}
              placeholder="Max age"
              min="18"
              max="99"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-stone-300"
            />
          </div>
        </div>
      </div>

      {/* Number of Roommates */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          How many roommates would you like?
        </label>
        <select
          value={data.preferredRoommateCount || 1}
          onChange={(e) => onChange('preferredRoommateCount', parseInt(e.target.value))}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-stone-300"
        >
          <option value={1}>1 roommate (2 people total)</option>
          <option value={2}>2 roommates (3 people total)</option>
          <option value={3}>3 roommates (4 people total)</option>
          <option value={4}>4+ roommates</option>
        </select>
      </div>
    </div>
  );
};