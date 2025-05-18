// src/app/(main)/properties/[id]/page.tsx
import { Suspense } from 'react';
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
  try {
    // Fetch the property data
    const property = await fetchPropertyData(params.id);
    
    // Return the metadata
    return {
      title: property.title ? `${property.title} | UniHousing` : 'Property Details | UniHousing',
      description: property.description ? property.description.substring(0, 160) : 'View details about this student housing property',
      openGraph: {
        images: property.images?.length > 0 ? [property.images[0]] : [],
      },
      // Set metadataBase to fix the warning
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    };
  } catch (error) {
    console.error(`Error generating metadata for property ${params.id}:`, error);
    return {
      title: 'Property Details | UniHousing',
      description: 'View details about this student housing property',
    };
  }
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  // Using await directly with params.id to fix the warning
  // Make sure to await any async operations that use params
  await fetchPropertyData(params.id); // Just to ensure params are awaited, we don't need the result here
  
  return (
    <Suspense fallback={<PropertyLoading />}>
      <PropertyDetail id={params.id} />
    </Suspense>
  );
}