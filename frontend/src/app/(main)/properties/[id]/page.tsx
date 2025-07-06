// src/app/(main)/properties/[id]/page.tsx
import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import PropertyDetailsClient from './client';
import { fetchPropertyDataSafe } from '@/lib/api-server';

// Loading component
function PropertyLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="animate-pulse">
        <div className="h-96 bg-stone-200 rounded-lg mb-6"></div>
        <div className="h-8 bg-stone-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-stone-200 rounded w-1/2 mb-6"></div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const propertyId = String(resolvedParams.id);
  
  try {
    // Use the safe version that doesn't throw errors
    const result = await fetchPropertyDataSafe(propertyId, false);
    
    if (result.success) {
      const property = result.data;
      return {
        title: property.title ? `${property.title} | Micalli` : 'Property Details | Micalli',
        description: property.description ? property.description.substring(0, 160) : 'View details about this student housing property',
        openGraph: {
          images: property.images?.length > 0 ? [property.images[0].image] : [],
        },
        metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
      };
    }
    
    // For inactive or not found properties, use default metadata
    return {
      title: 'Property Details | Micalli',
      description: 'View details about this student housing property',
    };
  } catch (error: any) {
    // Fallback metadata for any unexpected errors
    return {
      title: 'Property Details | Micalli',
      description: 'View details about this student housing property',
    };
  }
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const propertyId = String(resolvedParams.id);
  
  console.log(`=== PROPERTY PAGE: Fetching property ${propertyId} ===`);
  
  // Use the safe version that provides detailed error information
  const result = await fetchPropertyDataSafe(propertyId, false);
  
  if (!result.success) {
    // Handle different types of errors appropriately
    console.log(`=== PROPERTY PAGE: Property ${propertyId} fetch failed ===`);
    console.log(`Error type: ${result.error}`);
    console.log(`Error message: ${result.message}`);
    
    switch (result.error) {
      case 'not_found':
        // Property doesn't exist at all
        console.log(`Property ${propertyId} not found, showing 404 page`);
        notFound();
        break;
      case 'inactive':
        // Property exists but is inactive - redirect to properties page
        console.log(`Property ${propertyId} is inactive, redirecting to /properties`);
        redirect('/properties');
        break;
      case 'access_denied':
        // Access denied - redirect to properties page
        console.log(`Access denied to property ${propertyId}, redirecting to /properties`);
        redirect('/properties');
        break;
      default:
        // Server error or other issues
        console.error(`Unexpected error fetching property ${propertyId}:`, result.message);
        console.log(`Redirecting to /properties due to server error`);
        redirect('/properties');
    }
  }
  
  console.log(`=== PROPERTY PAGE: Property ${propertyId} loaded successfully ===`);
  console.log(`Property title: ${result.data.title}`);
  console.log(`Property is active: ${result.data.isActive}`);
  
  // If we get here, the property exists and is active
  // Pass propertyId and initialData to avoid double fetching
  return (
    <Suspense fallback={<PropertyLoading />}>
      <PropertyDetailsClient propertyId={propertyId} initialData={result.data} />
    </Suspense>
  );
}