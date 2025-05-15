'use client';
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Image from 'next/image';
import Link from 'next/link';
import apiService from '@/lib/api';
import { useParams } from 'next/navigation';

// Mock data for fallback if API fails
const mockProperties = [
  {
    id: 1,
    title: 'Modern Apartment near Tec de Monterrey',
    address: 'Av. Eugenio Garza Sada 2501, Tecnológico, Monterrey',
    description: 'This beautiful modern apartment is located just steps away from Tecnológico de Monterrey. It features 2 spacious bedrooms, a fully equipped kitchen, and a comfortable living area. Perfect for students looking for a convenient and comfortable place to live during their studies.',
    price: 8500,
    bedrooms: 2,
    bathrooms: 1,
    area: 75,
    isVerified: true,
    isFurnished: true,
    amenities: ['WiFi', 'Kitchen', 'Washing Machine', 'Air Conditioning', 'Security System'],
    nearbyUniversities: [
      { id: 1, name: 'Tecnológico de Monterrey', distance: 800, walkingTime: 10 }
    ],
    ownerName: 'Carlos Rodríguez',
    ownerPhone: '+52 123 456 7890',
    images: ['/placeholder-property.jpg'],
    availableFrom: '2025-06-01',
    minimumStay: 6,
  },
];

interface University {
  id: number;
  name: string;
  distance: number;
  walkingTime: number;
}

interface PropertyDetail {
  id: number;
  title: string;
  address: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  isVerified?: boolean;
  is_verified?: boolean;
  isFurnished?: boolean;
  furnished?: boolean;
  amenities: string[];
  nearbyUniversities?: University[];
  university_proximities?: any[];
  ownerName?: string;
  owner_name?: string;
  ownerPhone?: string;
  owner_phone?: string;
  owner?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    phone?: string;
  };
  images: string[];
  property_images?: any[];
  availableFrom?: string;
  available_from?: string;
  minimumStay?: number;
  minimum_stay?: number;
  maximumStay?: number;
  maximum_stay?: number;
}

export default function PropertyDetailPage() {
  // Use the useParams hook instead of accessing params directly
  const params = useParams();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getProperty(parseInt(propertyId));
        
        if (!isMounted) return; // Prevent state updates if component unmounted
        
        console.log('Property API Response:', response.data);
        // Process the API data with safety checks
        const propertyData = response.data || {};
          
          const processedProperty: PropertyDetail = {
            id: propertyData.id,
            title: propertyData.title,
            address: propertyData.address,
            description: propertyData.description || '',
            price: propertyData.rent_amount || propertyData.price,
            bedrooms: propertyData.bedrooms,
            bathrooms: propertyData.bathrooms,
            area: propertyData.total_area || propertyData.area,
            isVerified: propertyData.is_verified === true,
            isFurnished: propertyData.furnished === true,
            amenities: propertyData.amenities || [],
            
            // Process owner information
            ownerName: propertyData.owner_name || 
                      (propertyData.owner ? 
                        `${propertyData.owner.first_name || ''} ${propertyData.owner.last_name || ''}`.trim() || 
                        propertyData.owner.username : 
                        'Property Owner'),
            
            ownerPhone: propertyData.owner_phone || 
                        (propertyData.owner ? propertyData.owner.phone : ''),
            
            // Process images
            images: propertyData.property_images?.map((img: any) => img.image) || 
                  propertyData.images || 
                  ['/placeholder-property.jpg'],
            
            // Process dates and stay information
            availableFrom: propertyData.available_from || propertyData.availableFrom,
            minimumStay: propertyData.minimum_stay || propertyData.minimumStay || 1,
            maximumStay: propertyData.maximum_stay || propertyData.maximumStay,
            
            // Process university proximities - convert from snake_case to camelCase
            nearbyUniversities: propertyData.university_proximities?.map((prox: any) => ({
              id: prox.university.id,
              name: prox.university.name,
              distance: prox.distance_in_meters,
              walkingTime: prox.walking_time_minutes
            })) || []
          };
          
          setProperty(processedProperty);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Failed to load property details:', err);
        setError('Failed to load property details. Please try again later.');
        
        // Fallback safely
        const mockProperty = mockProperties.find(p => p.id === parseInt(propertyId));
        if (mockProperty) {
          setProperty({...mockProperty} as PropertyDetail);
          setError(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProperty();
    
    return () => {
      isMounted = false; // Cleanup to prevent updates after unmount
    };
  }, [propertyId]);

  const nextImage = () => {
    if (property?.images.length) {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % property.images.length
      );
    }
  };

  const prevImage = () => {
    if (property?.images.length) {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex - 1 + property.images.length) % property.images.length
      );
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-3 gap-6">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="h-40 bg-gray-200 rounded mt-6"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !property) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error || 'Property not found'}</p>
          </div>
          <Link href="/properties" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
            ← Back to all properties
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 py-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/properties" className="inline-block mb-6 text-indigo-600 hover:text-indigo-800">
            ← Back to all properties
          </Link>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Property Images */}
            <div className="relative h-96 w-full">
              {property.images && property.images.length > 0 ? (
                <>
                  <Image 
                    src={property.images[currentImageIndex]} 
                    alt={property.title}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Image navigation */}
                  {property.images.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full shadow-md hover:bg-opacity-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 p-2 rounded-full shadow-md hover:bg-opacity-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      {/* Image counter */}
                      <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {property.images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                  <span className="text-gray-400">No images available</span>
                </div>
              )}
              
              {/* Verification badge */}
              {property.isVerified && (
                <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified Property
                </div>
              )}
            </div>
            
            <div className="p-6">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                  <p className="text-gray-600 mt-1">{property.address}</p>
                </div>
                <div className="mt-4 md:mt-0 bg-indigo-50 text-indigo-800 px-4 py-2 rounded-md text-xl font-bold">
                  ${property.price} <span className="text-sm font-normal">/ month</span>
                </div>
              </div>
              
              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                  <span>{property.area} m²</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Available from {new Date(property.availableFrom || Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Min. stay {property.minimumStay} months</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span>{property.isFurnished ? 'Furnished' : 'Unfurnished'}</span>
                </div>
              </div>
              
              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700">{property.description}</p>
              </div>
              
              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Amenities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Nearby Universities */}
              {property.nearbyUniversities && property.nearbyUniversities.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Nearby Universities</h2>
                  <div className="space-y-3">
                    {property.nearbyUniversities.map((uni, index) => (
                      <div key={index} className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div>
                          <div className="font-medium">{uni.name}</div>
                          <div className="text-sm text-gray-600">
                            {uni.distance}m distance ({uni.walkingTime} mins walking)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Contact Owner */}
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Information</h2>
                <div className="flex items-start mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <div className="font-medium">{property.ownerName}</div>
                    <div className="text-sm text-gray-600">Property Owner</div>
                  </div>
                </div>
                {property.ownerPhone && (
                  <div className="flex items-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{property.ownerPhone}</span>
                  </div>
                )}
                <button 
                  className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                  onClick={() => alert('Messaging functionality will be implemented soon!')}
                >
                  Message Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}