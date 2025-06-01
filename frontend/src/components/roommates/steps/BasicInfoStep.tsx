// frontend/src/components/roommates/steps/BasicInfoStep.tsx

import { StepProps } from "@/types/roommates";
import { SLEEP_SCHEDULES, YEAR_OPTIONS } from '@/utils/constants';

export const BasicInfoStep = ({ data, onChange, errors }: StepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          Basic Information
        </h3>
        <p className="text-stone-600 mb-6">
          Let's start with some basic information about you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sleep Schedule */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Sleep Schedule
          </label>
          <select
            value={data.sleepSchedule || ''}
            onChange={(e) => onChange('sleepSchedule', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.sleepSchedule ? 'border-red-500' : 'border-stone-300'
            }`}
          >
            <option value="">Select your sleep schedule</option>
            {SLEEP_SCHEDULES.map((schedule) => (
              <option key={schedule.value} value={schedule.value}>
                {schedule.label}
              </option>
            ))}
          </select>
          {errors.sleepSchedule && (
            <p className="mt-1 text-sm text-red-600">{errors.sleepSchedule}</p>
          )}
        </div>

        {/* Academic Year */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Year of Study
          </label>
          <select
            value={data.year || ''}
            onChange={(e) => onChange('year', parseInt(e.target.value))}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.year ? 'border-red-500' : 'border-stone-300'
            }`}
          >
            <option value="">Select your year</option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
          {errors.year && (
            <p className="mt-1 text-sm text-red-600">{errors.year}</p>
          )}
        </div>
      </div>

      {/* Major */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Field of Study
        </label>
        <input
          type="text"
          value={data.major || ''}
          onChange={(e) => onChange('major', e.target.value)}
          placeholder="e.g., Computer Science, Business, Medicine"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.major ? 'border-red-500' : 'border-stone-300'
          }`}
        />
        {errors.major && (
          <p className="mt-1 text-sm text-red-600">{errors.major}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          About You
        </label>
        <textarea
          value={data.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          placeholder="Tell potential roommates about yourself..."
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.bio ? 'border-red-500' : 'border-stone-300'
          }`}
        />
        <p className="mt-1 text-sm text-stone-500">
          {(data.bio || '').length}/500 characters
        </p>
        {errors.bio && (
          <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
        )}
      </div>
    </div>
  );
};