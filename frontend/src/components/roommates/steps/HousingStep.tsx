// frontend/src/components/roommates/steps/HousingStep.tsx
import { StepProps } from '@/types/roommates';
import {
  HomeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const HOUSING_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'house', label: 'House', icon: '🏠' },
  { value: 'studio', label: 'Studio', icon: '🏨' },
  { value: 'shared_room', label: 'Shared Room', icon: '👥' },
  { value: 'private_room', label: 'Private Room', icon: '🚪' },
];

const LEASE_DURATIONS = [
  { value: '1_month', label: '1 Month' },
  { value: '3_months', label: '3 Months' },
  { value: '6_months', label: '6 Months' },
  { value: '12_months', label: '12 Months' },
  { value: 'flexible', label: 'Flexible' },
];

const POPULAR_LOCATIONS = [
  'Near Campus',
  'Downtown',
  'San Pedro',
  'Valle Oriente',
  'Tecnológico',
  'Cumbres',
  'Del Valle',
  'Carretera Nacional',
];

export function HousingStep({ data, onChange, errors }: StepProps) {
  const handleLocationToggle = (location: string) => {
    const current = data.preferredLocations || [];
    if (current.includes(location)) {
      onChange('preferredLocations', current.filter(l => l !== location));
    } else {
      onChange('preferredLocations', [...current, location]);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Budget Range */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <CurrencyDollarIcon className="w-5 h-5 text-primary-600" />
          Monthly Budget Range
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Minimum Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
              <input
                type="number"
                value={data.budgetMin || 0}
                onChange={(e) => onChange('budgetMin', parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="3000"
                min="0"
                step="500"
              />
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {formatCurrency(data.budgetMin || 0)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Maximum Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
              <input
                type="number"
                value={data.budgetMax || 10000}
                onChange={(e) => onChange('budgetMax', parseInt(e.target.value) || 10000)}
                className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="8000"
                min="0"
                step="500"
              />
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {formatCurrency(data.budgetMax || 10000)}
            </p>
          </div>
        </div>
        {data.budgetMin && data.budgetMax && data.budgetMin > data.budgetMax && (
          <p className="mt-2 text-sm text-red-600">
            Maximum budget must be greater than minimum budget
          </p>
        )}
      </div>

      {/* Housing Type */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <HomeIcon className="w-5 h-5 text-primary-600" />
          Preferred Housing Type
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {HOUSING_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange('housingType', type.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                data.housingType === type.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="text-sm font-medium text-stone-900">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Move-in Date */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary-600" />
          Move-in Date
        </h3>
        <input
          type="date"
          value={data.moveInDate || ''}
          onChange={(e) => onChange('moveInDate', e.target.value)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          min={new Date().toISOString().split('T')[0]}
        />
        <p className="mt-2 text-sm text-stone-600">
          Leave empty if you're flexible with the move-in date
        </p>
      </div>

      {/* Lease Duration */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-primary-600" />
          Preferred Lease Duration
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {LEASE_DURATIONS.map((duration) => (
            <button
              key={duration.value}
              type="button"
              onClick={() => onChange('leaseDuration', duration.value)}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                data.leaseDuration === duration.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              {duration.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Locations */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <MapPinIcon className="w-5 h-5 text-primary-600" />
          Preferred Locations
        </h3>
        <p className="text-sm text-stone-600 mb-4">
          Select all areas in Monterrey where you'd like to live
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {POPULAR_LOCATIONS.map((location) => (
            <button
              key={location}
              type="button"
              onClick={() => handleLocationToggle(location)}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                data.preferredLocations?.includes(location)
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-stone-200 text-stone-700 hover:border-stone-300'
              }`}
            >
              {location}
            </button>
          ))}
        </div>
        {data.preferredLocations && data.preferredLocations.length > 0 && (
          <p className="mt-3 text-sm text-stone-600">
            Selected: {data.preferredLocations.length} location(s)
          </p>
        )}
      </div>

      {/* Work Schedule (since you mentioned this was missing) */}
      <div>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          Work Schedule
        </h3>
        <p className="text-sm text-stone-600 mb-4">
          Let potential roommates know about your work schedule
        </p>
        <textarea
          value={data.workSchedule || ''}
          onChange={(e) => onChange('workSchedule', e.target.value)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          rows={3}
          placeholder="e.g., Monday-Friday 9am-5pm, Weekend shifts, Remote work, etc."
        />
      </div>
    </div>
  );
}