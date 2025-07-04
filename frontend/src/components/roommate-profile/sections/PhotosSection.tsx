// frontend/src/components/roommate-profile/sections/PhotosSection.tsx
import { useState } from 'react';
import { CameraIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { RoommateProfileFormData, ImageData } from "@/types/roommates";
import toast from 'react-hot-toast';

interface PhotosSectionProps {
  formData: RoommateProfileFormData;
  onChange: (updater: (prev: RoommateProfileFormData) => RoommateProfileFormData) => void;
}

export default function PhotosSection({ formData, onChange }: PhotosSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  
  // Constants
  const MAX_IMAGES = 6;
  
  // Filter out deleted images for display
  const visibleImages = formData.images?.filter(img => !img.isDeleted) || [];
  const currentImageCount = visibleImages.length;
  const canAddMore = currentImageCount < MAX_IMAGES;
  const remainingSlots = MAX_IMAGES - currentImageCount;

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Check how many images can be added
    if (!canAddMore) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    
    // Limit files to available slots
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} image(s) can be added. Selected ${files.length} files.`);
    }
    
    setUploading(true);
    const newImages: ImageData[] = [];
    const errors: string[] = [];
    
    try {
      // Process all selected files
      await Promise.all(
        filesToProcess.map((file, index) => {
          return new Promise<void>((resolve, reject) => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
              errors.push(`${file.name} is not an image file`);
              resolve();
              return;
            }
            
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
              errors.push(`${file.name} exceeds 5MB limit`);
              resolve();
              return;
            }
            
            const reader = new FileReader();
            
            reader.onloadend = () => {
              const newImage: ImageData = {
                id: `temp-${Date.now()}-${index}`, // Unique ID for each image
                file: file,
                url: reader.result as string,
                isPrimary: currentImageCount === 0 && index === 0, // First image is primary only if no existing images
                order: currentImageCount + index,
                isExisting: false
              };
              
              newImages.push(newImage);
              resolve();
            };
            
            reader.onerror = () => {
              errors.push(`Failed to read ${file.name}`);
              resolve();
            };
            
            reader.readAsDataURL(file);
          });
        })
      );
      
      // Update state with all new images at once
      if (newImages.length > 0) {
        onChange((prev: RoommateProfileFormData) => ({
          ...prev,
          images: [...(prev.images || []), ...newImages]
        }));
        
        if (newImages.length === 1) {
          toast.success('Photo added successfully');
        } else {
          toast.success(`${newImages.length} photos added successfully`);
        }
      }
      
      // Show any errors that occurred
      if (errors.length > 0) {
        errors.forEach(error => toast.error(error));
      }
      
    } catch (error) {
      toast.error('Failed to upload images');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (imageId: string) => {
    const imageToRemove = formData.images?.find(img => img.id === imageId);
    const wasPrimary = imageToRemove?.isPrimary;
    
    onChange((prev: RoommateProfileFormData) => {
      let updatedImages;
      
      if (imageToRemove?.isExisting) {
        // Mark existing images as deleted instead of removing
        updatedImages = prev.images?.map(img => 
          img.id === imageId ? { ...img, isDeleted: true } : img
        ) || [];
      } else {
        // Remove new images completely
        updatedImages = prev.images?.filter(img => img.id !== imageId) || [];
      }
      
      // If removed image was primary, set the first visible image as primary
      if (wasPrimary) {
        const firstVisibleImage = updatedImages.find(img => !img.isDeleted);
        if (firstVisibleImage) {
          updatedImages = updatedImages.map(img => ({
            ...img,
            isPrimary: img.id === firstVisibleImage.id
          }));
        }
      }
      
      return {
        ...prev,
        images: updatedImages,
        existingImageIds: imageToRemove?.isExisting && imageToRemove.serverId 
          ? prev.existingImageIds?.filter(id => id !== imageToRemove.serverId)
          : prev.existingImageIds
      };
    });
    
    toast.success('Photo removed');
  };

  const setPrimaryImage = (imageId: string) => {
    onChange((prev: RoommateProfileFormData) => ({
      ...prev,
      images: prev.images?.map(img => ({
        ...img,
        isPrimary: img.id === imageId
      }))
    }));
    toast.success('Primary photo updated');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  // Image reordering handlers
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Add a visual effect to the dragged element
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleImageDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedImageIndex(null);
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) return;
    
    onChange((prev: RoommateProfileFormData) => {
      const newImages = [...(prev.images || [])];
      const [draggedImage] = newImages.splice(draggedImageIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);
      
      // Update order values
      return {
        ...prev,
        images: newImages.map((img, index) => ({
          ...img,
          order: index
        }))
      };
    });
    
    toast.success('Photos reordered');
  };

  return (
    <div className="space-y-4 pt-4">
      <div>
        <p className="text-sm text-stone-600 mb-2">
          Add photos to help potential roommates get to know you better
        </p>
        <p className="text-xs text-stone-500">
          Your first photo will be your main profile picture. You can upload up to {MAX_IMAGES} photos.
          Drag photos to reorder them.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {visibleImages.map((image, index) => (
          <div 
            key={image.id} 
            className="relative group"
            draggable
            onDragStart={(e) => handleImageDragStart(e, index)}
            onDragEnd={handleImageDragEnd}
            onDragOver={handleImageDragOver}
            onDrop={(e) => handleImageDrop(e, index)}
          >
            <div className={`aspect-square rounded-lg overflow-hidden bg-stone-100 cursor-move ${
              draggedImageIndex === index ? 'opacity-50' : ''
            }`}>
              {image.url ? (
                <img
                  src={image.url}
                  alt={`Profile ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false} // Prevent image from being dragged separately
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CameraIcon className="w-8 h-8 text-stone-400" />
                </div>
              )}
            </div>
            
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              {!image.isPrimary && (
                <button
                  type="button"
                  onClick={() => setPrimaryImage(image.id)}
                  className="p-2 bg-white rounded-full hover:bg-stone-100 transition-colors"
                  title="Set as primary"
                >
                  <StarIcon className="w-4 h-4 text-stone-700" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Remove photo"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* Primary badge */}
            {image.isPrimary && (
              <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                <StarIconSolid className="w-3 h-3" />
                <span className="text-xs font-medium">Primary</span>
              </div>
            )}
            
            {/* Order indicator (optional - remove if too cluttered) */}
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
              {index + 1}
            </div>
          </div>
        ))}
        
        {/* Upload button */}
        {canAddMore && (
          <label
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative ${
              dragActive 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-stone-300 hover:border-primary-500 hover:bg-stone-50'
            }`}
          >
            {/* Remaining count indicator */}
            <div className="absolute top-2 right-2 text-xs text-stone-500 bg-white px-2 py-1 rounded-full shadow-sm border border-stone-200">
              {currentImageCount}/{MAX_IMAGES}
            </div>
            
            <input
              type="file"
              accept="image/*"
              multiple // ADD THIS to allow multiple selection
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <>
                <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mb-2" />
                <span className="text-xs text-stone-500">Uploading...</span>
              </>
            ) : (
              <>
                <CameraIcon className="w-8 h-8 text-stone-400 mb-2" />
                <span className="text-sm text-stone-500">Add Photos</span>
                <span className="text-xs text-stone-400 mt-1">or drag & drop</span>
                <span className="text-xs text-stone-400 mt-0.5">Select up to {remainingSlots} image{remainingSlots !== 1 ? 's' : ''}</span>
              </>
            )}
          </label>
        )}
        
        {/* Show message when max images reached */}
        {!canAddMore && (
          <div className="aspect-square rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center">
            <div className="text-center px-4">
              <CameraIcon className="w-8 h-8 text-stone-300 mb-2 mx-auto" />
              <span className="text-xs text-stone-500">Maximum photos reached</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced tips section */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Tips:</strong> Use clear, recent photos that show your face. 
          Avoid group photos as your primary image. Natural lighting works best!
          You can upload multiple photos at once.
        </p>
        {currentImageCount === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            <strong>Note:</strong> Adding photos significantly improves your match rate! 
            Profiles with photos get 3x more matches.
          </p>
        )}
      </div>
    </div>
  );
}