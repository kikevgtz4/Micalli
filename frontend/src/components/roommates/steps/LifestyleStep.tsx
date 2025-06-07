// frontend/src/components/roommates/steps/LifestyleStep.tsx
import { StepProps } from "@/types/roommates";
import { CLEANLINESS_LEVELS, NOISE_TOLERANCE_LEVELS, GUEST_POLICIES } from '@/utils/constants';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  SpeakerWaveIcon,
  UserGroupIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

export const LifestyleStep = ({ data, onChange, errors }: StepProps) => {
  const getCleanlinessEmoji = (level: number) => {
    const emojis = ['🌪️', '🧹', '✨', '🌟', '💎'];
    return emojis[level - 1] || '🧹';
  };

  const getNoiseEmoji = (level: number) => {
    const emojis = ['🤫', '🔇', '🔊', '🎵', '🎉'];
    return emojis[level - 1] || '🔊';
  };

  const renderScale = (
    field: 'cleanliness' | 'noiseTolerance',
    label: string,
    icon: React.ReactNode,
    options: readonly { value: number; label: string }[],
    getEmoji: (level: number) => string,
    color: string
  ) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: field === 'cleanliness' ? 0.2 : 0.3 }}
    >
      <label className="block text-sm font-semibold text-stone-700 mb-4">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          {label}
        </div>
      </label>
      <div className="grid grid-cols-5 gap-2">
        {options.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(field, option.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
              data[field] === option.value
                ? `border-${color}-500 bg-${color}-50 shadow-lg`
                : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            <div className="text-2xl mb-2">{getEmoji(option.value)}</div>
            <div className={`text-xs font-medium ${
              data[field] === option.value ? `text-${color}-700` : 'text-stone-600'
            }`}>
              {option.label}
            </div>
            {data[field] === option.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute -top-2 -right-2 w-6 h-6 bg-${color}-500 rounded-full flex items-center justify-center`}
              >
                <div className="w-3 h-3 bg-white rounded-full" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
      {errors[field] && (
        <p className="mt-2 text-sm text-red-600">{errors[field]}</p>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-stone-900 mb-2">
          Your Living Style
        </h3>
        <p className="text-stone-600">
          Help us understand your daily habits to find compatible roommates.
        </p>
      </motion.div>

      {/* Cleanliness Level */}
      {renderScale(
        'cleanliness',
        'How clean do you keep your space?',
        <SparklesIcon className="w-5 h-5 text-blue-600" />,
        CLEANLINESS_LEVELS,
        getCleanlinessEmoji,
        'blue'
      )}

      {/* Noise Tolerance */}
      {renderScale(
        'noiseTolerance',
        'Your noise tolerance level?',
        <SpeakerWaveIcon className="w-5 h-5 text-purple-600" />,
        NOISE_TOLERANCE_LEVELS,
        getNoiseEmoji,
        'purple'
      )}

      {/* Guest Policy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <label className="block text-sm font-semibold text-stone-700 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <UserGroupIcon className="w-5 h-5 text-green-600" />
            How often do you have guests over?
          </div>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GUEST_POLICIES.map((policy) => (
            <motion.button
              key={policy.value}
              type="button"
              onClick={() => onChange('guestPolicy', policy.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                data.guestPolicy === policy.value
                  ? 'border-green-500 bg-green-50 shadow-lg'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <div className="text-4xl mb-3">{policy.icon}</div>
              <div className={`font-semibold ${
                data.guestPolicy === policy.value ? 'text-green-700' : 'text-stone-700'
              }`}>
                {policy.label}
              </div>
              {data.guestPolicy === policy.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <div className="w-3 h-3 bg-white rounded-full" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
        {errors.guestPolicy && (
          <p className="mt-2 text-sm text-red-600">{errors.guestPolicy}</p>
        )}
      </motion.div>

      {/* Study Habits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <label className="block text-sm font-semibold text-stone-700 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpenIcon className="w-5 h-5 text-indigo-600" />
            Describe your study habits
          </div>
        </label>
        <textarea
          value={data.studyHabits || ''}
          onChange={(e) => onChange('studyHabits', e.target.value)}
          placeholder="e.g., I prefer studying in quiet spaces, usually in the evening. I sometimes have study groups over..."
          rows={3}
          className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all border-stone-200 hover:border-stone-300 resize-none"
        />
        <p className="mt-2 text-sm text-stone-500">
          This helps match you with roommates who have compatible study styles
        </p>
      </motion.div>
    </div>
  );
};