// frontend/src/components/roommates/steps/ImagesStep.tsx
import { useState, useCallback, useEffect } from 'react';
import { StepProps } from '@/types/roommates';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  PhotoIcon,
  XMarkIcon,
  StarIcon,
  ArrowsUpDownIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { validateFile } from '@/utils/validation';
import { toast } from 'react-hot-toast';

interface ImageData {
  id: string; // Temporary ID for new uploads
  file?: File;
  url?: string;
  isPrimary: boolean;
  order: number;
  isExisting?: boolean;
}

function SortableImage({
  image,
  onSetPrimary,
  onDelete,
}: {
  image: ImageData;
  onSetPrimary: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border-2 border-stone-200 group-hover:border-primary-300 transition-all">
        {image.url ? (
          <Image
            src={image.url}
            alt={`Profile image ${image.order + 1}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="w-12 h-12 text-stone-400" />
          </div>
        )}

        {/* Primary badge */}
        {image.isPrimary && (
          <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <StarIconSolid className="w-3 h-3" />
            Primary
          </div>
        )}

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {/* Drag handle */}
          <button
            type="button"
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors cursor-move"
            {...attributes}
            {...listeners}
          >
            <ArrowsUpDownIcon className="w-5 h-5" />
          </button>

          {/* Set primary */}
          {!image.isPrimary && (
            <button
              type="button"
              onClick={onSetPrimary}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
            >
              <StarIcon className="w-5 h-5" />
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={onDelete}
            className="p-2 bg-red-500/80 backdrop-blur-sm rounded-lg text-white hover:bg-red-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Order indicator */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white border border-stone-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium shadow-sm">
        {image.order + 1}
      </div>
    </motion.div>
  );
}

export const ImagesStep = ({ data, onChange, errors }: StepProps) => {
  const [images, setImages] = useState<ImageData[]>(() => {
    // Initialize with existing images if available
    return data.images || [];
  });

  // Update parent form when images change
  useEffect(() => {
    onChange('images', images);
  }, [images, onChange]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate total count
    if (images.length + files.length > 7) {
      toast.error('Maximum 7 images allowed');
      return;
    }

    const newImages: ImageData[] = [];
    
    files.forEach((file) => {
      // Validate file
      const validation = validateFile(file, 5, ['image/jpeg', 'image/png', 'image/webp']);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      const newImage: ImageData = {
        id: `new-${Date.now()}-${Math.random()}`,
        file,
        url,
        isPrimary: images.length === 0 && newImages.length === 0,
        order: images.length + newImages.length,
      };
      
      newImages.push(newImage);
    });

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onChange('images', updatedImages);
    }

    // Reset input
    e.target.value = '';
  }, [images, onChange]);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      const reorderedImages = arrayMove(images, oldIndex, newIndex).map(
        (img, index) => ({ ...img, order: index })
      );

      setImages(reorderedImages);
      onChange('images', reorderedImages);
    }
  }, [images, onChange]);

  const handleSetPrimary = useCallback((imageId: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === imageId,
    }));
    setImages(updatedImages);
    onChange('images', updatedImages);
  }, [images, onChange]);

  const handleDelete = useCallback((imageId: string) => {
    const imageToDelete = images.find((img) => img.id === imageId);
    if (imageToDelete?.url && !imageToDelete.isExisting) {
      URL.revokeObjectURL(imageToDelete.url);
    }

    const filteredImages = images.filter((img) => img.id !== imageId);
    const reorderedImages = filteredImages.map((img, index) => ({
      ...img,
      order: index,
      isPrimary: filteredImages.length === 1 || (img.isPrimary && img.id !== imageId),
    }));

    // If we deleted the primary image and have other images, make the first one primary
    if (imageToDelete?.isPrimary && reorderedImages.length > 0 && !reorderedImages.some(img => img.isPrimary)) {
      reorderedImages[0].isPrimary = true;
    }

    setImages(reorderedImages);
    onChange('images', reorderedImages);
  }, [images, onChange]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-stone-900 mb-2">
          Profile Photos
        </h3>
        <p className="text-stone-600">
          Add up to 7 photos to showcase your personality. Your primary photo will appear on your card.
        </p>
      </motion.div>

      {/* Upload Guidelines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <PhotoIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-2">Photo Guidelines:</p>
            <ul className="space-y-1">
              <li>• Use clear, recent photos of yourself</li>
              <li>• Recommended size: 800x800px (square format works best)</li>
              <li>• Maximum file size: 5MB per image</li>
              <li>• Accepted formats: JPEG, PNG, WebP</li>
              <li>• Avoid group photos as your primary image</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Image Grid */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence>
                {images.map((image) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    onSetPrimary={() => handleSetPrimary(image.id)}
                    onDelete={() => handleDelete(image.id)}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>

          {/* Add Image Button */}
          {images.length < 7 && (
            <motion.label
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-xl border-2 border-dashed border-stone-300 hover:border-primary-400 bg-stone-50 hover:bg-primary-50 transition-all cursor-pointer group"
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 group-hover:text-primary-600">
                <PlusIcon className="w-12 h-12 mb-2" />
                <span className="text-sm font-medium">Add Photo</span>
                <span className="text-xs mt-1">{7 - images.length} remaining</span>
              </div>
            </motion.label>
          )}
        </div>

        {/* Error message */}
        {errors.images && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {errors.images}
          </p>
        )}
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6"
      >
        <div className="flex items-start gap-3">
          <StarIcon className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-stone-900 mb-2">
              Photo Tips for Better Matches
            </h4>
            <ul className="text-stone-600 text-sm space-y-1">
              <li>• Show your genuine personality and interests</li>
              <li>• Include photos of your hobbies or activities</li>
              <li>• A smiling photo as primary gets 2x more interest</li>
              <li>• Variety is key: casual, formal, activities, etc.</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};