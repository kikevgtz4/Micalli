// frontend/src/components/roommate-profile/sections/LifestyleSection.tsx
import { HOBBIES, SOCIAL_ACTIVITIES, PERSONALITY_TRAITS, LANGUAGES } from '@/utils/constants';
import { RoommateProfileFormData } from "@/types/roommates";

interface LifestyleSectionProps {
  formData: RoommateProfileFormData;
  onChange: (updater: (prev: RoommateProfileFormData) => RoommateProfileFormData) => void;
}

export default function LifestyleSection({ formData, onChange }: LifestyleSectionProps) {
  const toggleItem = (field: keyof RoommateProfileFormData, item: string) => {
    onChange((prev: RoommateProfileFormData) => {
      const currentItems = (prev[field] as string[]) || [];
      const newItems = currentItems.includes(item)
        ? currentItems.filter((i: string) => i !== item)
        : [...currentItems, item];
      
      return {
        ...prev,
        [field]: newItems
      };
    });
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Hobbies */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Hobbies & Interests
          <span className="ml-2 text-xs font-normal text-stone-600">
            Select all that apply
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {HOBBIES.map((hobby) => (
            <button
              key={hobby}
              type="button"
              onClick={() => toggleItem('hobbies', hobby)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                formData.hobbies?.includes(hobby)
                  ? 'bg-primary-500 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {hobby}
            </button>
          ))}
        </div>
      </div>

      {/* Social Activities */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Social Activities
          <span className="ml-2 text-xs font-normal text-stone-600">
            What do you enjoy doing?
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_ACTIVITIES.map((activity) => (
            <button
              key={activity}
              type="button"
              onClick={() => toggleItem('socialActivities', activity)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                formData.socialActivities?.includes(activity)
                  ? 'bg-primary-500 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {activity}
            </button>
          ))}
        </div>
      </div>

      {/* Personality Traits */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Personality Traits
          <span className="ml-2 text-xs font-normal text-stone-600">
            How would you describe yourself?
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_TRAITS.map((trait) => (
            <button
              key={trait}
              type="button"
              onClick={() => toggleItem('personality', trait)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                formData.personality?.includes(trait)
                  ? 'bg-primary-500 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {trait}
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Languages You Speak
          <span className="ml-2 text-xs font-normal text-stone-600">
            Help find roommates you can communicate with
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => toggleItem('languages', language)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                formData.languages?.includes(language)
                  ? 'bg-primary-500 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {language}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500 mt-2">
          Tip: Select all languages you're comfortable speaking with roommates
        </p>
      </div>
    </div>
  );
}