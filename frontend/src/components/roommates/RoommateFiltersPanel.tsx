// frontend/src/components/roommates/RoommateFiltersPanel.tsx
'use client';
import { X } from 'lucide-react';

interface RoommateFiltersPanelProps {
  filters: {
    ageMin: number;
    ageMax: number;
    gender: string;
    major: string;
    lifestyle: string[];
    habits: string[];
    interests: string[];
  };
  onFilterChange: <K extends keyof RoommateFiltersPanelProps['filters']>(
    key: K,
    value: RoommateFiltersPanelProps['filters'][K]
  ) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export default function RoommateFiltersPanel({
  filters,
  onFilterChange,
  onClose,
  isMobile = false,
}: RoommateFiltersPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm h-full overflow-y-auto">
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Filtros de Roommate</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-stone-100"
          >
            <X className="h-5 w-5 text-stone-500" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Age Range */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-700">Rango de Edad</h3>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={filters.ageMin}
              onChange={(e) => onFilterChange('ageMin', parseInt(e.target.value))}
              className="w-20 px-3 py-2 border border-stone-200 rounded-md"
              min="18"
              max="99"
            />
            <span className="text-stone-500">-</span>
            <input
              type="number"
              value={filters.ageMax}
              onChange={(e) => onFilterChange('ageMax', parseInt(e.target.value))}
              className="w-20 px-3 py-2 border border-stone-200 rounded-md"
              min="18"
              max="99"
            />
            <span className="text-sm text-stone-600">años</span>
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-700">Género</h3>
          <div className="space-y-2">
            {['', 'male', 'female', 'other'].map((gender) => (
              <label key={gender} className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={filters.gender === gender}
                  onChange={(e) => onFilterChange('gender', e.target.value)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-stone-700">
                  {gender === '' ? 'Todos' : 
                   gender === 'male' ? 'Masculino' : 
                   gender === 'female' ? 'Femenino' : 'Otro'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Major/Career */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-700">Carrera</h3>
          <input
            type="text"
            value={filters.major}
            onChange={(e) => onFilterChange('major', e.target.value)}
            placeholder="ej. Ingeniería, Medicina..."
            className="w-full px-3 py-2 border border-stone-200 rounded-md"
          />
        </div>

        {/* Lifestyle */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-700">Estilo de Vida</h3>
          <div className="space-y-2">
            {[
              { value: 'early_bird', label: '🌅 Madrugador' },
              { value: 'night_owl', label: '🦉 Noctámbulo' },
              { value: 'organized', label: '📚 Organizado' },
              { value: 'relaxed', label: '😌 Relajado' },
              { value: 'social', label: '🎉 Social' },
              { value: 'quiet', label: '🤫 Tranquilo' },
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.lifestyle.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onFilterChange('lifestyle', [...filters.lifestyle, option.value]);
                    } else {
                      onFilterChange('lifestyle', filters.lifestyle.filter(l => l !== option.value));
                    }
                  }}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-stone-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Study Habits */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-stone-700">Hábitos de Estudio</h3>
          <div className="space-y-2">
            {[
              { value: 'room', label: '📖 Estudia en cuarto' },
              { value: 'library', label: '📚 Estudia en biblioteca' },
              { value: 'group', label: '👥 Estudia en grupo' },
              { value: 'alone', label: '🧘 Estudia solo' },
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.habits.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onFilterChange('habits', [...filters.habits, option.value]);
                    } else {
                      onFilterChange('habits', filters.habits.filter(h => h !== option.value));
                    }
                  }}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-stone-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}