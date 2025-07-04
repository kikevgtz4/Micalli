// frontend/src/components/roommate-profile/sections/LifestyleSection.tsx
import {
  DIETARY_RESTRICTIONS,
} from "@/utils/constants";
import { RoommateProfileFormData } from "@/types/roommates";
import { useState } from "react";

interface LifestyleSectionProps {
  formData: RoommateProfileFormData;
  onChange: (
    updater: (prev: RoommateProfileFormData) => RoommateProfileFormData
  ) => void;
}

// Reduced sets of common options - users can add more custom ones
const COMMON_HOBBIES = [
  "Reading", "Gaming", "Cooking", "Sports", "Music", "Movies", "Travel", "Art"
];

const COMMON_SOCIAL_ACTIVITIES = [
  "Parties", "Board Games", "Movie Nights", "Dining Out", "Hiking", "Concerts"
];

const COMMON_PERSONALITY_TRAITS = [
  "Introverted", "Extroverted", "Organized", "Spontaneous", "Morning person", "Night person"
];

const COMMON_LANGUAGES = [
  "English", "Spanish", "Mandarin", "French", "German", "Portuguese"
];

export default function LifestyleSection({
  formData,
  onChange,
}: LifestyleSectionProps) {
  // Custom input states
  const [customHobby, setCustomHobby] = useState("");
  const [customSocial, setCustomSocial] = useState("");
  const [customPersonality, setCustomPersonality] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");
  const [customDietary, setCustomDietary] = useState("");

  // Dietary restrictions toggle state
  const hasDietaryRestrictions = formData.dietaryRestrictions && 
    formData.dietaryRestrictions.length > 0 && 
    !formData.dietaryRestrictions.includes('No Restrictions');

  // Generic toggle function for array fields
  const toggleItem = (field: keyof RoommateProfileFormData, item: string) => {
    onChange((prev: RoommateProfileFormData) => {
      const currentItems = (prev[field] as string[]) || [];
      
      // Special handling for dietary restrictions
      if (field === 'dietaryRestrictions') {
        // If selecting "No Restrictions", clear all others
        if (item === 'No Restrictions') {
          return { ...prev, [field]: ['No Restrictions'] };
        }
        
        // Remove "No Restrictions" when selecting actual restrictions
        const filtered = currentItems.filter(i => i !== 'No Restrictions');
        
        if (filtered.includes(item)) {
          // Remove the item
          const newItems = filtered.filter(i => i !== item);
          // If no items left, set to "No Restrictions"
          return {
            ...prev,
            [field]: newItems.length === 0 ? ['No Restrictions'] : newItems
          };
        } else {
          // Add the item
          return { ...prev, [field]: [...filtered, item] };
        }
      }
      
      // Normal handling for other fields
      const newItems = currentItems.includes(item)
        ? currentItems.filter((i: string) => i !== item)
        : [...currentItems, item];
      
      return { ...prev, [field]: newItems };
    });
  };

  // Handle dietary toggle
  const handleDietaryToggle = (enabled: boolean) => {
    onChange((prev: RoommateProfileFormData) => ({
      ...prev,
      dietaryRestrictions: enabled ? [] : ['No Restrictions']
    }));
  };

  // Generic function to add custom items
  const addCustomItem = (
    field: keyof RoommateProfileFormData, 
    value: string, 
    setValue: (value: string) => void
  ) => {
    if (value.trim()) {
      onChange((prev: RoommateProfileFormData) => {
        const currentItems = (prev[field] as string[]) || [];
        // For dietary restrictions, remove "No Restrictions" when adding custom
        const filtered = field === 'dietaryRestrictions' 
          ? currentItems.filter(i => i !== 'No Restrictions')
          : currentItems;
        
        // Don't add duplicates
        if (!filtered.includes(value.trim())) {
          return { ...prev, [field]: [...filtered, value.trim()] };
        }
        return prev;
      });
      setValue("");
    }
  };

  // Helper to render option buttons
  const renderOptions = (
    options: string[],
    field: keyof RoommateProfileFormData,
    selectedItems: string[] | undefined
  ) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => toggleItem(field, option)}
          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
            selectedItems?.includes(option)
              ? "bg-primary-500 text-white"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );

  // Helper to render custom items
  const renderCustomItems = (
    items: string[] | undefined,
    predefinedItems: string[],
    field: keyof RoommateProfileFormData
  ) => {
    const customItems = (items || []).filter(
      item => !predefinedItems.includes(item) && item !== 'No Restrictions'
    );
    
    if (customItems.length === 0) return null;
    
    return (
      <div className="mt-2">
        <p className="text-xs text-stone-600 mb-1">Your additions:</p>
        <div className="flex flex-wrap gap-2">
          {customItems.map((item) => (
            <span
              key={item}
              className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm flex items-center gap-1"
            >
              {item}
              <button
                type="button"
                onClick={() => toggleItem(field, item)}
                className="ml-1 hover:text-secondary-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Hobbies */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Hobbies & Interests
          <span className="ml-2 text-xs font-normal text-stone-600">
            Select or add your own
          </span>
        </label>
        {renderOptions(COMMON_HOBBIES, 'hobbies', formData.hobbies)}
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={customHobby}
            onChange={(e) => setCustomHobby(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomItem('hobbies', customHobby, setCustomHobby);
              }
            }}
            placeholder="Add your own hobby..."
            className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => addCustomItem('hobbies', customHobby, setCustomHobby)}
            className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Add
          </button>
        </div>
        {renderCustomItems(formData.hobbies, COMMON_HOBBIES, 'hobbies')}
      </div>

      {/* Social Activities */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Social Activities
          <span className="ml-2 text-xs font-normal text-stone-600">
            What do you enjoy doing?
          </span>
        </label>
        {renderOptions(COMMON_SOCIAL_ACTIVITIES, 'socialActivities', formData.socialActivities)}
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={customSocial}
            onChange={(e) => setCustomSocial(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomItem('socialActivities', customSocial, setCustomSocial);
              }
            }}
            placeholder="Add your own activity..."
            className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => addCustomItem('socialActivities', customSocial, setCustomSocial)}
            className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Add
          </button>
        </div>
        {renderCustomItems(formData.socialActivities, COMMON_SOCIAL_ACTIVITIES, 'socialActivities')}
      </div>

      {/* Personality Traits */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Personality Traits
          <span className="ml-2 text-xs font-normal text-stone-600">
            How would you describe yourself?
          </span>
        </label>
        {renderOptions(COMMON_PERSONALITY_TRAITS, 'personality', formData.personality)}
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={customPersonality}
            onChange={(e) => setCustomPersonality(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomItem('personality', customPersonality, setCustomPersonality);
              }
            }}
            placeholder="Add your own trait..."
            className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => addCustomItem('personality', customPersonality, setCustomPersonality)}
            className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Add
          </button>
        </div>
        {renderCustomItems(formData.personality, COMMON_PERSONALITY_TRAITS, 'personality')}
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Languages You Speak
          <span className="ml-2 text-xs font-normal text-stone-600">
            Help find roommates you can communicate with
          </span>
        </label>
        {renderOptions(COMMON_LANGUAGES, 'languages', formData.languages)}
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={customLanguage}
            onChange={(e) => setCustomLanguage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomItem('languages', customLanguage, setCustomLanguage);
              }
            }}
            placeholder="Add another language..."
            className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => addCustomItem('languages', customLanguage, setCustomLanguage)}
            className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Add
          </button>
        </div>
        {renderCustomItems(formData.languages, COMMON_LANGUAGES, 'languages')}
      </div>

      {/* Dietary Restrictions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-stone-700">
            Dietary Restrictions
            <span className="ml-2 text-xs font-normal text-stone-600">
              Important for shared kitchen situations
            </span>
          </label>

          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!hasDietaryRestrictions}
              onChange={(e) => handleDietaryToggle(e.target.checked)}
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            <span className="ml-3 text-sm font-medium text-stone-700">
              {hasDietaryRestrictions ? "Yes" : "No"}
            </span>
          </label>
        </div>

        {/* Show restrictions options only if toggle is on */}
        {hasDietaryRestrictions && (
          <>
            {renderOptions(
              DIETARY_RESTRICTIONS.filter(r => r !== 'No Restrictions'), 
              'dietaryRestrictions', 
              formData.dietaryRestrictions
            )}
            
            {/* Custom dietary restrictions */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customDietary}
                onChange={(e) => setCustomDietary(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomItem('dietaryRestrictions', customDietary, setCustomDietary);
                  }
                }}
                placeholder="Add custom restriction..."
                className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => addCustomItem('dietaryRestrictions', customDietary, setCustomDietary)}
                className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Add
              </button>
            </div>

            {renderCustomItems(
              formData.dietaryRestrictions, 
              DIETARY_RESTRICTIONS, 
              'dietaryRestrictions'
            )}
          </>
        )}

        {/* Show "No dietary restrictions" message when toggle is off */}
        {!hasDietaryRestrictions && (
          <p className="text-sm text-stone-600 italic">
            No dietary restrictions selected
          </p>
        )}
      </div>
    </div>
  );
}