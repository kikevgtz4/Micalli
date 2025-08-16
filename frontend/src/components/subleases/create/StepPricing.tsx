// frontend/src/components/subleases/create/StepPricing.tsx
import { FC, useEffect, useState } from 'react';
import type { SubleaseFormData } from '@/types/sublease';
import { 
  CurrencyDollarIcon, 
  CalculatorIcon,
  BoltIcon,
  PlusCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface StepProps {
  data: SubleaseFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const StepPricing: FC<StepProps> = ({ data, onChange, errors }) => {
  const [additionalFeeKey, setAdditionalFeeKey] = useState('');
  const [additionalFeeValue, setAdditionalFeeValue] = useState('');

  const utilities = [
    'Agua',
    'Luz',
    'Gas',
    'Internet',
    'Cable TV',
    'Limpieza',
    'Mantenimiento',
    'Seguridad',
    'Basura',
  ];

  const toggleUtility = (utility: string) => {
    const current = data.utilitiesIncluded || [];
    if (current.includes(utility)) {
      onChange('utilitiesIncluded', current.filter(u => u !== utility));
    } else {
      onChange('utilitiesIncluded', [...current, utility]);
    }
  };

  const addAdditionalFee = () => {
    if (additionalFeeKey && additionalFeeValue) {
      const currentFees = data.additionalFees || {};
      onChange('additionalFees', {
        ...currentFees,
        [additionalFeeKey]: parseFloat(additionalFeeValue)
      });
      setAdditionalFeeKey('');
      setAdditionalFeeValue('');
    }
  };

  const removeAdditionalFee = (key: string) => {
    const currentFees = { ...(data.additionalFees || {}) };
    delete currentFees[key];
    onChange('additionalFees', currentFees);
  };

  // Calculate savings
  const savings = data.originalRent && data.subleaseRent 
    ? Math.max(0, data.originalRent - data.subleaseRent)
    : 0;
  const savingsPercentage = data.originalRent && savings
    ? Math.round((savings / data.originalRent) * 100)
    : 0;

  // Calculate total monthly cost
  const totalMonthlyCost = (data.subleaseRent || 0) + 
    Object.values(data.additionalFees || {}).reduce((sum, fee) => sum + fee, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Precios y costos</h2>
        <p className="text-gray-600">
          Define los costos del subarriendo
        </p>
      </div>

      {/* Original vs Sublease Rent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Renta original (lo que tú pagas) *
          </label>
          <div className="relative">
            <input
              type="number"
              value={data.originalRent || ''}
              onChange={(e) => onChange('originalRent', e.target.value ? parseInt(e.target.value) : 0)}
              placeholder="0"
              min="0"
              className={`w-full px-4 py-2 pl-8 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.originalRent ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
          </div>
          {errors.originalRent && (
            <p className="mt-1 text-xs text-red-600">{errors.originalRent}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio del subarriendo *
          </label>
          <div className="relative">
            <input
              type="number"
              value={data.subleaseRent || ''}
              onChange={(e) => onChange('subleaseRent', e.target.value ? parseInt(e.target.value) : 0)}
              placeholder="0"
              min="0"
              className={`w-full px-4 py-2 pl-8 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.subleaseRent ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
          </div>
          {errors.subleaseRent && (
            <p className="mt-1 text-xs text-red-600">{errors.subleaseRent}</p>
          )}
        </div>
      </div>

      {/* Savings Display */}
      {savings > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">
                ¡El inquilino ahorra!
              </p>
              <p className="text-2xl font-bold text-green-600">
                ${savings}/mes ({savingsPercentage}% de descuento)
              </p>
            </div>
            <CalculatorIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
      )}

      {/* Deposit */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={data.depositRequired}
            onChange={(e) => {
              onChange('depositRequired', e.target.checked);
              if (!e.target.checked) {
                onChange('depositAmount', 0);
              }
            }}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="font-medium text-gray-700">Requiere depósito</span>
        </label>

        {data.depositRequired && (
          <div className="mt-3 ml-7">
            <label className="block text-sm text-gray-600 mb-1">
              Monto del depósito *
            </label>
            <div className="relative">
              <input
                type="number"
                value={data.depositAmount || ''}
                onChange={(e) => onChange('depositAmount', e.target.value ? parseInt(e.target.value) : 0)}
                placeholder="0"
                min="0"
                className={`w-full px-4 py-2 pl-8 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.depositAmount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            </div>
            {errors.depositAmount && (
              <p className="mt-1 text-xs text-red-600">{errors.depositAmount}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Sugerido: 1 mes de renta (${data.subleaseRent || 0})
            </p>
          </div>
        )}
      </div>

      {/* Utilities Included */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <BoltIcon className="w-5 h-5 inline mr-1" />
          Servicios incluidos en la renta
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {utilities.map((utility) => (
            <label
              key={utility}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={data.utilitiesIncluded?.includes(utility) || false}
                onChange={() => toggleUtility(utility)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{utility}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional Fees */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Costos adicionales (opcional)
        </label>
        
        {/* Add new fee */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={additionalFeeKey}
            onChange={(e) => setAdditionalFeeKey(e.target.value)}
            placeholder="Concepto (ej: Estacionamiento)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="number"
            value={additionalFeeValue}
            onChange={(e) => setAdditionalFeeValue(e.target.value)}
            placeholder="Monto"
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={addAdditionalFee}
            disabled={!additionalFeeKey || !additionalFeeValue}
            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircleIcon className="w-5 h-5" />
          </button>
        </div>

        {/* List of additional fees */}
        {Object.entries(data.additionalFees || {}).length > 0 && (
          <div className="space-y-2">
            {Object.entries(data.additionalFees || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">${value}</span>
                  <button
                    type="button"
                    onClick={() => removeAdditionalFee(key)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Cost Summary */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Resumen de costos para el inquilino</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Renta mensual</span>
            <span className="font-medium">${data.subleaseRent || 0}</span>
          </div>
          {Object.entries(data.additionalFees || {}).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span>{key}</span>
              <span>${value}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-300">
            <div className="flex justify-between">
              <span className="font-medium">Total mensual</span>
              <span className="font-bold text-lg">${totalMonthlyCost}</span>
            </div>
          </div>
          {data.depositRequired && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Depósito (pago único)</span>
              <span>${data.depositAmount || 0}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepPricing;