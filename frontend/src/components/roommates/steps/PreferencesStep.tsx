// frontend/src/components/roommates/steps/PreferencesStep.tsx

import { StepProps } from "@/types/roommates";
import { useState, useEffect } from "react";

export const PreferencesStep = ({ data, onChange, errors }: StepProps) => {
  const [dietaryInput, setDietaryInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  
  // Track if user has explicitly interacted with dietary restrictions
  const [dietaryTouched, setDietaryTouched] = useState(false);
  
  // Determine if dietary restrictions are active
  const hasDietaryRestrictions = dietaryTouched || (data.dietaryRestrictions?.length ?? 0) > 0;

  // Update the state when data changes (e.g., when editing existing profile)
  useEffect(() => {
    if ((data.dietaryRestrictions?.length ?? 0) > 0) {
      setDietaryTouched(true);
    }
  }, [data.dietaryRestrictions]);

  const handleAddItem = (
    field: "dietaryRestrictions" | "languages",
    value: string
  ) => {
    if (value.trim()) {
      const currentValues = data[field] || [];
      onChange(field, [...currentValues, value.trim()]);
      if (field === "dietaryRestrictions") {
        setDietaryInput("");
      } else {
        setLanguageInput("");
      }
    }
  };

  const handleRemoveItem = (
    field: "dietaryRestrictions" | "languages",
    index: number
  ) => {
    const currentValues = data[field] || [];
    const newValues = currentValues.filter((_, i) => i !== index);
    onChange(field, newValues);
    
    // If removing last dietary restriction, uncheck the box
    if (field === "dietaryRestrictions" && newValues.length === 0) {
      setDietaryTouched(false);
    }
  };

  const handleDietaryCheckboxChange = (checked: boolean) => {
    setDietaryTouched(checked);
    if (!checked) {
      // Clear dietary restrictions when unchecked
      onChange("dietaryRestrictions", []);
      setDietaryInput("");
    }
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
              checked={data.petFriendly ?? false}
              onChange={(e) => onChange("petFriendly", e.target.checked)}
              className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-stone-700">I'm okay with pets 🐾</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.smokingAllowed ?? false}
              onChange={(e) => onChange("smokingAllowed", e.target.checked)}
              className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-stone-700">I'm okay with smoking 🚬</span>
          </label>
        </div>
      </div>

      {/* Dietary Restrictions - Updated with checkbox */}
      <div>
        <label className="flex items-center space-x-3 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={hasDietaryRestrictions}
            onChange={(e) => handleDietaryCheckboxChange(e.target.checked)}
            className="h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-stone-700">
            I have dietary restrictions
          </span>
        </label>
        
        {/* Show error if checkbox is checked but no restrictions added */}
        {hasDietaryRestrictions && (data.dietaryRestrictions?.length === 0) && errors.dietaryRestrictions && (
          <p className="text-sm text-red-600 mb-2 ml-8">
            {errors.dietaryRestrictions}
          </p>
        )}
        
        {hasDietaryRestrictions && (
          <>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={dietaryInput}
                onChange={(e) => setDietaryInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddItem("dietaryRestrictions", dietaryInput);
                  }
                }}
                placeholder="e.g., Vegetarian, Halal, Gluten-free"
                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.dietaryRestrictions && (data.dietaryRestrictions?.length === 0) 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-stone-300'
                }`}
              />
              <button
                type="button"
                onClick={() => handleAddItem("dietaryRestrictions", dietaryInput)}
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
                    onClick={() => handleRemoveItem("dietaryRestrictions", index)}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {(data.dietaryRestrictions?.length === 0) && (
              <p className="text-xs text-stone-500 mt-1 ml-1">
                Add at least one dietary restriction or uncheck the box above
              </p>
            )}
          </>
        )}
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
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddItem("languages", languageInput);
              }
            }}
            placeholder="e.g., English, Spanish, Mandarin"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-stone-300"
          />
          <button
            type="button"
            onClick={() => handleAddItem("languages", languageInput)}
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
                onClick={() => handleRemoveItem("languages", index)}
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