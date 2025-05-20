// src/app/(main)/properties/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PropertyDetail from './client';
import { fetchPropertyData } from '@/lib/api-server';

// Loading component
function PropertyLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const propertyId = String(params.id);
  
  try {
    const property = await fetchPropertyData(propertyId);
    
    return {
      title: property.title ? `${property.title} | UniHousing` : 'Property Details | UniHousing',
      description: property.description ? property.description.substring(0, 160) : 'View details about this student housing property',
      openGraph: {
        images: property.images?.length > 0 ? [property.images[0]] : [],
      },
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    };
  } catch (error: any) {
    // For 404s, we'll still have metadata but the page will show notFound()
    if (error.message && error.message.includes('not found')) {
      return {
        title: 'Property Not Found | UniHousing',
        description: 'The requested property could not be found',
      };
    }
    
    // For other errors
    return {
      title: 'Property Details | UniHousing',
      description: 'View details about this student housing property',
    };
  }
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const propertyId = String(params.id);
  
  try {
    // Attempt to fetch the property to validate it exists
    const propertyData = await fetchPropertyData(propertyId);
    
    // Property exists, render the detail component
    return (
      <Suspense fallback={<PropertyLoading />}>
        <PropertyDetail id={propertyId} initialData={propertyData} />
      </Suspense>
    );
  } catch (error: any) {
    // Check if this is a 'not found' error or inactive property error
    if (error.message && (
        error.message.includes('not found') || 
        error.message.includes('inactive') ||
        error.status === 404
      )) {
      // Use Next.js built-in 404 handling
      notFound();
    }
    
    // For other errors, still render the component and let client handle display
    return (
      <Suspense fallback={<PropertyLoading />}>
        <PropertyDetail id={propertyId} />
      </Suspense>
    );
  }
}