'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';

interface University {
  id: number;
  name: string;
  description: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  student_population: number;
  logo?: string;
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoading(true);
        const response = await apiService.getUniversities();
        
        // Log the response to help with debugging
        console.log('API Response:', response.data);
        
        // Handle different possible response structures
        let universitiesData;
        if (Array.isArray(response.data)) {
          universitiesData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Check if data is nested in results or another property
          universitiesData = response.data.results || response.data.universities || [];
        } else {
          universitiesData = [];
        }
        
        setUniversities(universitiesData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch universities:', err);
        setError('Failed to load universities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center p-12">Loading universities...</div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-red-500 p-4">{error}</div>
      </MainLayout>
    );
  }

  // Safety check before mapping
  if (!Array.isArray(universities)) {
    return (
      <MainLayout>
        <div className="text-red-500 p-4">Unexpected data format received from API</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 py-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Universities in Monterrey
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Find housing options near your university
            </p>
          </div>
          
          {universities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No universities found. Please add universities through the admin interface.</p>
              <a 
                href="http://localhost:8000/admin/universities/university/add/" 
                target="_blank"
                rel="noopener noreferrer" 
                className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Add University in Admin
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {universities.map((university) => (
                <div key={university.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-40 bg-indigo-100 flex items-center justify-center">
                    {university.logo ? (
                      <img 
                        src={university.logo} 
                        alt={university.name} 
                        className="object-cover h-full w-full"
                      />
                    ) : (
                      <span className="text-indigo-700 font-semibold text-xl">{university.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900">{university.name}</h2>
                    <p className="text-gray-500 text-sm mt-1">{university.address}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <a 
                        href={university.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Visit Website
                      </a>
                      <span className="text-sm text-gray-600">
                        {university.student_population?.toLocaleString()} students
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}