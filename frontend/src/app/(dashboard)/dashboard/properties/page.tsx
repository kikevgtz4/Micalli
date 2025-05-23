// src/app/(dashboard)/dashboard/properties/page.tsx
// Replace the mock data fetching with this real API implementation:

"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { toast } from 'react-hot-toast';
import PropertyStatusBadge from '@/components/dashboard/PropertyStatusBadge';

interface Property {
  id: number;
  title: string;
  address: string;
  propertyType: string; // Changed from property_type
  bedrooms: number;
  bathrooms: number;
  rentAmount: number; // Changed from rent_amount
  isVerified: boolean; // Changed from is_verified
  isFeatured: boolean; // Changed from is_featured
  isActive: boolean; // Changed from is_active
  createdAt: string; // Changed from created_at
  images: any[];
}

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Call the owner properties API endpoint
        const response = await apiService.properties.getOwnerProperties();
        
        console.log('API Response:', response.data);
        
        // The response should already be converted to camelCase by the API service
        // If not, we need to apply case conversion here
        setProperties(response.data);
      } catch (err) {
        console.error('Failed to fetch properties:', err);
        setError('Failed to load properties. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProperties();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleToggleActive = async (propertyId: number, currentStatus: boolean) => {
    try {
      setIsUpdating(propertyId);
      
      await apiService.properties.toggleActive(propertyId);
      
      // Update the local state with consistent camelCase naming
      setProperties(prevProperties =>
        prevProperties.map(property =>
          property.id === propertyId
            ? { ...property, isActive: !currentStatus } // Using camelCase consistently
            : property
        )
      );
      
      toast.success(`Property ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
    } catch (error) {
      console.error('Failed to update property status:', error);
      toast.error('Failed to update property status. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
        <div className="flex space-x-3">
          {/* Update the filter to use camelCase */}
          {properties.filter(p => !p.isActive).length > 0 && (
            <button
              onClick={async () => {
                const inactiveCount = properties.filter(p => !p.isActive).length;
                const shouldActivate = window.confirm(
                  `You have ${inactiveCount} inactive properties. Would you like to activate them all so students can see them?`
                );
                if (shouldActivate) {
                  const inactiveProperties = properties.filter(p => !p.isActive);
                  for (const property of inactiveProperties) {
                    try {
                      await handleToggleActive(property.id, false);
                      await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                      console.error(`Failed to activate property ${property.id}:`, error);
                    }
                  }
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Activate All ({properties.filter(p => !p.isActive).length})
            </button>
          )}
          <Link
            href="/dashboard/list-property"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
          >
            + Add New Property
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <BuildingIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
          <p className="text-gray-500 mb-6">
            You haven't created any property listings yet. Get started by adding your first property.
          </p>
          <Link
            href="/dashboard/list-property"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
          >
            Add Your First Property
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {/* ... existing table header ... */}
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden relative bg-gray-200">
                          {property.images && property.images.length > 0 ? (
                            <Image 
                              src={property.images[0].image || '/placeholder-property.jpg'} 
                              alt={property.title}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <BuildingIcon className="h-5 w-5 text-gray-400 absolute inset-0 m-auto" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{property.title}</div>
                          <div className="text-sm text-gray-500">{property.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{property.propertyType}</div>
                      <div className="text-sm text-gray-500">{property.bedrooms} bd, {property.bathrooms} ba</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${property.rentAmount?.toLocaleString()}/month</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <PropertyStatusBadge isActive={property.isActive} size="sm" />
                        {property.isVerified && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Verified
                          </span>
                        )}
                        {property.isFeatured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(property.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => handleToggleActive(property.id, property.isActive)}
                          disabled={isUpdating === property.id}
                          className={`text-xs px-2 py-1 rounded ${
                            property.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          } ${isUpdating === property.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isUpdating === property.id 
                            ? 'Updating...' 
                            : property.isActive 
                              ? 'Deactivate' 
                              : 'Activate'}
                        </button>
                        <Link
                          href={`/dashboard/properties/${property.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/dashboard/properties/${property.id}/view`}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}