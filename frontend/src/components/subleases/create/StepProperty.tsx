// frontend/src/components/subleases/create/StepProperty.tsx
import { FC } from 'react';
import AddressField from '@/components/property/AddressField';
import type { SubleaseFormData } from '@/types/sublease';
import { 
  HomeIcon, 
  BuildingOfficeIcon,
  HomeModernIcon,
  BuildingOffice2Icon,
  CubeIcon
} from '@heroicons/react/24/outline';

interface StepProps {
  data: SubleaseFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const StepProperty: FC<StepProps> = ({ data, onChange, errors }) => {
  const propertyTypes = [
    { value: 'apartment', label: 'Departamento', icon: BuildingOfficeIcon },
    { value: 'house', label: 'Casa', icon: HomeIcon },
    { value: 'studio', label: 'Estudio', icon: CubeIcon },
    { value: 'dorm', label: 'Dormitorio', icon: BuildingOffice2Icon },
    { value: 'condo', label: 'Condominio', icon: HomeModernIcon },
  ];

  const amenities = [
    'WiFi de alta velocidad',
    'Aire acondicionado',
    'Calefacción',
    'Lavadora',
    'Secadora',
    'Cocina equipada',
    'Microondas',
    'Refrigerador',
    'Televisión',
    'Escritorio',
    'Gimnasio',
    'Alberca',
    'Estacionamiento',
    'Seguridad 24/7',
    'Terraza',
    'Jardín',
    'Elevador',
    'Amueblado',
    'Closet amplio',
    'Balcón',
  ];

  const toggleAmenity = (amenity: string) => {
    const current = data.amenities || [];
    if (current.includes(amenity)) {
      onChange('amenities', current.filter(a => a !== amenity));
    } else {
      onChange('amenities', [...current, amenity]);
    }
  };

  // Handle address change and extract neighborhood/area
  const handleAddressChange = (value: string) => {
    onChange('address', value);
    
    // Extract neighborhood and area from address
    const parts = value.split(',').map(part => part.trim());
    
    if (parts.length >= 2) {
      onChange('displayNeighborhood', parts[1] || parts[0]);
      onChange('displayArea', parts.length > 2 ? parts[2] : parts[1]);
    }
  };

  const handleCoordinatesChange = (lat: string, lng: string) => {
    // Store coordinates as strings to match the type
    onChange('latitude', lat);
    onChange('longitude', lng);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Detalles de la propiedad</h2>
        <p className="text-gray-600">
          Describe las características del espacio
        </p>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de propiedad *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {propertyTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => onChange('propertyType', type.value)}
                className={`p-4 border-2 rounded-lg text-center hover:border-primary transition-all ${
                  data.propertyType === type.value
                    ? 'border-primary bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <Icon className={`w-8 h-8 mx-auto mb-2 ${
                  data.propertyType === type.value ? 'text-primary' : 'text-gray-400'
                }`} />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
        {errors.propertyType && (
          <p className="mt-2 text-xs text-red-600">{errors.propertyType}</p>
        )}
      </div>

      {/* Address Section with Mapbox Geocoding */}
      <div>
        <AddressField
          address={data.address}
          latitude={data.latitude || ''}
          longitude={data.longitude || ''}
          onAddressChange={handleAddressChange}
          onCoordinatesChange={handleCoordinatesChange}
          errors={errors}
          required
        />
        
        {/* Privacy Notice */}
        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          🔒 Tu dirección exacta nunca se muestra públicamente. Solo mostramos 
          la zona general y la dirección completa se comparte únicamente después 
          de confirmar el subarriendo.
        </div>
      </div>

      {/* Rooms and Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Habitaciones *
          </label>
          <select
            value={data.bedrooms || 1}
            onChange={(e) => onChange('bedrooms', parseInt(e.target.value))}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.bedrooms ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {[0, 1, 2, 3, 4, 5, 6].map(num => (
              <option key={num} value={num}>
                {num === 0 ? 'Estudio' : `${num} ${num === 1 ? 'habitación' : 'habitaciones'}`}
              </option>
            ))}
          </select>
          {errors.bedrooms && (
            <p className="mt-1 text-xs text-red-600">{errors.bedrooms}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Baños *
          </label>
          <select
            value={data.bathrooms || 1}
            onChange={(e) => onChange('bathrooms', parseFloat(e.target.value))}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.bathrooms ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value={1}>1 baño</option>
            <option value={1.5}>1.5 baños</option>
            <option value={2}>2 baños</option>
            <option value={2.5}>2.5 baños</option>
            <option value={3}>3 baños</option>
            <option value={3.5}>3.5 baños</option>
            <option value={4}>4+ baños</option>
          </select>
          {errors.bathrooms && (
            <p className="mt-1 text-xs text-red-600">{errors.bathrooms}</p>
          )}
        </div>
      </div>

      {/* Total Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Área total (m²) - Opcional
        </label>
        <input
          type="number"
          value={data.totalArea || ''}
          onChange={(e) => onChange('totalArea', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="Ej: 85"
          min="1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Furnished */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="furnished"
          checked={data.furnished}
          onChange={(e) => onChange('furnished', e.target.checked)}
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
        />
        <label htmlFor="furnished" className="text-gray-700">
          <span className="font-medium">Amueblado</span>
          <span className="text-sm text-gray-500 ml-2">
            El espacio cuenta con muebles básicos
          </span>
        </label>
      </div>

      {/* Pet & Smoking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="petFriendly"
            checked={data.petFriendly}
            onChange={(e) => onChange('petFriendly', e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="petFriendly" className="text-gray-700">
            <span className="font-medium">Se permiten mascotas</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="smokingAllowed"
            checked={data.smokingAllowed}
            onChange={(e) => onChange('smokingAllowed', e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="smokingAllowed" className="text-gray-700">
            <span className="font-medium">Se permite fumar</span>
          </label>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Amenidades incluidas
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {amenities.map((amenity) => (
            <label
              key={amenity}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={data.amenities?.includes(amenity) || false}
                onChange={() => toggleAmenity(amenity)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{amenity}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepProperty;