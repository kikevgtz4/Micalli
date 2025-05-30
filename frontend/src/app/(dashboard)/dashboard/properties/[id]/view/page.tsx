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

    if (user?.userType !== 'property_owner') {
      router.push('/dashboard');
      return;
    }

    const fetchProperty = async () => {
      try {
        setLoading(true);
        // Use the special getByIdAsOwner method that includes the as_owner=true parameter
        const response = await apiService.properties.getByIdAsOwner(parseInt(propertyId));
        
        // Check if we got valid data
        if (!response.data) {
          setError('Property not found or you do not have permission to view it.');
          return;
        }
        
        // Set the property data - PropertyDetail will handle it appropriately
        setPropertyData(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch property:', err);
        
        // Handle different error types
        if (err.response?.status === 404) {
          setError('Property not found.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view this property.');
        } else {
          setError('Could not load this property. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, isAuthenticated, user, router]);

  // Handle redirect on error after loading is complete
  useEffect(() => {
    if (!loading && error) {
      const timer = setTimeout(() => {
        router.push('/dashboard/properties');
      }, 3000); // Give user time to read the error
      
      return () => clearTimeout(timer);
    }
  }, [loading, error, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !propertyData) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-error-50 border-l-4 border-error-400 p-4">
            <p className="text-error-700">{error || "Property not found"}</p>
            <p className="text-sm text-error-600 mt-2">Redirecting to your properties...</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/properties')}
            className="mt-4 text-primary-600 hover:text-primary-700 transition-colors"
          >
            ← Back to my properties
          </button>
        </div>
      </MainLayout>
    );
  }

  // Pass the property data and indicate this is an owner view
  return <PropertyDetail id={propertyId} initialData={propertyData} isOwnerView={true} />;
}