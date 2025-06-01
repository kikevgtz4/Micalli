// frontend/src/components/roommates/steps/SocialStep.tsx

import { StepProps } from "@/types/roommates";
import { useState } from 'react';

const HOBBY_SUGGESTIONS = [
  'Reading', 'Gaming', 'Sports', 'Music', 'Cooking', 'Art', 
  'Photography', 'Hiking', 'Movies', 'Dancing', 'Yoga', 'Gym'
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          Interests & Social Life
        </h3>
        <p className="text-stone-600 mb-6">
          Share your interests to find like-minded roommates
        </p>
      </div>

      {/* Hobbies */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Your Hobbies & Interests
        </label>
        
        {/* Quick Add Suggestions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {HOBBY_SUGGESTIONS.filter(
            hobby => !(data.hobbies || []).includes(hobby)
          ).map((hobby) => (
            <button
              key={hobby}
              type="button"
              onClick={() => handleAddItem('hobbies', hobby)}
              className="px-3 py-1 text-sm border border-stone-300 rounded-full hover:bg-stone-50"
            >
              + {hobby}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-2">
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
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-stone-300"
          />
          <button
            type="button"
            onClick={() => handleAddItem('hobbies', hobbyInput)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(data.hobbies || []).map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemoveItem('hobbies', index)}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Social Activities */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Social Activities You Enjoy
        </label>
        
        {/* Quick Add Suggestions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SOCIAL_SUGGESTIONS.filter(
            activity => !(data.socialActivities || []).includes(activity)
          ).map((activity) => (
            <button
              key={activity}
              type="button"
              onClick={() => handleAddItem('socialActivities', activity)}
              className="px-3 py-1 text-sm border border-stone-300 rounded-full hover:bg-stone-50"
            >
              + {activity}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-2">
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
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-stone-300"
          />
          <button
            type="button"
            onClick={() => handleAddItem('socialActivities', activityInput)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(data.socialActivities || []).map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemoveItem('socialActivities', index)}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};