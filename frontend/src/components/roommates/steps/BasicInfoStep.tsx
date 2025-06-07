// frontend/src/components/roommates/steps/BasicInfoStep.tsx
import { StepProps } from "@/types/roommates";
import { SLEEP_SCHEDULES, YEAR_OPTIONS } from '@/utils/constants';
import { motion } from 'framer-motion';
import {
  MoonIcon,
  SunIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export const BasicInfoStep = ({ data, onChange, errors }: StepProps) => {
  const getSleepIcon = (schedule: string) => {
    switch (schedule) {
      case 'early_bird': return <SunIcon className="w-5 h-5" />;
      case 'night_owl': return <MoonIcon className="w-5 h-5" />;
      default: return <SunIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-stone-900 mb-2">
            Let's start with the basics
          </h3>
          <p className="text-stone-600">
            This information helps us find roommates with similar schedules and academic focus.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sleep Schedule */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-semibold text-stone-700 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <MoonIcon className="w-5 h-5 text-blue-600" />
              Sleep Schedule
            </div>
          </label>
          <div className="space-y-3">
            {SLEEP_SCHEDULES.map((schedule) => (
              <label
                key={schedule.value}
                className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  data.sleepSchedule === schedule.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="sleepSchedule"
                  value={schedule.value}
                  checked={data.sleepSchedule === schedule.value}
                  onChange={(e) => onChange('sleepSchedule', e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      data.sleepSchedule === schedule.value
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-stone-100 text-stone-600'
                    }`}>
                      {getSleepIcon(schedule.value)}
                    </div>
                    <span className={`font-medium ${
                      data.sleepSchedule === schedule.value ? 'text-blue-900' : 'text-stone-700'
                    }`}>
                      {schedule.label}
                    </span>
                  </div>
                  {data.sleepSchedule === schedule.value && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
          {errors.sleepSchedule && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full" />
              {errors.sleepSchedule}
            </p>
          )}
        </motion.div>

        {/* Academic Year */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-semibold text-stone-700 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <AcademicCapIcon className="w-5 h-5 text-purple-600" />
              Year of Study
            </div>
          </label>
          <select
            value={data.year || ''}
            onChange={(e) => onChange('year', parseInt(e.target.value))}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
              errors.year ? 'border-red-300 bg-red-50' : 'border-stone-200 hover:border-stone-300'
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
            <p className="mt-2 text-sm text-red-600">{errors.year}</p>
          )}
        </motion.div>
      </div>

      {/* Major */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <label className="block text-sm font-semibold text-stone-700 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpenIcon className="w-5 h-5 text-green-600" />
            Field of Study
          </div>
        </label>
        <input
          type="text"
          value={data.major || ''}
          onChange={(e) => onChange('major', e.target.value)}
          placeholder="e.g., Computer Science, Business, Medicine"
          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
            errors.major ? 'border-red-300 bg-red-50' : 'border-stone-200 hover:border-stone-300'
          }`}
        />
        {errors.major && (
          <p className="mt-2 text-sm text-red-600">{errors.major}</p>
        )}
      </motion.div>

      {/* Bio */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <label className="block text-sm font-semibold text-stone-700 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <UserIcon className="w-5 h-5 text-indigo-600" />
            About You
          </div>
        </label>
        <div className="relative">
          <textarea
            value={data.bio || ''}
            onChange={(e) => onChange('bio', e.target.value)}
            placeholder="Tell potential roommates about yourself, your interests, and what you're looking for..."
            rows={4}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none ${
              errors.bio ? 'border-red-300 bg-red-50' : 'border-stone-200 hover:border-stone-300'
            }`}
          />
          <div className="absolute bottom-3 right-3 text-xs text-stone-400">
            {(data.bio || '').length}/500
          </div>
        </div>
        <p className="mt-2 text-sm text-stone-500">
          A good bio helps you get 3x more matches!
        </p>
        {errors.bio && (
          <p className="mt-2 text-sm text-red-600">{errors.bio}</p>
        )}
      </motion.div>
    </div>
  );
};