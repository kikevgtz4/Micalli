"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import PropertyStatusBadge from '@/components/dashboard/PropertyStatusBadge';

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
  // Basic Info
  title: '',
  description: '',
  propertyType: 'apartment', // Already camelCase
  
  // Location
  address: '',
  latitude: '',
  longitude: '',
  
  // Details
  bedrooms: 1,
  bathrooms: 1,
  area: '', // Already camelCase for this component
  isFurnished: false, // Already camelCase
  amenities: [] as string[],
  
  // Pricing
  price: '', // Already camelCase for this component
  deposit: '', // Already camelCase for this component
  paymentFrequency: 'monthly', // Already camelCase
  includedUtilities: [] as string[], // Already camelCase
  
  // Availability
  availableFrom: '', // Already camelCase
  minimumStay: 1, // Already camelCase
  maximumStay: '', // Already camelCase
  
  // Status
  isActive: false, // New camelCase property
  
  // Images
  images: [] as File[],
  existingImages: [] as any[],
});

  const amenitiesList = [
    'WiFi', 'Air Conditioning', 'Heating', 'Washing Machine', 'Dryer', 
    'Kitchen', 'Refrigerator', 'Microwave', 'Dishwasher', 'TV', 
    'Cable TV', 'Parking', 'Gym', 'Swimming Pool', 'Security System', 
    'Elevator', 'Balcony', 'Patio', 'Garden', 'Study Room'
  ];
  
  const utilitiesList = [
    'Electricity', 'Water', 'Gas', 'Internet', 'Cable TV', 'Trash Collection'
  ];

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the owner-specific method to fetch property data
        const response = await apiService.properties.getByIdAsOwner(parseInt(propertyId));
        const property = response.data;
        
        // Format the date (YYYY-MM-DD)
        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        setFormData({
          title: property.title || '',
          description: property.description || '',
          propertyType: property.propertyType || 'apartment', // Now using camelCase consistently
          address: property.address || '',
          latitude: property.latitude ? property.latitude.toString() : '',
          longitude: property.longitude ? property.longitude.toString() : '',
          bedrooms: property.bedrooms || 1,
          bathrooms: property.bathrooms || 1,
          area: property.totalArea ? property.totalArea.toString() : '', // Using camelCase
          isFurnished: property.furnished || false,
          amenities: property.amenities || [],
          price: property.rentAmount ? property.rentAmount.toString() : '', // Using camelCase
          deposit: property.depositAmount ? property.depositAmount.toString() : '', // Using camelCase
          paymentFrequency: property.paymentFrequency || 'monthly', // Using camelCase
          includedUtilities: property.includedUtilities || [], // Using camelCase
          availableFrom: property.availableFrom ? formatDate(property.availableFrom) : '', // Using camelCase
          minimumStay: property.minimumStay || 1, // Using camelCase
          maximumStay: property.maximumStay ? property.maximumStay.toString() : '', // Using camelCase
          isActive: property.isActive || false, // Using camelCase consistently
          images: [],
          existingImages: property.images || [],
        });
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Failed to fetch property:', error);
        setError('Failed to load property data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchProperty();
  }, [propertyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      const { checked } = checkbox;
      
      if (name === 'isFurnished') {
        setFormData({ ...formData, [name]: checked });
      } else if (name.startsWith('amenity-')) {
        const amenity = name.replace('amenity-', '');
        setFormData({
          ...formData,
          amenities: checked
            ? [...formData.amenities, amenity]
            : formData.amenities.filter(a => a !== amenity)
        });
      } else if (name.startsWith('utility-')) {
        const utility = name.replace('utility-', '');
        setFormData({
          ...formData,
          includedUtilities: checked
            ? [...formData.includedUtilities, utility]
            : formData.includedUtilities.filter(u => u !== utility)
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '' || !isNaN(Number(value))) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({
        ...formData,
        images: [...formData.images, ...Array.from(e.target.files)]
      });
    }
  };
  
  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };
  
  const removeExistingImage = (id: number) => {
    setFormData({
      ...formData,
      existingImages: formData.existingImages.filter(img => img.id !== id)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create FormData object for property submission
      const propertyData = new FormData();
      
      // Add all the form fields to the FormData
      propertyData.append('title', formData.title);
      propertyData.append('description', formData.description);
      propertyData.append('property_type', formData.propertyType);
      propertyData.append('address', formData.address);
      
      if (formData.latitude) propertyData.append('latitude', formData.latitude);
      if (formData.longitude) propertyData.append('longitude', formData.longitude);
      
      propertyData.append('bedrooms', formData.bedrooms.toString());
      propertyData.append('bathrooms', formData.bathrooms.toString());
      propertyData.append('total_area', formData.area.toString());
      propertyData.append('furnished', formData.isFurnished.toString());
      
      // Add amenities as JSON string
      propertyData.append('amenities', JSON.stringify(formData.amenities));
      
      // Add included utilities as JSON string
      propertyData.append('included_utilities', JSON.stringify(formData.includedUtilities));
      
      // Add pricing information
      propertyData.append('rent_amount', formData.price);
      propertyData.append('deposit_amount', formData.deposit);
      propertyData.append('payment_frequency', formData.paymentFrequency);
      
      // Add availability information
      propertyData.append('available_from', formData.availableFrom);
      propertyData.append('minimum_stay', formData.minimumStay.toString());
      if (formData.maximumStay) propertyData.append('maximum_stay', formData.maximumStay.toString());
      
      // Track the IDs of existing images to keep
      const existingImageIds = formData.existingImages.map(img => img.id);
      propertyData.append('existing_images', JSON.stringify(existingImageIds));
      
      // Update the property
      await apiService.properties.update(parseInt(propertyId), propertyData);
      
      // Handle image uploads if there are any
      if (formData.images.length > 0) {
        const imagesFormData = new FormData();
        
        formData.images.forEach((image) => {
          imagesFormData.append('images', image);
        });
        
        await apiService.properties.uploadImages(parseInt(propertyId), imagesFormData);
      }
      
      // Redirect to the property dashboard page
      router.push('/dashboard/properties');
      
    } catch (error: any) {
      console.error('Error updating property:', error);
      setError(
        error.response?.data?.detail || 
        'Failed to update property listing. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Property</h1>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Modern Apartment near Tec de Monterrey"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description*
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe your property, including key features and advantages for students"
                />
              </div>
              
              <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type*
                </label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="room">Room</option>
                  <option value="studio">Studio</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address*
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Street, Number, Neighborhood, City"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 25.6714"
                  />
                </div>
                
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., -100.3099"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Property Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Details</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms*
                  </label>
                  <input
                    type="number"
                    id="bedrooms"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleNumberChange}
                    required
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms*
                  </label>
                  <input
                    type="number"
                    id="bathrooms"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleNumberChange}
                    required
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                    Area (m²)*
                  </label>
                  <input
                    type="text"
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleNumberChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 75"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFurnished"
                    name="isFurnished"
                    checked={formData.isFurnished}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isFurnished" className="ml-2 block text-sm font-medium text-gray-700">
                    Furnished
                  </label>
                </div>
              </div>
              
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">Amenities</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {amenitiesList.map(amenity => (
                    <div key={amenity} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`amenity-${amenity}`}
                        name={`amenity-${amenity}`}
                        checked={formData.amenities.includes(amenity)}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`amenity-${amenity}`} className="ml-2 block text-sm text-gray-700">
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Pricing and Availability */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing & Availability</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent (MXN)*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleNumberChange}
                      required
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 8500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="deposit" className="block text-sm font-medium text-gray-700 mb-1">
                    Security Deposit (MXN)*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      id="deposit"
                      name="deposit"
                      value={formData.deposit}
                      onChange={handleNumberChange}
                      required
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 8500"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="paymentFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Frequency
                </label>
                <select
                  id="paymentFrequency"
                  name="paymentFrequency"
                  value={formData.paymentFrequency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="bimonthly">Bimonthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">Included Utilities</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {utilitiesList.map(utility => (
                    <div key={utility} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`utility-${utility}`}
                        name={`utility-${utility}`}
                        checked={formData.includedUtilities.includes(utility)}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`utility-${utility}`} className="ml-2 block text-sm text-gray-700">
                        {utility}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 mb-1">
                  Available From*
                </label>
                <input
                  type="date"
                  id="availableFrom"
                  name="availableFrom"
                  value={formData.availableFrom}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minimumStay" className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Stay (months)*
                  </label>
                  <input
                    type="number"
                    id="minimumStay"
                    name="minimumStay"
                    value={formData.minimumStay}
                    onChange={handleNumberChange}
                    required
                    min="1"
                    max="36"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="maximumStay" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Stay (months, optional)
                  </label>
                  <input
                    type="text"
                    id="maximumStay"
                    name="maximumStay"
                    value={formData.maximumStay}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Leave blank if no maximum"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Images */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Images</h2>
            
            {/* Existing Images */}
            {formData.existingImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">Existing Images</h3>
                <p className="text-sm text-gray-500 mb-3">You can remove any images that you no longer want to display.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.existingImages.map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.image}
                        alt="Property"
                        className="h-32 w-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add New Images */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">Add New Images</h3>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="images"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="images"
                        name="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              </div>
            </div>
            
            {/* New Images Preview */}
            {formData.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-700 mb-2">New Images to Upload:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Property image ${index + 1}`}
                        className="h-32 w-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

{/* Property Status Management */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Status</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Visibility Status</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.isActive 
                      ? "Your property is currently visible to students and appears in search results."
                      : "Your property is currently hidden from students and does not appear in search results."
                    }
                  </p>
                </div>
                <PropertyStatusBadge isActive={formData.isActive} size="lg" />
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await apiService.properties.toggleActive(parseInt(propertyId));
                      setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
                    } catch (error) {
                      setError('Failed to update property status. Please try again.');
                    }
                  }}
                  className={`px-4 py-2 rounded-md font-medium ${
                    formData.isActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {formData.isActive ? 'Deactivate Property' : 'Activate Property'}
                </button>
                
                <span className="text-sm text-gray-500">
                  Changes take effect immediately
                </span>
              </div>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => router.push('/dashboard/properties')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}