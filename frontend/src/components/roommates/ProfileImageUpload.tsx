// frontend/src/components/roommates/ProfileImageUpload.tsx
import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CameraIcon,
  XMarkIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { ImageData } from '@/types/roommates';
import { getImageUrl } from '@/utils/imageUrls';

interface ProfileImageUploadProps {
  images: ImageData[];
  onChange: (images: ImageData[]) => void;
  maxImages?: number;
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ProfileImageUpload({
  images,
  onChange,
  maxImages = 6,
  className = '',
}: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages: ImageData[] = [];
    const currentImageCount = images.filter(img => !img.isDeleted).length;
    const remainingSlots = maxImages - currentImageCount;

    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      // Validate file
      if (!ACCEPTED_FORMATS.includes(file.type)) {
        toast.error(`${file.name} is not a supported format`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      const tempId = `new-${Date.now()}-${Math.random()}`;

      newImages.push({
        id: tempId,
        file,
        url,
        isPrimary: currentImageCount === 0 && newImages.length === 0,
        order: currentImageCount + newImages.length,
        isExisting: false,
      });

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const current = prev[tempId] || 0;
          if (current >= 100) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, [tempId]: Math.min(current + 20, 100) };
        });
      }, 200);
    });

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
      toast.success(`${newImages.length} image(s) added`);
    }
  }, [images, maxImages, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemoveImage = useCallback((imageId: string) => {
    const updatedImages = images.map((img) => {
      if (img.id === imageId) {
        // Clean up preview URL for new images
        if (!img.isExisting && img.url) {
          URL.revokeObjectURL(img.url);
        }
        return { ...img, isDeleted: true };
      }
      return img;
    });

    // Check if removed image was primary
    const removedImage = images.find(img => img.id === imageId);
    if (removedImage?.isPrimary) {
      // Set next available image as primary
      const nextImage = updatedImages.find(img => !img.isDeleted && img.id !== imageId);
      if (nextImage) {
        nextImage.isPrimary = true;
      }
    }

    onChange(updatedImages);
    toast.success('Image removed');
  }, [images, onChange]);

  const handleSetPrimary = useCallback((imageId: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === imageId,
    }));
    onChange(updatedImages);
    toast.success('Primary image updated');
  }, [images, onChange]);

  const handleReorder = useCallback((dragIndex: number, dropIndex: number) => {
    const activeImages = images.filter(img => !img.isDeleted);
    const draggedImage = activeImages[dragIndex];
    
    if (!draggedImage) return;

    const reorderedImages = [...activeImages];
    reorderedImages.splice(dragIndex, 1);
    reorderedImages.splice(dropIndex, 0, draggedImage);

    // Update order values
    const updatedImages = images.map((img) => {
      const newIndex = reorderedImages.findIndex(reordered => reordered.id === img.id);
      if (newIndex !== -1) {
        return { ...img, order: newIndex };
      }
      return img;
    });

    onChange(updatedImages);
  }, [images, onChange]);

  const activeImages = images.filter(img => !img.isDeleted);
  const canAddMore = activeImages.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {activeImages.map((image, index) => (
            <motion.div
              key={image.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="relative group aspect-square"
              draggable
              onDragEnd={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const dropIndex = Math.floor((e.clientX - rect.left) / rect.width) + 
                                 Math.floor((e.clientY - rect.top) / rect.height) * 3;
                handleReorder(index, Math.max(0, Math.min(dropIndex, activeImages.length - 1)));
              }}
            >
              {/* Upload Progress Overlay */}
              {uploadProgress[image.id] !== undefined && uploadProgress[image.id] < 100 && (
                <div className="absolute inset-0 bg-black/50 rounded-xl z-20 flex items-center justify-center">
                  <div className="w-16 h-16 relative">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="white"
                        strokeWidth="4"
                        fill="none"
                        opacity="0.3"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="white"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - uploadProgress[image.id] / 100)}`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                      {uploadProgress[image.id]}%
                    </span>
                  </div>
                </div>
              )}

              {/* Image */}
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-stone-100">
                <Image
                  src={image.url || getImageUrl(image.serverId?.toString() || '')}
                  alt={`Profile ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                    <StarSolidIcon className="w-3 h-3" />
                    Primary
                  </div>
                )}

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!image.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(image.id)}
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                      title="Set as primary"
                    >
                      <StarIcon className="w-4 h-4 text-stone-700" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveImage(image.id)}
                    className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Remove image"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Order Number */}
                <div className="absolute bottom-2 left-2 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-medium text-stone-700">
                  {index + 1}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add Image Button */}
          {canAddMore && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square"
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`w-full h-full rounded-xl border-2 border-dashed transition-all ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-stone-300 hover:border-primary-400 hover:bg-stone-50'
                } flex flex-col items-center justify-center gap-2 group`}
              >
                <div className={`p-3 rounded-full transition-colors ${
                  isDragging ? 'bg-primary-100' : 'bg-stone-100 group-hover:bg-primary-100'
                }`}>
                  <PlusIcon className={`w-6 h-6 transition-colors ${
                    isDragging ? 'text-primary-600' : 'text-stone-600 group-hover:text-primary-600'
                  }`} />
                </div>
                <span className="text-sm font-medium text-stone-600">
                  {isDragging ? 'Drop image here' : 'Add photo'}
                </span>
                <span className="text-xs text-stone-500">
                  {activeImages.length}/{maxImages}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tips */}
      <div className="bg-primary-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <SparklesIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium text-primary-900">Photo tips for better matches:</p>
            <ul className="text-primary-700 space-y-0.5">
              <li>• Use recent photos that clearly show your face</li>
              <li>• Include photos of your hobbies and interests</li>
              <li>• Authentic photos get 3x more matches than filters</li>
              <li>• Drag photos to reorder them</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FORMATS.join(',')}
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}