import Link from 'next/link';
import Image from 'next/image';

interface PropertyCardProps {
  id: number;
  title: string;
  address: string;
  price: number;
  rent_amount?: number; // Added for flexibility
  bedrooms: number;
  bathrooms: number;
  imageUrl?: string;
  isVerified?: boolean;
  universityDistance?: string;
}

export default function PropertyCard({
  id,
  title,
  address,
  price,
  rent_amount,
  bedrooms,
  bathrooms,
  imageUrl,
  isVerified,
  universityDistance,
}: PropertyCardProps) {
  // Format price helper function
  const getFormattedPrice = () => {
    // Try price first, then rent_amount as fallback
    const propertyPrice = price || rent_amount || 0;
    
    // Handle string values by converting to number
    const numericPrice = typeof propertyPrice === 'string' ? 
      parseFloat(propertyPrice) : propertyPrice;
    
    // Format with thousands separator and return 0 if invalid
    return isNaN(numericPrice) ? '0' : numericPrice.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/properties/${id}`}>
        <div className="relative h-48 w-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="bg-gray-200 h-full w-full flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
          {/* Price tag - Updated for better formatting */}
          <div className="absolute bottom-3 left-3 bg-indigo-600 text-white px-3 py-1 rounded-md font-medium">
            ${getFormattedPrice()}/month
          </div>
          {/* Verification badge */}
          {isVerified && (
            <div className="absolute top-3 right-3 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/properties/${id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600">{title}</h3>
        </Link>
        <p className="text-gray-500 text-sm mt-1">{address}</p>
        {universityDistance && (
          <div className="flex items-center mt-2 text-sm text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {universityDistance}
          </div>
        )}
        <div className="flex justify-between mt-4">
          <div className="flex items-center text-gray-600 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {bedrooms} {bedrooms === 1 ? 'bedroom' : 'bedrooms'}
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            {bathrooms} {bathrooms === 1 ? 'bathroom' : 'bathrooms'}
          </div>
        </div>
      </div>
    </div>
  );
}