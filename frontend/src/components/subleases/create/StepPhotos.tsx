// frontend/src/components/subleases/create/StepPhotos.tsx
import { FC, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import PropertyImage from '@/components/common/PropertyImage';
import type { SubleaseFormData } from '@/types/sublease';
import { 
  PhotoIcon, 
  XMarkIcon, 
  ArrowUpTrayIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { MIN_SUBLEASE_IMAGES, MAX_SUBLEASE_IMAGES } from '@/types/sublease';

interface StepProps {
  data: SubleaseFormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const StepPhotos: FC<StepProps> = ({ data, onChange, errors }) => {
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const currentImages = data.images || [];
    const totalImages = currentImages.length + acceptedFiles.length;
    
    if (totalImages > MAX_SUBLEASE_IMAGES) {
      alert(`Máximo ${MAX_SUBLEASE_IMAGES} imágenes permitidas`);
      return;
    }

    const newImages = [...currentImages, ...acceptedFiles];
    onChange('images', newImages);

    // Create previews
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [data.images, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: MAX_SUBLEASE_IMAGES,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeImage = (index: number) => {
    const newImages = [...(data.images || [])];
    newImages.splice(index, 1);
    onChange('images', newImages);

    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...(data.images || [])];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onChange('images', newImages);

    const newPreviews = [...previews];
    const [movedPreview] = newPreviews.splice(fromIndex, 1);
    newPreviews.splice(toIndex, 0, movedPreview);
    setPreviews(newPreviews);
  };

  const imageCount = data.images?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Fotos del espacio</h2>
        <p className="text-gray-600">
          Agrega entre {MIN_SUBLEASE_IMAGES} y {MAX_SUBLEASE_IMAGES} fotos de buena calidad.
          La primera será la foto principal.
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-primary bg-primary-50' : 'border-gray-300 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          {isDragActive ? 'Suelta las imágenes aquí' : 'Arrastra imágenes o haz clic para seleccionar'}
        </p>
        <p className="text-sm text-gray-500">
          JPG, PNG o WebP • Máximo 10MB por imagen
        </p>
      </div>

      {/* Image Count Indicator */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <PhotoIcon className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">
            {imageCount} de {MIN_SUBLEASE_IMAGES}-{MAX_SUBLEASE_IMAGES} fotos
          </span>
        </div>
        {imageCount < MIN_SUBLEASE_IMAGES && (
          <div className="flex items-center gap-2 text-yellow-600">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="text-sm">Faltan {MIN_SUBLEASE_IMAGES - imageCount} fotos</span>
          </div>
        )}
      </div>

      {/* Image Preview Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 group"
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}

              {/* Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index > 0 && (
                  <button
                    onClick={() => moveImage(index, 0)}
                    className="bg-white text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-100"
                  >
                    Hacer principal
                  </button>
                )}
                <button
                  onClick={() => removeImage(index)}
                  className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Order Number */}
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {errors.images && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span>{errors.images}</span>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Tips para mejores fotos:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Toma fotos con buena iluminación natural</li>
          <li>• Muestra todos los espacios importantes</li>
          <li>• Asegúrate de que estén limpios y ordenados</li>
          <li>• Incluye fotos de las amenidades compartidas</li>
        </ul>
      </div>
    </div>
  );
};

export default StepPhotos;