// src/app/(main)/properties/[id]/page.tsx (Server Component)
import PropertyDetail from './client';
import { fetchPropertyData } from '@/lib/api-server';
import { getImageUrl } from '@/utils/imageUrls';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const property = await fetchPropertyData(params.id);
  
  return {
    title: `${property.title} | UniHousing`,
    description: property.description.substring(0, 160),
    openGraph: {
      images: property.images?.[0] ? [getImageUrl(property.images[0])] : [],
    },
  };
}

export default function PropertyPage({ params }: { params: { id: string } }) {
  return <PropertyDetail id={params.id} />;
}