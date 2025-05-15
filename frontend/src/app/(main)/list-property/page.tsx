'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';

export default function ListPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    propertyType: 'apartment',
    
    // Location
    address: '',
    latitude: '',
    longitude: '',
    
    // Details
    bedrooms: 1,
    bathrooms: 1,
    area: '',
    isFurnished: false,
    amenities: [] as string[],
    
    // Pricing
    price: '',
    deposit: '',
    paymentFrequency: 'monthly',
    includedUtilities: [] as string[],
    
    // Availability
    availableFrom: '',
    minimumStay: 1,
    maximumStay: '',
    
    // Images
    images: [] as File[],
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

  const nextStep = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Here you would send the data to your API
      console.log('Submitting property data:', formData);
      
      // Mock API call success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.push('/properties?listed=success');
    } catch (error) {
      console.error('Error submitting property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 py-10 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              List Your Property
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Connect with students looking for housing near universities
            </p>
          </div>
          
          {/* Steps */}
          <div className="mb-8">
            <div className="flex justify-between">
              {['Basic Info', 'Details', 'Pricing', 'Images', 'Review'].map((stepLabel, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step > index + 1 
                        ? 'bg-green-500 text-white' 
                        : step === index + 1 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {step > index + 1 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="mt-2 text-sm text-gray-600">{stepLabel}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300" />
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div>
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
              )}
              
              {/* Step 2: Property Details */}
              {step === 2 && (
                <div>
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
              )}
              
              {/* Step 3: Pricing and Availability */}
              {step === 3 && (
                <div>
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
              )}
              
              {/* Step 4: Images */}
              {step === 4 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Images</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Photos*
                      </label>
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
                    
                    {formData.images.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images:</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {formData.images.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Property image ${index + 1}`}
                                className="h-24 w-full object-cover rounded-md"
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
                </div>
              )}
              
              {/* Step 5: Review */}
              {step === 5 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Listing</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{formData.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{formData.address}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Price:</span> ${formData.price}/month
                        </div>
                        <div>
                          <span className="font-medium">Property Type:</span> {formData.propertyType}
                        </div>
                        <div>
                          <span className="font-medium">Bedrooms:</span> {formData.bedrooms}
                        </div>
                        <div>
                          <span className="font-medium">Bathrooms:</span> {formData.bathrooms}
                        </div>
                        <div>
                          <span className="font-medium">Area:</span> {formData.area} m²
                        </div>
                        <div>
                          <span className="font-medium">Furnished:</span> {formData.isFurnished ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <span className="font-medium">Available From:</span> {formData.availableFrom}
                        </div>
                        <div>
                          <span className="font-medium">Minimum Stay:</span> {formData.minimumStay} months
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="font-medium text-sm">Description:</p>
                        <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                      </div>
                      
                      {formData.amenities.length > 0 && (
                        <div className="mt-4">
                          <p className="font-medium text-sm">Amenities:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {formData.amenities.map(amenity => (
                              <span key={amenity} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {formData.includedUtilities.length > 0 && (
                        <div className="mt-4">
                          <p className="font-medium text-sm">Included Utilities:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {formData.includedUtilities.map(utility => (
                              <span key={utility} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {utility}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {formData.images.length > 0 && (
                        <div className="mt-4">
                          <p className="font-medium text-sm">Images ({formData.images.length}):</p>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            {formData.images.slice(0, 3).map((image, index) => (
                              <img
                                key={index}
                                src={URL.createObjectURL(image)}
                                alt={`Property image ${index + 1}`}
                                className="h-16 w-full object-cover rounded-md"
                              />
                            ))}
                            {formData.images.length > 3 && (
                              <div className="h-16 w-full bg-gray-200 rounded-md flex items-center justify-center text-gray-600 text-sm">
                                +{formData.images.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Your listing will be reviewed by our team before becoming visible to students. This usually takes 24-48 hours.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-8 flex justify-between">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back
                  </button>
                )}
                {step < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Listing'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}