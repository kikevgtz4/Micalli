// frontend/src/components/roommates/steps/SocialStep.tsx
import { StepProps } from "@/types/roommates";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  SparklesIcon,
  HeartIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  CameraIcon,
  BookOpenIcon,
  FilmIcon,
  BeakerIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

const HOBBY_SUGGESTIONS = [
  { name: 'Reading', icon: BookOpenIcon, color: 'bg-blue-100 text-blue-600' },
  { name: 'Gaming', icon: ComputerDesktopIcon, color: 'bg-purple-100 text-purple-600' },
  { name: 'Sports', icon: SparklesIcon, color: 'bg-green-100 text-green-600' },
  { name: 'Music', icon: MusicalNoteIcon, color: 'bg-pink-100 text-pink-600' },
  { name: 'Cooking', icon: BeakerIcon, color: 'bg-orange-100 text-orange-600' },
  { name: 'Art', icon: PaintBrushIcon, color: 'bg-indigo-100 text-indigo-600' },
  { name: 'Photography', icon: CameraIcon, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Movies', icon: FilmIcon, color: 'bg-red-100 text-red-600' },
];

const SOCIAL_SUGGESTIONS = [
  'Study Groups', 'Parties', 'Movie Nights', 'Game Nights',
  'Cooking Together', 'Sports Events', 'Concerts', 'Clubs'
];

export const SocialStep = ({ data, onChange, errors }: StepProps) => {
  const [hobbyInput, setHobbyInput] = useState('');
  const [activityInput, setActivityInput] = useState('');

  const handleAddItem = (field: 'hobbies' | 'socialActivities', value: string) => {
    if (value.trim()) {
      const currentValues = data[field] || [];
      if (!currentValues.includes(value.trim())) {
        onChange(field, [...currentValues, value.trim()]);
      }
      if (field === 'hobbies') {
        setHobbyInput('');
      } else {
        setActivityInput('');
      }
    }
  };

  const handleRemoveItem = (field: 'hobbies' | 'socialActivities', index: number) => {
    const currentValues = data[field] || [];
    onChange(field, currentValues.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-stone-900 mb-2">
          Interests & Social Life
        </h3>
        <p className="text-stone-600">
          Share your interests to find roommates you'll actually enjoy living with!
        </p>
      </motion.div>

      {/* Hobbies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block text-sm font-semibold text-stone-700 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <HeartIcon className="w-5 h-5 text-pink-600" />
            Your Hobbies & Interests
          </div>
        </label>
        
        {/* Quick Add Suggestions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {HOBBY_SUGGESTIONS.filter(
            hobby => !(data.hobbies || []).includes(hobby.name)
          ).map((hobby) => {
            const Icon = hobby.icon;
            return (
              <motion.button
                key={hobby.name}
                type="button"
                onClick={() => handleAddItem('hobbies', hobby.name)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-xl border-2 border-stone-200 hover:border-stone-300 transition-all flex items-center gap-2 ${hobby.color}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{hobby.name}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-3 mb-3">
          <input
            type="text"
            value={hobbyInput}
            onChange={(e) => setHobbyInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem('hobbies', hobbyInput);
              }
            }}
            placeholder="Add custom hobby..."
            className="flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all border-stone-200 hover:border-stone-300"
          />
          <motion.button
            type="button"
            onClick={() => handleAddItem('hobbies', hobbyInput)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </motion.button>
        </div>

        <AnimatePresence>
          <div className="flex flex-wrap gap-2">
            {(data.hobbies || []).map((item, index) => (
              <motion.span
                key={item}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 group hover:shadow-md transition-all"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveItem('hobbies', index)}
                  className="ml-2 text-purple-600 hover:text-purple-800 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </motion.span>
            ))}
          </div>
        </AnimatePresence>
      </motion.div>

      {/* Social Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-semibold text-stone-700 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="w-5 h-5 text-green-600" />
            Social Activities You Enjoy
          </div>
        </label>
        
        {/* Quick Add Suggestions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SOCIAL_SUGGESTIONS.filter(
            activity => !(data.socialActivities || []).includes(activity)
          ).map((activity) => (
            <motion.button
              key={activity}
              type="button"
              onClick={() => handleAddItem('socialActivities', activity)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 text-sm border-2 border-stone-300 rounded-full hover:bg-stone-50 transition-all text-stone-700 hover:border-stone-400"
            >
              + {activity}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-3 mb-3">
          <input
            type="text"
            value={activityInput}
            onChange={(e) => setActivityInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem('socialActivities', activityInput);
              }
            }}
            placeholder="Add custom activity..."
            className="flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all border-stone-200 hover:border-stone-300"
          />
          <motion.button
            type="button"
            onClick={() => handleAddItem('socialActivities', activityInput)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </motion.button>
        </div>

        <AnimatePresence>
          <div className="flex flex-wrap gap-2">
            {(data.socialActivities || []).map((item, index) => (
              <motion.span
                key={item}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 group hover:shadow-md transition-all"
              >
                <MusicalNoteIcon className="w-4 h-4 mr-2" />
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveItem('socialActivities', index)}
                  className="ml-2 text-green-600 hover:text-green-800 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </motion.span>
            ))}
          </div>
        </AnimatePresence>
      </motion.div>

      {/* Fun Fact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6"
      >
        <div className="flex items-start gap-3">
          <SparklesIcon className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-stone-900 mb-2">
              Did you know?
            </h4>
            <p className="text-stone-600 text-sm">
              Students who share at least 3 common interests with their roommates report 
              85% higher satisfaction with their living situation!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};