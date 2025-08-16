// frontend/src/components/subleases/create/StepRoommates.tsx
import { FC } from 'react';
import type { SubleaseFormData } from '@/types/sublease';
import { UserGroupIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface StepProps {
  data: SubleaseFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const StepRoommates: FC<StepProps> = ({ data, onChange, errors }) => {
  const sharedSpaceOptions = [
    'Sala',
    'Cocina',
    'Comedor',
    'Baño',
    'Terraza',
    'Jardín',
    'Área de estudio',
    'Lavandería',
    'Estacionamiento',
  ];

  const toggleSharedSpace = (space: string) => {
    const current = data.sharedSpaces || [];
    if (current.includes(space)) {
      onChange('sharedSpaces', current.filter(s => s !== space));
    } else {
      onChange('sharedSpaces', [...current, space]);
    }
  };

  const isSharedRoom = data.subleaseType === 'shared_room';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Información de compañeros</h2>
        <p className="text-gray-600">
          {isSharedRoom 
            ? 'Como es un cuarto compartido, esta información es muy importante'
            : 'Ayuda a los interesados a conocer con quién vivirán'}
        </p>
      </div>

      {/* Warning for shared room */}
      {isSharedRoom && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Cuarto compartido
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              El inquilino compartirá la habitación con otra persona. 
              Por favor, proporciona detalles sobre el compañero de cuarto.
            </p>
          </div>
        </div>
      )}

      {/* Number of Roommates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total de personas en el lugar *
          </label>
          <input
            type="number"
            value={data.totalRoommates || ''}
            onChange={(e) => onChange('totalRoommates', e.target.value ? parseInt(e.target.value) : undefined)}
            min="1"
            max="10"
            placeholder="Incluyendo al nuevo inquilino"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.totalRoommates ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.totalRoommates && (
            <p className="mt-1 text-xs text-red-600">{errors.totalRoommates}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compañeros actuales *
          </label>
          <input
            type="number"
            value={data.currentRoommates ?? ''}
            onChange={(e) => onChange('currentRoommates', e.target.value !== '' ? parseInt(e.target.value) : undefined)}
            min="0"
            max={data.totalRoommates ? data.totalRoommates - 1 : 9}
            placeholder="Sin contar el espacio disponible"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.currentRoommates ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.currentRoommates && (
            <p className="mt-1 text-xs text-red-600">{errors.currentRoommates}</p>
          )}
        </div>
      </div>

      {/* Roommate Genders */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Género de los compañeros actuales
        </label>
        <select
          value={data.roommateGenders || ''}
          onChange={(e) => onChange('roommateGenders', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">Selecciona una opción</option>
          <option value="all_male">Todos hombres</option>
          <option value="all_female">Todas mujeres</option>
          <option value="mixed">Mixto</option>
          <option value="prefer_not_say">Prefiero no especificar</option>
        </select>
      </div>

      {/* Roommate Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción de los compañeros {isSharedRoom && '*'}
        </label>
        <textarea
          value={data.roommateDescription || ''}
          onChange={(e) => onChange('roommateDescription', e.target.value)}
          placeholder={isSharedRoom 
            ? "Describe a la persona con quien compartirá cuarto: edad, ocupación, horarios, personalidad, etc."
            : "Opcional: edades, ocupaciones, estilos de vida, horarios, etc."}
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
            errors.roommateDescription ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.roommateDescription && (
          <p className="mt-1 text-xs text-red-600">{errors.roommateDescription}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {isSharedRoom 
            ? "Esta información es crucial para cuartos compartidos"
            : "Ayuda a los interesados a saber si encajarán bien"}
        </p>
      </div>

      {/* Shared Spaces */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Espacios compartidos
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {sharedSpaceOptions.map((space) => (
            <label
              key={space}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={data.sharedSpaces?.includes(space) || false}
                onChange={() => toggleSharedSpace(space)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{space}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Sé honesto sobre los hábitos de los compañeros actuales</li>
          <li>• Menciona horarios de estudio o trabajo si son relevantes</li>
          <li>• Incluye información sobre el ambiente (tranquilo, social, etc.)</li>
          {isSharedRoom && (
            <li>• Para cuartos compartidos, sé muy específico sobre el compañero de habitación</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default StepRoommates;