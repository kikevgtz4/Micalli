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

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setUploading(true);
    
    try {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const newImage: ImageData = {
          id: `temp-${Date.now()}`, // Temporary ID for new images
          file: file,
          url: reader.result as string,
          isPrimary: !formData.images || formData.images.length === 0,
          order: formData.images?.length || 0,
          isExisting: false
        };
        
        onChange((prev: RoommateProfileFormData) => ({
          ...prev,
          images: [...(prev.images || []), newImage]
        }));
        
        toast.success('Photo added successfully');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (imageId: string) => {
    onChange((prev: RoommateProfileFormData) => {
      const imageToRemove = prev.images?.find(img => img.id === imageId);
      
      if (imageToRemove?.isExisting) {
        // Mark existing images as deleted instead of removing
        return {
          ...prev,
          images: prev.images?.map(img => 
            img.id === imageId ? { ...img, isDeleted: true } : img
          ),
          existingImageIds: prev.existingImageIds?.filter(id => id !== imageToRemove.serverId)
        };
      } else {
        // Remove new images completely
        return {
          ...prev,
          images: prev.images?.filter(img => img.id !== imageId)
        };
      }
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  // Filter out deleted images for display
  const visibleImages = formData.images?.filter(img => !img.isDeleted) || [];

  return (
    <div className="space-y-4 pt-4">
      <div>
        <p className="text-sm text-stone-600 mb-2">
          Add photos to help potential roommates get to know you better
        </p>
        <p className="text-xs text-stone-500">
          Your first photo will be your main profile picture. You can upload up to 6 photos.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {visibleImages.map((image, index) => (
          <div key={image.id} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden bg-stone-100">
              {image.url ? (
                <img
                  src={image.url}
                  alt={`Profile ${index + 1}`}
                  className="w-full h-full object-cover"
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
          </div>
        ))}
        
        {/* Upload button */}
        {visibleImages.length < 6 && (
          <label
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-stone-300 hover:border-primary-500 hover:bg-stone-50'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            ) : (
              <>
                <CameraIcon className="w-8 h-8 text-stone-400 mb-2" />
                <span className="text-sm text-stone-500">Add Photo</span>
                <span className="text-xs text-stone-400 mt-1">or drag & drop</span>
              </>
            )}
          </label>
        )}
      </div>
      
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Tips:</strong> Use clear, recent photos that show your face. 
          Avoid group photos as your primary image. Natural lighting works best!
        </p>
      </div>
    </div>
  );
}