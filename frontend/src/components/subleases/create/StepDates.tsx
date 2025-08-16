// frontend/src/components/subleases/create/StepDates.tsx
import { FC, useEffect } from 'react';
import type { SubleaseFormData, UrgencyLevel } from '@/types/sublease';
import { CalendarIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { calculateDurationMonths } from '@/types/sublease';

interface StepProps {
  data: SubleaseFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const StepDates: FC<StepProps> = ({ data, onChange, errors }) => {
  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate maximum end date (12 months from start)
  const maxEndDate = data.startDate 
    ? new Date(new Date(data.startDate).setMonth(new Date(data.startDate).getMonth() + 12)).toISOString().split('T')[0]
    : '';

  // Calculate duration
  const duration = data.startDate && data.endDate 
    ? calculateDurationMonths(data.startDate, data.endDate)
    : 0;

  // Get urgency badge color
  const getUrgencyColor = (level: UrgencyLevel | '') => {
    switch (level) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUrgencyLabel = (level: UrgencyLevel | '') => {
    switch (level) {
      case 'urgent': return '🔥 Urgente';
      case 'high': return '⚡ Alta prioridad';
      case 'medium': return '📅 Prioridad media';
      case 'low': return '✅ Tiempo disponible';
      default: return 'Por calcular';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Fechas de disponibilidad</h2>
        <p className="text-gray-600">
          Indica cuándo estará disponible el espacio
        </p>
      </div>

      {/* Available Immediately */}
      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={data.availableImmediately}
            onChange={(e) => {
              onChange('availableImmediately', e.target.checked);
              if (e.target.checked) {
                onChange('startDate', today);
              }
            }}
            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <div>
            <span className="font-medium text-gray-700">Disponible inmediatamente</span>
            <p className="text-sm text-gray-500">El espacio ya está listo para ocuparse</p>
          </div>
        </label>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de inicio *
          </label>
          <div className="relative">
            <input
              type="date"
              value={data.startDate}
              onChange={(e) => onChange('startDate', e.target.value)}
              min={today}
              disabled={data.availableImmediately}
              className={`w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.startDate ? 'border-red-500' : 'border-gray-300'
              } ${data.availableImmediately ? 'bg-gray-50' : ''}`}
            />
            <CalendarIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          {errors.startDate && (
            <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de fin *
          </label>
          <div className="relative">
            <input
              type="date"
              value={data.endDate}
              onChange={(e) => onChange('endDate', e.target.value)}
              min={data.startDate || today}
              max={maxEndDate}
              className={`w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.endDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <CalendarIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          {errors.endDate && (
            <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Duration Display */}
      {duration > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">
                Duración: <strong>{duration} {duration === 1 ? 'mes' : 'meses'}</strong>
              </span>
            </div>
            {duration > 12 && (
              <span className="text-sm text-red-600">Máximo 12 meses permitidos</span>
            )}
          </div>
        </div>
      )}

      {/* Flexible Dates */}
      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={data.isFlexible}
            onChange={(e) => onChange('isFlexible', e.target.checked)}
            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <div className="flex-1">
            <span className="font-medium text-gray-700">Fechas flexibles</span>
            <p className="text-sm text-gray-500">Puedo ajustar las fechas según las necesidades</p>
          </div>
        </label>

        {data.isFlexible && (
          <div className="mt-3 ml-7">
            <label className="block text-sm text-gray-600 mb-1">
              Rango de flexibilidad (días)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="30"
                value={data.flexibilityRangeDays}
                onChange={(e) => onChange('flexibilityRangeDays', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-700 w-12">
                ±{data.flexibilityRangeDays}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Urgency Level Display */}
      {data.urgencyLevel && (
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Nivel de urgencia</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(data.urgencyLevel)}`}>
              {getUrgencyLabel(data.urgencyLevel)}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Se calcula automáticamente según la proximidad de la fecha de inicio
          </p>
        </div>
      )}

      {/* Warning for urgent listings */}
      {data.urgencyLevel === 'urgent' && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Tu subarriendo se marcará como urgente
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Esto puede aumentar la visibilidad pero también indica que necesitas 
              ocuparlo pronto. Considera ofrecer incentivos adicionales.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepDates;