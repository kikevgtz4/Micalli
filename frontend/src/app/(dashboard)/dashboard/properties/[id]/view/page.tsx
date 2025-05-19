// Create a new file: src/app/(dashboard)/dashboard/properties/[id]/view/page.tsx

"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import PropertyDetail from '@/app/(main)/properties/[id]/client';
import MainLayout from '@/components/layout/MainLayout';

export default function OwnerPropertyView() {
  const params = useParams();
  const propertyId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Ensure this page is only accessible to property owners
    if (!isAuthenticated) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    if (user?.user_type !== 'property_owner') {
      router.push('/dashboard');
      return;
    }

    const fetchProperty = async () => {
      try {
        // Use the special getByIdAsOwner method that includes the as_owner=true parameter
        const response = await apiService.properties.getByIdAsOwner(parseInt(propertyId));
        setPropertyData(response.data);
      } catch (err) {
        console.error('Failed to fetch property:', err);
        setError('Could not load this property. You may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, isAuthenticated, user, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !propertyData) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error || "Property not found"}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/properties')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            ← Back to my properties
          </button>
        </div>
      </MainLayout>
    );
  }

  // Use the same PropertyDetail component but pass the pre-fetched data
  return <PropertyDetail id={propertyId} initialData={propertyData} />;
}