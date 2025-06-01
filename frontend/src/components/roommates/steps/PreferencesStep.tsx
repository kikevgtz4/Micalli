// frontend/src/components/roommates/steps/PreferencesStep.tsx

import { StepProps } from "@/types/roommates";
import { useState } from 'react';

export const PreferencesStep = ({ data, onChange, errors }: StepProps) => {
  const [dietaryInput, setDietaryInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');

  const handleAddItem = (field: 'dietaryRestrictions' | 'languages', value: string) => {
    if (value.trim()) {
      const currentValues = data[field] || [];
      onChange(field, [...currentValues, value.trim()]);
      if (field === 'dietaryRestrictions') {
        setDietaryInput('');
      } else {
        setLanguageInput('');
      }
    }
  };

  const handleRemoveItem = (field: 'dietaryRestrictions' | 'languages', index: number) => {
    const currentValues = data[field] || [];
    onChange(field, currentValues.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          Living Preferences
        </h3>
        <p className="text-stone-600 mb-6">
          Let us know about your specific living preferences
        </p>
      </div>

      {/* Pet & Smoking Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.petFriendly || false}
              onChange={(e) => onChange('petFriendly', e.target.checked)}
              className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-stone-700">I'm okay with pets 🐾</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.smokingAllowed || false}
              onChange={(e) => onChange('smokingAllowed', e.target.checked)}
              className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-stone-700">I'm okay with smoking 🚬</span>
          </label>
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Dietary Restrictions or Preferences
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={dietaryInput}
            onChange={(e) => setDietaryInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem('dietaryRestrictions', dietaryInput);
              }
            }}
            placeholder="e.g., Vegetarian, Halal, Gluten-free"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-stone-300"
          />
          <button
            type="button"
            onClick={() => handleAddItem('dietaryRestrictions', dietaryInput)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(data.dietaryRestrictions || []).map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemoveItem('dietaryRestrictions', index)}
                className="ml-2 text-primary-600 hover:text-primary-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Languages You Speak
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={languageInput}
            onChange={(e) => setLanguageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem('languages', languageInput);
              }
            }}
            placeholder="e.g., English, Spanish, Mandarin"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-stone-300"
          />
          <button
            type="button"
            onClick={() => handleAddItem('languages', languageInput)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(data.languages || []).map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemoveItem('languages', index)}
                className="ml-2 text-blue-600 hover:text-blue-800"
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