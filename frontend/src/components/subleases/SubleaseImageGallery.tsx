// frontend/src/components/subleases/SubleaseImageGallery.tsx
import { useState, useRef, useEffect } from 'react';
import PropertyImage from '@/components/common/PropertyImage';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SubleaseImageGalleryProps {
  images?: any[];
  mainImage?: any;
  title: string;
}

export default function SubleaseImageGallery({ 
  images, 
  mainImage,
  title
}: SubleaseImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Process images correctly
  const processedImages = (() => {
    let allImages: any[] = [];
    
    // Handle mainImage if present
    if (mainImage) {
      allImages.push(mainImage);
    }
    
    // Handle images array if present
    if (images && images.length > 0) {
      // Filter out mainImage if it's already included
      const additionalImages = mainImage 
        ? images.filter(img => img.id !== mainImage.id)
        : images;
      allImages = [...allImages, ...additionalImages];
    }
    
    return allImages;
  })();

  // Helper to get the correct image URL
  const getImageUrl = (image: any): string => {
    if (!image) return '';
    
    // If it's a string, return as is
    if (typeof image === 'string') return image;
    
    // Try different possible properties - prioritize full resolution
    return image.image || image.cardDisplayUrl || image.url || image.src || '';
  };

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        const maxScroll = 200;
        const translateY = Math.min(scrolled * 0.5, maxScroll);
        heroRef.current.style.transform = `translateY(${translateY}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? Math.max(0, processedImages.length - 1) : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === processedImages.length - 1 ? 0 : prev + 1
    );
  };

  // Keyboard navigation for modal
  useEffect(() => {
    if (isImageGalleryOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') handlePreviousImage();
        if (e.key === 'ArrowRight') handleNextImage();
        if (e.key === 'Escape') setIsImageGalleryOpen(false);
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isImageGalleryOpen, currentImageIndex, processedImages.length]);

  const hasImages = processedImages.length > 0;
  const currentImage = hasImages ? processedImages[currentImageIndex] : null;
  const currentImageUrl = currentImage ? getImageUrl(currentImage) : '';

  return (
    <>
      {/* Hero Image Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="relative h-[450px] sm:h-[500px] lg:h-[550px] overflow-hidden rounded-2xl shadow-2xl">
            <div ref={heroRef} className="absolute inset-0">
              {hasImages && currentImageUrl ? (
                <PropertyImage
                  image={currentImageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  priority
                  onLoad={() => {
                    console.log('Image loaded successfully:', currentImageUrl);
                  }}
                />
              ) : (
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-full w-full flex flex-col items-center justify-center">
                  <CameraIcon className="h-24 w-24 text-gray-400" />
                  <p className="mt-2 text-gray-500">No photo available</p>
                </div>
              )}
            </div>

            {/* Dark overlay for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>

            {/* Image Gallery Controls */}
            {hasImages && processedImages.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 group"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-700 group-hover:text-gray-900" />
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 group"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-700 group-hover:text-gray-900" />
                </button>

                {/* Image indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {processedImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "bg-white w-7"
                          : "bg-white/60 w-2 hover:bg-white/80"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* View All Photos Button */}
            {hasImages && processedImages.length > 1 && (
              <button
                onClick={() => setIsImageGalleryOpen(true)}
                className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all hover:scale-105 flex items-center gap-2 group"
              >
                <CameraIcon className="h-4 w-4 text-gray-700 group-hover:text-gray-900" />
                <span className="font-medium text-gray-700 group-hover:text-gray-900 text-sm">
                  Ver todas ({processedImages.length})
                </span>
              </button>
            )}

            {/* Image Counter */}
            {hasImages && processedImages.length > 1 && (
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                {currentImageIndex + 1} / {processedImages.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Image Gallery Modal */}
      {isImageGalleryOpen && hasImages && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={() => setIsImageGalleryOpen(false)}
            className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all z-10"
            aria-label="Close gallery"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Previous Button */}
          {processedImages.length > 1 && (
            <button
              onClick={handlePreviousImage}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          )}

          {/* Next Button */}
          {processedImages.length > 1 && (
            <button
              onClick={handleNextImage}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
              aria-label="Next image"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          )}

          {/* Main Image */}
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-auto px-4">
            {currentImageUrl ? (
              <PropertyImage
                image={currentImageUrl}
                alt={`${title} - ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <CameraIcon className="h-24 w-24 text-gray-400" />
                <p className="mt-2 text-gray-400">No image available</p>
              </div>
            )}
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
            {currentImageIndex + 1} / {processedImages.length}
          </div>

          {/* Thumbnail Strip */}
          {processedImages.length > 1 && (
            <div className="absolute bottom-20 left-0 right-0 px-4">
              <div className="flex justify-center">
                <div className="flex gap-2 max-w-4xl overflow-x-auto scrollbar-hide py-2">
                  {processedImages.map((image, index) => {
                    const thumbUrl = image.thumbnailUrl || getImageUrl(image);
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative flex-shrink-0 transition-all duration-300 ${
                          index === currentImageIndex 
                            ? 'ring-2 ring-white scale-105' 
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-gray-800">
                          {thumbUrl ? (
                            <PropertyImage
                              image={thumbUrl}
                              alt={`Thumbnail ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-700" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}