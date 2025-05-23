// src/app/(main)/properties/[id]/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
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
    // Only try to fetch if property is active (public access)
    const property = await fetchPropertyData(propertyId, false);
    
    return {
      title: property.title ? `${property.title} | UniHousing` : 'Property Details | UniHousing',
      description: property.description ? property.description.substring(0, 160) : 'View details about this student housing property',
      openGraph: {
        images: property.images?.length > 0 ? [property.images[0].image] : [],
      },
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    };
  } catch (error: any) {
    // For any error (404, inactive, etc.), use default metadata
    return {
      title: 'Property Details | UniHousing',
      description: 'View details about this student housing property',
    };
  }
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const propertyId = String(params.id);
  
  try {
    // Attempt to fetch the property with public access only (active properties only)
    const propertyData = await fetchPropertyData(propertyId, false);
    
    // Additional check: ensure property is active
    if (!propertyData.is_active) {
      console.log(`Property ${propertyId} is inactive, redirecting to properties page`);
      redirect('/properties');
    }
    
    // If we get here, the property exists and is active
    return (
      <Suspense fallback={<PropertyLoading />}>
        <PropertyDetail id={propertyId} initialData={propertyData} />
      </Suspense>
    );
  } catch (error: any) {
    // For any error (not found, inactive, server error), redirect to properties page
    console.log(`Redirecting from property ${propertyId}: ${error.message}`);
    redirect('/properties');
  }
}