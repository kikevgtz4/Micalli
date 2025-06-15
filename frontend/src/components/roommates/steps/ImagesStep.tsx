// frontend/src/components/roommates/steps/ImagesStep.tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { StepProps, ImageData } from '@/types/roommates';
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
      <div className="aspect-square rounded-lg overflow-hidden bg-stone-100 border-2 border-stone-200">
        <Image
          src={imageUrl}
          alt={`Photo ${image.order + 1}`}
          width={200}
          height={200}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-property.jpg';
          }}
        />
        
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 cursor-move opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity flex items-center justify-center"
        >
          <ArrowsUpDownIcon className="w-8 h-8 text-white" />
        </div>

        {/* Primary badge */}
        {image.isPrimary && !image.isDeleted && (
          <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
            <StarIconSolid className="w-3 h-3" />
            Primary
          </div>
        )}

        {/* Actions */}
        {!image.isDeleted && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!image.isPrimary && (
              <button
                type="button"
                onClick={onSetPrimary}
                className="p-1.5 bg-white rounded-md shadow-sm hover:bg-stone-50 transition-colors"
                title="Set as primary"
              >
                <StarIcon className="w-4 h-4 text-stone-600" />
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 bg-white rounded-md shadow-sm hover:bg-red-50 transition-colors"
              title={image.isExisting ? "Remove image" : "Delete image"}
            >
              <XMarkIcon className="w-4 h-4 text-red-600" />
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
  // Use a ref to track if we've initialized from parent data
  const hasInitialized = useRef(false);
  
  const [images, setImages] = useState<ImageData[]>([]);

  // Initialize images from parent data only once
  useEffect(() => {
    if (!hasInitialized.current && data.images && data.images.length > 0) {
      setImages(data.images.map((img, index) => ({
        ...img,
        order: img.order !== undefined ? img.order : index,
      })));
      hasInitialized.current = true;
    }
  }, [data.images]);

  // Use a ref to track the previous images state to avoid unnecessary updates
  const prevImagesRef = useRef<ImageData[] | undefined>(undefined);

  // Update parent only when images actually change
  useEffect(() => {
    const activeImages = images.filter(img => !img.isDeleted);
    
    // Check if images actually changed
    const prevImages = prevImagesRef.current;
    const hasChanged = !prevImages || 
      prevImages.length !== activeImages.length ||
      activeImages.some((img, idx) => {
        const prev = prevImages[idx];
        return !prev || 
          img.id !== prev.id || 
          img.isPrimary !== prev.isPrimary || 
          img.order !== prev.order;
      });

    if (hasChanged) {
      prevImagesRef.current = activeImages;
      onChange('images', activeImages);
    }
  }, [images]); // Remove onChange from dependencies

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
      setImages(prev => [...prev, ...newImages]);
      toast.success(`Added ${newImages.length} image${newImages.length > 1 ? 's' : ''}`);
    }

    // Reset the input
    e.target.value = '';
  }, [images]);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order values
        return newItems.map((item, index) => ({
          ...item,
          order: index,
        }));
      });
    }
  }, []);

  const handleSetPrimary = useCallback((imageId: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img.id === imageId,
    })));
    toast.success('Primary image updated');
  }, []);

  const handleDelete = useCallback((imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    if (image.isExisting) {
      // Mark existing images for deletion
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, isDeleted: true } : img
      ));
      toast.success('Image marked for removal');
    } else {
      // Remove new uploads completely and clean up URL
      if (image.url && image.file) {
        URL.revokeObjectURL(image.url);
      }
      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image removed');
    }

    // If this was the primary image, set another as primary
    if (image.isPrimary) {
      setImages(prev => {
        const activeImages = prev.filter(img => !img.isDeleted && img.id !== imageId);
        if (activeImages.length > 0) {
          return prev.map((img, idx) => ({
            ...img,
            isPrimary: idx === 0 && !img.isDeleted,
          }));
        }
        return prev;
      });
    }
  }, [images]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(image => {
        if (image.url && image.file) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, []);

  const activeImages = images.filter(img => !img.isDeleted);
  const sortedImages = [...activeImages].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-stone-900 mb-2">Add Photos</h3>
        <p className="text-stone-600">
          Upload up to 7 photos to showcase your personality and living space
        </p>
      </div>

      {errors.images && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-sm text-red-700">{errors.images}</p>
        </div>
      )}

      {/* Upload area */}
      {activeImages.length < 7 && (
        <label className="block">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="border-2 border-dashed border-stone-300 rounded-lg p-12 text-center hover:border-primary-400 transition-colors cursor-pointer bg-stone-50 hover:bg-primary-50/20">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-stone-400 mb-4" />
            <p className="text-sm font-medium text-stone-900 mb-1">
              Click to upload photos
            </p>
            <p className="text-xs text-stone-500">
              JPEG, PNG or WebP (max 5MB each)
            </p>
            <p className="text-xs text-stone-500 mt-2">
              {activeImages.length}/7 photos uploaded
            </p>
          </div>
        </label>
      )}

      {/* Images grid */}
      {sortedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-stone-700">Your Photos</h4>
            <p className="text-xs text-stone-500">Drag to reorder</p>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedImages.map(img => img.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {sortedImages.map((image) => (
                    <SortableImage
                      key={image.id}
                      image={image}
                      onSetPrimary={() => handleSetPrimary(image.id)}
                      onDelete={() => handleDelete(image.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Tips */}
      <div className="bg-primary-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-primary-900 mb-2">Photo Tips</h4>
        <ul className="text-xs text-primary-700 space-y-1">
          <li>• Include a clear photo of yourself</li>
          <li>• Show your living space or room setup</li>
          <li>• Add photos that reflect your interests and hobbies</li>
          <li>• Your first photo will be your primary image</li>
        </ul>
      </div>
    </div>
  );
};