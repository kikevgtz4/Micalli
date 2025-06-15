// Updated ImagesStep.tsx with complete functionality

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
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { validateFile } from '@/utils/validation';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '@/utils/imageUrls';

interface ImageData {
  id: string;
  file?: File;
  url?: string;
  isPrimary: boolean;
  order: number;
  isExisting?: boolean;
  serverId?: number;
  isDeleted?: boolean;
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
    opacity: isDragging ? 0.5 : (image.isDeleted ? 0.3 : 1),
  };

  // Get the image URL properly
  const imageUrl = image.url || (image.file ? URL.createObjectURL(image.file) : '/placeholder-property.jpg');

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''} ${image.isDeleted ? 'opacity-50' : ''}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border-2 border-stone-200 group-hover:border-primary-300 transition-all">
        <Image
          src={getImageUrl(imageUrl)}
          alt={`Profile image ${image.order + 1}`}
          fill
          className="object-cover"
        />

        {/* Deleted overlay */}
        {image.isDeleted && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <XMarkIcon className="w-12 h-12 text-red-600" />
          </div>
        )}

        {/* Primary badge */}
        {image.isPrimary && !image.isDeleted && (
          <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <StarIconSolid className="w-3 h-3" />
            Primary
          </div>
        )}

        {/* Upload status for new images */}
        {!image.isExisting && !image.isDeleted && (
          <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
            <CloudArrowUpIcon className="w-3 h-3" />
            New
          </div>
        )}

        {/* Actions overlay */}
        {!image.isDeleted && (
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

            {/* Delete/Remove */}
            <button
              type="button"
              onClick={onDelete}
              className="p-2 bg-red-500/80 backdrop-blur-sm rounded-lg text-white hover:bg-red-600 transition-colors"
              title={image.isExisting ? "Remove image" : "Delete image"}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Order indicator */}
      {!image.isDeleted && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white border border-stone-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium shadow-sm">
          {image.order + 1}
        </div>
      )}
    </motion.div>
  );
}

export const ImagesStep = ({ data, onChange, errors }: StepProps) => {
  const [images, setImages] = useState<ImageData[]>(() => {
    // Initialize with existing images if available
    if (data.images && data.images.length > 0) {
      // Ensure all images have proper order
      return data.images.map((img, index) => ({
        ...img,
        order: img.order !== undefined ? img.order : index,
      }));
    }
    return [];
  });

  // Update parent form when images change
  useEffect(() => {
    // Filter out deleted images when sending to parent
    const activeImages = images.filter(img => !img.isDeleted);
    onChange('images', activeImages);
  }, [images, onChange]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Count non-deleted images
    const activeImageCount = images.filter(img => !img.isDeleted).length;
    
    // Validate total count
    if (activeImageCount + files.length > 7) {
      toast.error(`Maximum 7 images allowed. You currently have ${activeImageCount} images.`);
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
        isPrimary: activeImageCount === 0 && newImages.length === 0,
        order: activeImageCount + newImages.length,
        isExisting: false,
      };
      
      newImages.push(newImage);
    });

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      toast.success(`Added ${newImages.length} image${newImages.length > 1 ? 's' : ''}`);
    }

    // Reset input
    e.target.value = '';
  }, [images]);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order values
        return reorderedItems.map((item, index) => ({
          ...item,
          order: index,
        }));
      });
    }
  }, []);

  const handleSetPrimary = useCallback((imageId: string) => {
    setImages((items) =>
      items.map((item) => ({
        ...item,
        isPrimary: item.id === imageId,
      }))
    );
    toast.success('Primary image updated');
  }, []);

  const handleDelete = useCallback((imageId: string) => {
    const image = images.find(img => img.id === imageId);
    
    if (image?.isExisting) {
      // For existing images, mark as deleted
      setImages((items) =>
        items.map((item) =>
          item.id === imageId
            ? { ...item, isDeleted: true, isPrimary: false }
            : item
        )
      );
      toast('Image marked for removal', { icon: 'ℹ️' });
    } else {
      // For new images, remove completely
      setImages((items) => {
        const filtered = items.filter((item) => item.id !== imageId);
        
        // If we deleted the primary image, make the first one primary
        const hasPrimary = filtered.some(img => img.isPrimary && !img.isDeleted);
        if (!hasPrimary && filtered.length > 0) {
          const firstActive = filtered.find(img => !img.isDeleted);
          if (firstActive) {
            firstActive.isPrimary = true;
          }
        }
        
        // Reorder remaining images
        return filtered.map((item, index) => ({
          ...item,
          order: index,
        }));
      });
      
      // Clean up object URL
      if (image?.url && image.file) {
        URL.revokeObjectURL(image.url);
      }
      
      toast.success('Image removed');
    }
  }, [images]);

  // Count active (non-deleted) images
  const activeImages = images.filter(img => !img.isDeleted);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Add Photos</h2>
        <p className="text-stone-600">
          Upload up to 7 photos. Drag to reorder. Your primary photo will appear on your card.
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
              <li>• Maximum file size: 5MB per image</li>
              <li>• Accepted formats: JPEG, PNG, WebP</li>
              <li>• Images marked with <span className="font-semibold">New</span> will be uploaded when you save</li>
              <li>• Deleted images will be removed when you save</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Image Grid */}
      <div className="space-y-4">
        {activeImages.length > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-stone-600">
              {activeImages.length} of 7 images
            </p>
            <p className="text-xs text-stone-500">
              Drag images to reorder
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.filter(img => !img.isDeleted).map((img) => img.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence>
                {images.map((image) => (
                  !image.isDeleted && (
                    <SortableImage
                      key={image.id}
                      image={image}
                      onSetPrimary={() => handleSetPrimary(image.id)}
                      onDelete={() => handleDelete(image.id)}
                    />
                  )
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>

          {/* Add Image Button */}
          {activeImages.length < 7 && (
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
                <span className="text-xs mt-1">{7 - activeImages.length} remaining</span>
              </div>
            </motion.label>
          )}
        </div>
      </div>

      {/* Error Display */}
      {errors?.images && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
        >
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{errors.images}</p>
        </motion.div>
      )}
    </div>
  );
};