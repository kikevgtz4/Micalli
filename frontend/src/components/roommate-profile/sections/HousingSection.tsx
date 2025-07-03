// frontend/src/components/roommate-profile/sections/HousingSection.tsx
import { RoommateProfileFormData } from '@/types/roommates';
import { HOUSING_TYPES } from '@/utils/constants';
import { CalendarIcon, HomeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface HousingSectionProps {
  formData: RoommateProfileFormData;
  onChange: (updater: (prev: RoommateProfileFormData) => RoommateProfileFormData) => void;
}

export default function HousingSection({ formData, onChange }: HousingSectionProps) {
  const handleChange = (field: keyof RoommateProfileFormData, value: any) => {
    onChange((prev: RoommateProfileFormData) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Budget Range */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Budget Range (MXN/month)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="relative">
              <CurrencyDollarIcon className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
              <input
                type="number"
                value={formData.budgetMin || ''}
                onChange={(e) => handleChange('budgetMin', parseInt(e.target.value) || 0)}
                className="w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Min"
                min="0"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <CurrencyDollarIcon className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
              <input
                type="number"
                value={formData.budgetMax || ''}
                onChange={(e) => handleChange('budgetMax', parseInt(e.target.value) || 0)}
                className="w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Max"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Move-in Date */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Preferred Move-in Date
        </label>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
          <input
            type="date"
            value={formData.moveInDate || ''}
            onChange={(e) => handleChange('moveInDate', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* Housing Type */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Housing Type Preference
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {HOUSING_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleChange('housingType', type.value)}
              className={`p-3 rounded-lg border transition-all ${
                formData.housingType === type.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-stone-200 hover:border-stone-300 text-stone-500'
              }`}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="text-sm font-medium">{type.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}