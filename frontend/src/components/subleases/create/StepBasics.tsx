// frontend/src/components/subleases/create/StepBasics.tsx
import { FC } from 'react';
import type { SubleaseFormData } from '@/types/sublease';

interface StepProps {
  data: SubleaseFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const StepBasics: FC<StepProps> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Información básica</h2>
        <p className="text-gray-600">
          Proporciona detalles que ayuden a los estudiantes a entender tu oferta
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título del anuncio *
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Ej: Depa amueblado cerca del Tec, 2 cuartos"
          maxLength={100}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            {data.title.length}/100 caracteres
          </span>
          {errors.title && (
            <span className="text-xs text-red-600">{errors.title}</span>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción detallada *
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Describe el espacio, ubicación, por qué lo subarriendas, qué incluye, etc."
          rows={8}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            Mínimo 50 caracteres • {data.description.length} escritos
          </span>
          {errors.description && (
            <span className="text-xs text-red-600">{errors.description}</span>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Información adicional (opcional)
        </label>
        <textarea
          value={data.additionalInfo || ''}
          onChange={(e) => onChange('additionalInfo', e.target.value)}
          placeholder="Cualquier detalle extra que quieras compartir: reglas específicas, ventajas del lugar, transporte cercano, etc."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Tips */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips para un buen anuncio:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Sé específico sobre la ubicación y cercanía a universidades</li>
          <li>• Menciona si está amueblado y qué incluye</li>
          <li>• Explica por qué estás subarrendando (intercambio, graduación, etc.)</li>
          <li>• Destaca las mejores características del lugar</li>
        </ul>
      </div>
    </div>
  );
};

export default StepBasics;