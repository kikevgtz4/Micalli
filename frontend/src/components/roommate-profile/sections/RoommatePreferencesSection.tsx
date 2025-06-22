// frontend/src/components/roommate-profile/sections/RoommatePreferencesSection.tsx
import { RoommateProfileFormData } from '@/types/roommates';
import { GENDER_PREFERENCES, DEAL_BREAKERS } from '@/utils/constants';

interface RoommatePreferencesSectionProps {
  formData: RoommateProfileFormData;
  onChange: (updater: (prev: RoommateProfileFormData) => RoommateProfileFormData) => void;
}

export default function RoommatePreferencesSection({ formData, onChange }: RoommatePreferencesSectionProps) {
  const handleChange = (field: keyof RoommateProfileFormData, value: any) => {
    onChange((prev: RoommateProfileFormData) => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleDealBreaker = (item: string) => {
    onChange((prev: RoommateProfileFormData) => {
      const currentItems = prev.dealBreakers || [];
      const newItems = currentItems.includes(item)
        ? currentItems.filter((i: string) => i !== item)
        : [...currentItems, item];
      
      return {
        ...prev,
        dealBreakers: newItems
      };
    });
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Gender Preference */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Preferred Roommate Gender
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GENDER_PREFERENCES.map((pref) => (
            <button
              key={pref.value}
              type="button"
              onClick={() => handleChange('preferredRoommateGender', pref.value)}
              className={`p-3 rounded-lg border transition-all ${
                formData.preferredRoommateGender === pref.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-2xl mb-1">{pref.icon}</div>
              <div className="text-sm font-medium">{pref.label}</div>
            </button>
          ))}
        </div>
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
              value={formData.ageRangeMin || 18}
              onChange={(e) => handleChange('ageRangeMin', parseInt(e.target.value) || 18)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Min age"
              min="18"
              max="99"
            />
          </div>
          <div>
            <input
              type="number"
              value={formData.ageRangeMax || ''}
              onChange={(e) => handleChange('ageRangeMax', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Max age (optional)"
              min="18"
              max="99"
            />
          </div>
        </div>
      </div>

      {/* Deal Breakers */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Deal Breakers
          <span className="ml-2 text-xs font-normal text-stone-600">
            Select things you absolutely cannot live with
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DEAL_BREAKERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleDealBreaker(item)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                formData.dealBreakers?.includes(item)
                  ? 'bg-red-500 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}