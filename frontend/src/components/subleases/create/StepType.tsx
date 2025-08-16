// frontend/src/components/subleases/create/StepType.tsx
import { FC } from 'react';
import type { SubleaseFormData } from '@/types/sublease';
import { HomeIcon, CalendarIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface StepProps {
  data: SubleaseFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const StepType: FC<StepProps> = ({ data, onChange, errors }) => {
  const listingTypes = [
    {
      value: 'summer',
      label: 'Verano',
      description: 'Subarriendo durante las vacaciones de verano',
      icon: <CalendarIcon className="w-8 h-8" />,
    },
    {
      value: 'semester',
      label: 'Semestre',
      description: 'Un semestre académico completo',
      icon: <ClockIcon className="w-8 h-8" />,
    },
    {
      value: 'temporary',
      label: 'Temporal',
      description: 'Periodo corto (1-3 meses)',
      icon: <ArrowPathIcon className="w-8 h-8" />,
    },
    {
      value: 'takeover',
      label: 'Traspaso',
      description: 'Transferir el contrato completo',
      icon: <HomeIcon className="w-8 h-8" />,
    },
  ];

  const subleaseTypes = [
    {
      value: 'entire_place',
      label: 'Lugar completo',
      description: 'Todo el departamento o casa',
    },
    {
      value: 'private_room',
      label: 'Cuarto privado',
      description: 'Tu propio cuarto en un espacio compartido',
    },
    {
      value: 'shared_room',
      label: 'Cuarto compartido',
      description: 'Compartir habitación con otra persona',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2">¿Qué tipo de subarriendo es?</h2>
        <p className="text-gray-600 mb-6">
          Selecciona el tipo que mejor describa tu situación
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listingTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onChange('listingType', type.value)}
              className={`p-6 border-2 rounded-lg text-left hover:border-primary transition-all ${
                data.listingType === type.value
                  ? 'border-primary bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`${
                  data.listingType === type.value ? 'text-primary' : 'text-gray-400'
                }`}>
                  {type.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {errors.listingType && (
          <p className="mt-2 text-sm text-red-600">{errors.listingType}</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">¿Qué estás ofreciendo?</h3>
        <p className="text-gray-600 mb-4">
          Especifica qué tipo de espacio estás subarrendando
        </p>

        <div className="space-y-3">
          {subleaseTypes.map((type) => (
            <label
              key={type.value}
              className={`block p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-all ${
                data.subleaseType === type.value
                  ? 'border-primary bg-primary-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <input
                type="radio"
                name="subleaseType"
                value={type.value}
                checked={data.subleaseType === type.value}
                onChange={(e) => onChange('subleaseType', e.target.value)}
                className="sr-only"
              />
              <div>
                <h4 className="font-medium text-gray-900">{type.label}</h4>
                <p className="text-sm text-gray-600 mt-1">{type.description}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.subleaseType && (
          <p className="mt-2 text-sm text-red-600">{errors.subleaseType}</p>
        )}
      </div>
    </div>
  );
};

export default StepType;