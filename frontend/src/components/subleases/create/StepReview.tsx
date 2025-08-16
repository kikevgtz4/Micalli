// frontend/src/components/subleases/create/StepReview.tsx
import { FC } from 'react';
import PropertyImage from '@/components/common/PropertyImage';
import UrgencyBadge from '@/components/subleases/UrgencyBadge';
import type { SubleaseFormData } from '@/types/sublease';
import { calculateDurationMonths } from '@/types/sublease';
import { formatters } from '@/utils/formatters';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface StepProps {
  data: SubleaseFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const StepReview: FC<StepProps> = ({ data, onChange, errors }) => {
  const duration = data.startDate && data.endDate 
    ? calculateDurationMonths(data.startDate, data.endDate)
    : 0;

  const totalMonthlyCost = (data.subleaseRent || 0) + 
    Object.values(data.additionalFees || {}).reduce((sum, fee) => sum + fee, 0);

  // Create preview URLs for images - handle undefined
  const imagePreviews = data.images?.map(file => URL.createObjectURL(file)) || [];
  const imageCount = data.images?.length || 0;  // Add this for safe access

  const getListingTypeLabel = (type: string) => {
    switch(type) {
      case 'summer': return 'Verano';
      case 'semester': return 'Semestre';
      case 'temporary': return 'Temporal';
      case 'takeover': return 'Traspaso';
      default: return type;
    }
  };

  const getSubleaseTypeLabel = (type: string) => {
    switch(type) {
      case 'entire_place': return 'Lugar completo';
      case 'private_room': return 'Cuarto privado';
      case 'shared_room': return 'Cuarto compartido';
      default: return type;
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    switch(type) {
      case 'apartment': return 'Departamento';
      case 'house': return 'Casa';
      case 'studio': return 'Estudio';
      case 'dorm': return 'Dormitorio';
      case 'condo': return 'Condominio';
      default: return type;
    }
  };

  const getConsentStatusLabel = (status: string) => {
    switch(status) {
      case 'not_required': return 'No requerido';
      case 'confirmed': return 'Confirmado verbalmente';
      case 'documented': return 'Documentado';
      case 'verified': return 'Verificado por Micalli';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Revisa tu anuncio</h2>
        <p className="text-gray-600">
          Asegúrate de que toda la información sea correcta antes de publicar
        </p>
      </div>

      {/* Preview Card */}
      <div className="bg-white border-2 border-primary rounded-xl overflow-hidden">
        <div className="bg-primary text-white px-6 py-3">
          <p className="text-sm font-medium">Vista previa del anuncio</p>
        </div>
        
        {/* Images */}
        {imagePreviews.length > 0 && (
          <div className="relative h-64 bg-gray-100">
            <img
              src={imagePreviews[0]}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {imagePreviews.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
                +{imagePreviews.length - 1} fotos más
              </div>
            )}
            {data.urgencyLevel && (
              <div className="absolute top-2 left-2">
                <UrgencyBadge urgencyLevel={data.urgencyLevel} size="sm" />
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{data.title}</h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <span>{getSubleaseTypeLabel(data.subleaseType)}</span>
            <span>•</span>
            <span>{data.bedrooms} hab, {data.bathrooms} baños</span>
            <span>•</span>
            <span>{duration} {duration === 1 ? 'mes' : 'meses'}</span>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-primary">${data.subleaseRent}</span>
            <span className="text-gray-500">/mes</span>
            {data.originalRent > data.subleaseRent && (
              <span className="text-sm text-green-600 ml-2">
                Ahorra ${data.originalRent - data.subleaseRent}/mes
              </span>
            )}
          </div>

          <p className="text-gray-700 line-clamp-3">{data.description}</p>
        </div>
      </div>

      {/* Detailed Review Sections */}
      <div className="space-y-4">
        {/* Basic Info */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Información básica</h4>
            <button className="text-primary hover:text-primary-600">
              <PencilIcon className="w-4 h-4" />
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Tipo de listado</dt>
              <dd className="font-medium">{getListingTypeLabel(data.listingType)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Tipo de espacio</dt>
              <dd className="font-medium">{getSubleaseTypeLabel(data.subleaseType)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Tipo de propiedad</dt>
              <dd className="font-medium">{getPropertyTypeLabel(data.propertyType)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Ubicación</dt>
              <dd className="font-medium">{data.address}</dd>
            </div>
          </dl>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Fechas</h4>
            <button className="text-primary hover:text-primary-600">
              <PencilIcon className="w-4 h-4" />
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Inicio</dt>
              <dd className="font-medium">{formatters.date.full(data.startDate)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Fin</dt>
              <dd className="font-medium">{formatters.date.full(data.endDate)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Duración</dt>
              <dd className="font-medium">{duration} {duration === 1 ? 'mes' : 'meses'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Flexibilidad</dt>
              <dd className="font-medium">
                {data.isFlexible ? `±${data.flexibilityRangeDays} días` : 'Fechas fijas'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Precios</h4>
            <button className="text-primary hover:text-primary-600">
              <PencilIcon className="w-4 h-4" />
            </button>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Renta mensual</dt>
              <dd className="font-medium">${data.subleaseRent}</dd>
            </div>
            {Object.entries(data.additionalFees || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-gray-500">{key}</dt>
                <dd className="font-medium">${value}</dd>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t">
              <dt className="font-medium">Total mensual</dt>
              <dd className="font-bold">${totalMonthlyCost}</dd>
            </div>
            {data.depositRequired && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Depósito</dt>
                <dd className="font-medium">${data.depositAmount}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Roommates (if applicable) */}
        {(data.subleaseType === 'shared_room' || data.subleaseType === 'private_room') && (
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Compañeros</h4>
              <button className="text-primary hover:text-primary-600">
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Total de personas</dt>
                <dd className="font-medium">{data.totalRoommates || 'No especificado'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Compañeros actuales</dt>
                <dd className="font-medium">{data.currentRoommates ?? 'No especificado'}</dd>
              </div>
            </dl>
            {data.subleaseType === 'shared_room' && (
              <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                ⚠️ Cuarto compartido - Se compartirá habitación
              </div>
            )}
          </div>
        )}

        {/* Legal */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Aspectos legales</h4>
            <button className="text-primary hover:text-primary-600">
              <PencilIcon className="w-4 h-4" />
            </button>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Consentimiento del arrendador</dt>
              <dd className="font-medium">{getConsentStatusLabel(data.landlordConsentStatus)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Transferencia de contrato</dt>
              <dd className="font-medium">{data.leaseTransferAllowed ? 'Sí' : 'No'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Acuerdo de subarriendo</dt>
              <dd className="font-medium">{data.subleaseAgreementRequired ? 'Requerido' : 'No requerido'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Términos aceptados</dt>
              <dd className="font-medium">
                {data.disclaimersAccepted ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">Lista de verificación</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircleIcon className={`w-5 h-5 ${data.title ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={data.title ? 'text-green-800' : 'text-gray-600'}>
              Título descriptivo
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircleIcon className={`w-5 h-5 ${imageCount >= 3 ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={imageCount >= 3 ? 'text-green-800' : 'text-gray-600'}>
              Al menos 3 fotos ({imageCount} agregadas)
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircleIcon className={`w-5 h-5 ${data.landlordConsentStatus ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={data.landlordConsentStatus ? 'text-green-800' : 'text-gray-600'}>
              Consentimiento del arrendador
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircleIcon className={`w-5 h-5 ${data.disclaimersAccepted ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={data.disclaimersAccepted ? 'text-green-800' : 'text-gray-600'}>
              Términos y condiciones aceptados
            </span>
          </div>
        </div>
      </div>

      {/* Final Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800">¡Todo listo para publicar!</p>
            <p className="text-sm text-green-700 mt-1">
              Tu anuncio será revisado brevemente y estará activo en minutos. 
              Recibirás una notificación cuando esté publicado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepReview;