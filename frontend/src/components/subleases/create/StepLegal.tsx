// frontend/src/components/subleases/create/StepLegal.tsx
import { FC, useState } from 'react';
import type { SubleaseFormData } from '@/types/sublease';
import { 
  DocumentTextIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

interface StepProps {
  data: SubleaseFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const StepLegal: FC<StepProps> = ({ data, onChange, errors }) => {
  const [showFullTerms, setShowFullTerms] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange('landlordConsentDocument', file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Aspectos legales</h2>
        <p className="text-gray-600">
          Asegúrate de cumplir con todos los requisitos legales
        </p>
      </div>

      {/* Landlord Consent */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Consentimiento del arrendador *
        </label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="landlordConsent"
              value="not_required"
              checked={data.landlordConsentStatus === 'not_required'}
              onChange={(e) => onChange('landlordConsentStatus', e.target.value)}
              className="mt-1"
            />
            <div>
              <p className="font-medium text-gray-900">No requerido</p>
              <p className="text-sm text-gray-600">Mi contrato permite subarrendar sin autorización</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="landlordConsent"
              value="confirmed"
              checked={data.landlordConsentStatus === 'confirmed'}
              onChange={(e) => onChange('landlordConsentStatus', e.target.value)}
              className="mt-1"
            />
            <div>
              <p className="font-medium text-gray-900">Confirmado verbalmente</p>
              <p className="text-sm text-gray-600">Tengo autorización verbal del arrendador</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="landlordConsent"
              value="documented"
              checked={data.landlordConsentStatus === 'documented'}
              onChange={(e) => onChange('landlordConsentStatus', e.target.value)}
              className="mt-1"
            />
            <div>
              <p className="font-medium text-gray-900">Documentado</p>
              <p className="text-sm text-gray-600">Tengo autorización por escrito</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="landlordConsent"
              value="verified"
              checked={data.landlordConsentStatus === 'verified'}
              onChange={(e) => onChange('landlordConsentStatus', e.target.value)}
              className="mt-1"
            />
            <div>
              <p className="font-medium text-gray-900">Verificado por Micalli</p>
              <p className="text-sm text-gray-600">Subiré documento de autorización</p>
            </div>
          </label>
        </div>
        {errors.landlordConsentStatus && (
          <p className="mt-2 text-xs text-red-600">{errors.landlordConsentStatus}</p>
        )}

        {/* Document Upload */}
        {data.landlordConsentStatus === 'verified' && (
          <div className="mt-4 ml-7">
            <label className="block text-sm text-gray-600 mb-2">
              Documento de consentimiento (PDF o imagen)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="consent-upload"
              />
              <label
                htmlFor="consent-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <ArrowUpTrayIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {data.landlordConsentDocument 
                    ? `Archivo: ${(data.landlordConsentDocument as File).name}`
                    : 'Clic para subir documento'}
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Warning if no consent */}
      {data.landlordConsentStatus === 'not_required' && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Verifica tu contrato
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Asegúrate de que tu contrato realmente permite subarrendar. 
              Subarrendar sin autorización puede tener consecuencias legales.
            </p>
          </div>
        </div>
      )}

      {/* Lease Transfer */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={data.leaseTransferAllowed}
            onChange={(e) => onChange('leaseTransferAllowed', e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <div>
            <span className="font-medium text-gray-700">Permite transferencia de contrato</span>
            <p className="text-sm text-gray-500">
              El inquilino puede asumir mi contrato original si ambos lo acordamos
            </p>
          </div>
        </label>
      </div>

      {/* Sublease Agreement */}
      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={data.subleaseAgreementRequired}
            onChange={(e) => onChange('subleaseAgreementRequired', e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <div>
            <span className="font-medium text-gray-700">Requiere acuerdo de subarriendo</span>
            <p className="text-sm text-gray-500">
              Firmaremos un acuerdo formal antes de la ocupación
            </p>
          </div>
        </label>
      </div>

      {/* Terms and Conditions */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Términos y condiciones</h3>
        
        <div className="p-4 bg-gray-50 rounded-lg space-y-3 max-h-64 overflow-y-auto">
          <p className="text-sm text-gray-700">
            Al publicar este subarriendo, declaro que:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>Toda la información proporcionada es verídica y precisa</li>
            <li>Tengo el derecho legal de subarrendar este espacio</li>
            <li>Cumpliré con todas las leyes y regulaciones aplicables</li>
            <li>Responderé de manera oportuna a las consultas de los interesados</li>
            <li>No discriminaré por raza, género, religión u orientación sexual</li>
            <li>Mantendré el espacio en las condiciones mostradas en las fotos</li>
            <li>Notificaré inmediatamente si el espacio ya no está disponible</li>
            <li>Acepto la comisión de Micalli del 5% sobre el primer mes de renta</li>
          </ul>
          
          {showFullTerms && (
            <>
              <p className="text-sm text-gray-700 mt-4">
                Además, entiendo que:
              </p>
              <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                <li>Micalli se reserva el derecho de verificar la información</li>
                <li>Los anuncios falsos o engañosos serán removidos</li>
                <li>Mi cuenta puede ser suspendida por violaciones repetidas</li>
                <li>Soy responsable de cualquier disputa con el inquilino</li>
                <li>Micalli actúa solo como intermediario</li>
              </ul>
            </>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => setShowFullTerms(!showFullTerms)}
          className="mt-2 text-sm text-primary hover:underline"
        >
          {showFullTerms ? 'Ver menos' : 'Ver términos completos'}
        </button>

        {/* Accept Terms */}
        <div className="mt-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={data.disclaimersAccepted}
              onChange={(e) => onChange('disclaimersAccepted', e.target.checked)}
              className={`mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary ${
                errors.disclaimersAccepted ? 'border-red-500' : ''
              }`}
            />
            <div>
              <span className="font-medium text-gray-700">
                Acepto los términos y condiciones *
              </span>
              <p className="text-sm text-gray-500">
                He leído y acepto todos los términos descritos arriba
              </p>
            </div>
          </label>
          {errors.disclaimersAccepted && (
            <p className="mt-2 text-xs text-red-600">{errors.disclaimersAccepted}</p>
          )}
        </div>
      </div>

      {/* Security Badge */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800">Tu información está segura</p>
            <p className="text-sm text-green-700 mt-1">
              Micalli protege tu privacidad y solo comparte información necesaria 
              con inquilinos verificados después de tu aprobación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepLegal;