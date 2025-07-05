"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AddressField from '@/components/property/AddressField';
import { usePropertyForm, useFileUpload } from "@/hooks/useForm";
import {
  AMENITIES_LIST,
  UTILITIES_LIST,
  PROPERTY_TYPES,
  PAYMENT_FREQUENCIES,
} from "@/utils/constants";
import { helpers } from "@/utils/helpers";
import apiService from "@/lib/api";
import { toast } from "react-hot-toast";
import { 
  HomeIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  PhotoIcon, 
  CheckCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  MapPinIcon,
  Square3Stack3DIcon,
  CalendarIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";

// Define proper types for our form data
interface PropertyFormData {
  title: string;
  description: string;
  propertyType: string;
  address: string;
  latitude: string;
  longitude: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  isFurnished: boolean;
  amenities: string[];
  price: string;
  deposit: string;
  paymentFrequency: string;
  includedUtilities: string[];
  availableFrom: string;
  minimumStay: number;
  maximumStay: string;
}

// Step configuration with icons and descriptions
const STEPS = [
  { 
    id: 1, 
    title: "Basic Info", 
    icon: HomeIcon, 
    description: "Tell us about your property",
    color: "from-emerald-500 to-green-600"
  },
  { 
    id: 2, 
    title: "Details", 
    icon: DocumentTextIcon, 
    description: "Rooms, amenities & features",
    color: "from-blue-500 to-indigo-600"
  },
  { 
    id: 3, 
    title: "Pricing", 
    icon: CurrencyDollarIcon, 
    description: "Set your rental terms",
    color: "from-purple-500 to-pink-600"
  },
  { 
    id: 4, 
    title: "Photos", 
    icon: PhotoIcon, 
    description: "Show off your space",
    color: "from-orange-500 to-red-600"
  },
  { 
    id: 5, 
    title: "Review", 
    icon: CheckCircleIcon, 
    description: "Confirm your listing",
    color: "from-teal-500 to-cyan-600"
  }
];

// Amenity icons mapping
const AMENITY_ICONS: Record<string, string> = {
  'WiFi': '📶',
  'Air Conditioning': '❄️',
  'Heating': '🔥',
  'Washing Machine': '🧺',
  'Dryer': '🌪️',
  'Kitchen': '🍳',
  'Refrigerator': '🧊',
  'Microwave': '📱',
  'Dishwasher': '🍽️',
  'TV': '📺',
  'Cable TV': '📡',
  'Parking': '🚗',
  'Gym': '💪',
  'Swimming Pool': '🏊',
  'Security System': '🔒',
  'Elevator': '🛗',
  'Balcony': '🏠',
  'Patio': '🌿',
  'Garden': '🌱',
  'Study Room': '📚'
};

// Property type icons
const PROPERTY_TYPE_ICONS: Record<string, string> = {
  'apartment': '🏢',
  'house': '🏠',
  'room': '🚪',
  'studio': '🏙️',
  'other': '🏘️'
};

export default function ListPropertyPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Use the custom form hook with proper typing
  const {
    values: formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit: submitForm,
    setFieldError,
  } = usePropertyForm(
    {
      title: "",
      description: "",
      propertyType: "apartment",
      address: "",
      latitude: "",
      longitude: "",
      bedrooms: 1,
      bathrooms: 1,
      area: "",
      isFurnished: false,
      amenities: [] as string[],
      price: "",
      deposit: "",
      paymentFrequency: "monthly",
      includedUtilities: [] as string[],
      availableFrom: "",
      minimumStay: 1,
      maximumStay: "",
    },
    handlePropertySubmit
  );

  // Use the file upload hook
  const {
    files: images,
    uploadErrors,
    addFiles,
    removeFile,
  } = useFileUpload(10, 10);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard/list-property");
    } else if (user?.userType !== "property_owner") {
      setFieldError("submit", "Only property owners can create listings.");
    }
  }, [isAuthenticated, user, router, setFieldError]);

  // Handle property submission with proper typing
  async function handlePropertySubmit(values: PropertyFormData) {
    try {
      const propertyData = new FormData();

      // Add all form fields with proper type handling
      Object.entries(values).forEach(([key, value]) => {
        if (key === "amenities" || key === "includedUtilities") {
          propertyData.append(
            key === "amenities" ? "amenities" : "included_utilities",
            JSON.stringify(value)
          );
        } else if (key === "isFurnished") {
          propertyData.append("furnished", value ? "true" : "false");
        } else if (key === "propertyType") {
          propertyData.append("property_type", value as string);
        } else if (key === "price") {
          propertyData.append("rent_amount", value as string);
        } else if (key === "deposit") {
          propertyData.append("deposit_amount", value as string);
        } else if (key === "area") {
          propertyData.append("total_area", value as string);
        } else if (key === "paymentFrequency") {
          propertyData.append("payment_frequency", value as string);
        } else if (key === "availableFrom") {
          propertyData.append("available_from", value as string);
        } else if (key === "minimumStay") {
          propertyData.append("minimum_stay", (value as number).toString());
        } else if (key === "maximumStay" && value) {
          propertyData.append("maximum_stay", value as string);
        } else if (typeof value === "string" || typeof value === "number") {
          propertyData.append(key, value.toString());
        }
      });

      // Add empty rules array
      propertyData.append("rules", JSON.stringify([]));

      const response = await apiService.properties.create(propertyData);

      // Handle image uploads
      if (images.length > 0) {
        const imagesFormData = new FormData();
        images.forEach((image: File) => imagesFormData.append("images", image));
        await apiService.properties.uploadImages(
          response.data.id,
          imagesFormData
        );
      }

      toast.success("Property created successfully!");
      router.push(`/dashboard/properties/${response.data.id}/view`);
    } catch (error: any) {
      const errorMessage = helpers.getErrorMessage(error);
      setFieldError("submit", errorMessage);
      throw error;
    }
  }

  // Handle field changes with proper typing
  const handleFieldChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      const { checked } = checkbox;

      if (name === "isFurnished") {
        handleChange(name, checked);
      } else if (name.startsWith("amenity-")) {
        const amenity = name.replace("amenity-", "");
        const newAmenities = checked
          ? [...formData.amenities, amenity]
          : formData.amenities.filter((a: string) => a !== amenity);
        handleChange("amenities", newAmenities);
      } else if (name.startsWith("utility-")) {
        const utility = name.replace("utility-", "");
        const newUtilities = checked
          ? [...formData.includedUtilities, utility]
          : formData.includedUtilities.filter((u: string) => u !== utility);
        handleChange("includedUtilities", newUtilities);
      }
    } else {
      handleChange(name, value);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (value === "" || !isNaN(Number(value))) {
      handleChange(name, value);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const nextStep = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const currentStep = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/properties')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">List Your Property</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {currentStep.description}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2">
              <SparklesIcon className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">
                Properties listed in 5 minutes on average
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -translate-y-1/2 hidden sm:block">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            {STEPS.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              
              return (
                <div 
                  key={s.id} 
                  className="relative z-10 flex flex-col items-center cursor-pointer group"
                  onClick={() => isCompleted && setStep(s.id)}
                >
                  {/* Step Circle */}
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                      ${isActive 
                        ? `bg-gradient-to-r ${s.color} text-white shadow-lg scale-110` 
                        : isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                      }
                      ${isCompleted && !isActive ? 'hover:scale-105 cursor-pointer' : ''}
                    `}
                  >
                    {isCompleted && !isActive ? (
                      <CheckIcon className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <span 
                    className={`
                      mt-2 text-xs font-medium transition-colors duration-300
                      ${isActive ? 'text-gray-900' : isCompleted ? 'text-green-600' : 'text-gray-500'}
                      hidden sm:block
                    `}
                  >
                    {s.title}
                  </span>
                  
                  {/* Mobile Step Number */}
                  <span className="mt-2 text-xs font-medium text-gray-600 sm:hidden">
                    {s.id}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Mobile Progress Text */}
          <div className="mt-4 text-center sm:hidden">
            <p className="text-sm font-medium text-gray-900">{currentStep.title}</p>
            <p className="text-xs text-gray-600 mt-1">Step {step} of {STEPS.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {errors.submit && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-slide-in-down">
            <div className="flex">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Errors */}
        {uploadErrors.length > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800 font-medium">Image upload issues:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                  {uploadErrors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Card Header */}
          <div className={`px-8 py-6 bg-gradient-to-r ${currentStep.color}`}>
            <div className="flex items-center space-x-3">
              <currentStep.icon className="h-8 w-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">{currentStep.title}</h2>
                <p className="text-white/80 text-sm mt-1">{currentStep.description}</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={(e) => e.preventDefault()} className="p-8">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                {/* Property Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                    Property Title
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleFieldChange}
                      required
                      className={`
                        w-full px-4 py-3 border-2 rounded-lg transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                        ${errors.title 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-green-500'
                        }
                      `}
                      placeholder="e.g., Modern Apartment near Tec de Monterrey"
                    />
                    {formData.title && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      {errors.title}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Make it catchy! This is the first thing students will see.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleFieldChange}
                      required
                      rows={4}
                      className={`
                        w-full px-4 py-3 border-2 rounded-lg transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                        ${errors.description 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-green-500'
                        }
                      `}
                      placeholder="Describe your property, including key features and what makes it perfect for students..."
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {formData.description.length}/1000
                    </div>
                  </div>
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Property Type
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PROPERTY_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className={`
                          relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                          ${formData.propertyType === type.value
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="propertyType"
                          value={type.value}
                          checked={formData.propertyType === type.value}
                          onChange={handleFieldChange}
                          className="sr-only"
                        />
                        <span className="text-2xl mr-3">
                          {PROPERTY_TYPE_ICONS[type.value]}
                        </span>
                        <span className={`font-medium ${
                          formData.propertyType === type.value ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          {type.label}
                        </span>
                        {formData.propertyType === type.value && (
                          <CheckCircleIcon className="absolute top-2 right-2 h-5 w-5 text-green-600" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Address Section with Geocoding */}
<AddressField
  address={formData.address}
  latitude={formData.latitude}
  longitude={formData.longitude}
  onAddressChange={(value) => handleFieldChange({ 
    target: { name: 'address', value } 
  } as any)}
  onCoordinatesChange={(lat, lng) => {
    // Round to 6 decimal places to match database precision
    const roundedLat = parseFloat(lat).toFixed(6);
    const roundedLng = parseFloat(lng).toFixed(6);
    handleChange('latitude', roundedLat);
    handleChange('longitude', roundedLng);
  }}
  errors={errors}
  required
/>
  </div>
)}

            {/* Step 2: Property Details */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                {/* Room Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Square3Stack3DIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Room Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Bedrooms */}
                    <div>
                      <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-2">
                        Bedrooms
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="bedrooms"
                          name="bedrooms"
                          value={formData.bedrooms}
                          onChange={handleNumberChange}
                          required
                          className={`
                            w-full px-4 py-3 border-2 rounded-lg appearance-none transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                            ${errors.bedrooms 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                            }
                          `}
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>
                              {num === 0 ? 'Studio' : `${num} ${num === 1 ? 'Bedroom' : 'Bedrooms'}`}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Bathrooms */}
                    <div>
                      <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-2">
                        Bathrooms
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="bathrooms"
                          name="bathrooms"
                          value={formData.bathrooms}
                          onChange={handleNumberChange}
                          required
                          className={`
                            w-full px-4 py-3 border-2 rounded-lg appearance-none transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                            ${errors.bathrooms 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                            }
                          `}
                        >
                          {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(num => (
                            <option key={num} value={num}>
                              {num} {num === 1 ? 'Bathroom' : 'Bathrooms'}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Area */}
                    <div>
                      <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                        Area (m²)
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        id="area"
                        name="area"
                        value={formData.area}
                        onChange={handleNumberChange}
                        required
                        className={`
                          w-full px-4 py-3 border-2 rounded-lg transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                          ${errors.area 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                          }
                        `}
                        placeholder="e.g., 75"
                      />
                    </div>
                  </div>
                </div>

                {/* Furnished Toggle */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center">
                      <div className="mr-4">
                        <span className="text-2xl">🛋️</span>
                      </div>
                      <div>
                        <span className="block text-base font-medium text-gray-900">
                          Furnished Property
                        </span>
                        <span className="block text-sm text-gray-600">
                          Does your property come with furniture?
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="isFurnished"
                        name="isFurnished"
                        checked={formData.isFurnished}
                        onChange={handleFieldChange}
                        className="sr-only"
                      />
                      <div className={`
                        w-14 h-8 rounded-full transition-colors duration-300
                        ${formData.isFurnished ? 'bg-green-500' : 'bg-gray-300'}
                      `}>
                        <div className={`
                          w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300
                          ${formData.isFurnished ? 'translate-x-7' : 'translate-x-1'}
                          absolute top-1
                        `} />
                      </div>
                    </div>
                  </label>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <SparklesIcon className="h-5 w-5 mr-2 text-yellow-500" />
                    Amenities
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select all the amenities your property offers
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AMENITIES_LIST.map((amenity) => (
                      <label
                        key={amenity}
                        className={`
                          relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                          ${formData.amenities.includes(amenity)
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          id={`amenity-${amenity}`}
                          name={`amenity-${amenity}`}
                          checked={formData.amenities.includes(amenity)}
                          onChange={handleFieldChange}
                          className="sr-only"
                        />
                        <span className="text-xl mr-2">
                          {AMENITY_ICONS[amenity] || '✓'}
                        </span>
                        <span className={`text-sm ${
                          formData.amenities.includes(amenity) ? 'text-blue-700 font-medium' : 'text-gray-700'
                        }`}>
                          {amenity}
                        </span>
                        {formData.amenities.includes(amenity) && (
                          <CheckIcon className="absolute top-2 right-2 h-4 w-4 text-blue-600" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Pricing and Availability */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                {/* Pricing Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Pricing Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Monthly Rent */}
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Rent (MXN)
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          $
                        </div>
                        <input
                          type="text"
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={handleNumberChange}
                          required
                          className={`
                            w-full pl-8 pr-4 py-3 border-2 rounded-lg transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                            ${errors.price 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300 focus:border-purple-500'
                            }
                          `}
                          placeholder="8,500"
                        />
                      </div>
                      {formData.price && (
                        <p className="mt-2 text-sm text-gray-600">
                          ≈ ${helpers.formatNumber(formData.price)} MXN/month
                        </p>
                      )}
                    </div>

                    {/* Security Deposit */}
                    <div>
                      <label htmlFor="deposit" className="block text-sm font-medium text-gray-700 mb-2">
                        Security Deposit (MXN)
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          $
                        </div>
                        <input
                          type="text"
                          id="deposit"
                          name="deposit"
                          value={formData.deposit}
                          onChange={handleNumberChange}
                          required
                          className={`
                            w-full pl-8 pr-4 py-3 border-2 rounded-lg transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                            ${errors.deposit 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300 focus:border-purple-500'
                            }
                          `}
                          placeholder="8,500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Frequency */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Frequency
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {PAYMENT_FREQUENCIES.map((freq) => (
                        <label
                          key={freq.value}
                          className={`
                            relative flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                            ${formData.paymentFrequency === freq.value
                              ? 'border-purple-500 bg-purple-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="paymentFrequency"
                            value={freq.value}
                            checked={formData.paymentFrequency === freq.value}
                            onChange={handleFieldChange}
                            className="sr-only"
                          />
                          <span className={`text-sm font-medium ${
                            formData.paymentFrequency === freq.value ? 'text-purple-700' : 'text-gray-700'
                          }`}>
                            {freq.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Included Utilities */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Included Utilities
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Which utilities are included in the rent?
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {UTILITIES_LIST.map((utility) => (
                      <label
                        key={utility}
                        className={`
                          relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                          ${formData.includedUtilities.includes(utility)
                            ? 'border-green-500 bg-green-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          id={`utility-${utility}`}
                          name={`utility-${utility}`}
                          checked={formData.includedUtilities.includes(utility)}
                          onChange={handleFieldChange}
                          className="sr-only"
                        />
                        <span className={`text-sm ${
                          formData.includedUtilities.includes(utility) ? 'text-green-700 font-medium' : 'text-gray-700'
                        }`}>
                          {utility}
                        </span>
                        {formData.includedUtilities.includes(utility) && (
                          <CheckIcon className="absolute top-2 right-2 h-4 w-4 text-green-600" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-orange-600" />
                    Availability & Terms
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Available From */}
                    <div>
                      <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 mb-2">
                        Available From
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="date"
                        id="availableFrom"
                        name="availableFrom"
                        value={formData.availableFrom}
                        onChange={handleFieldChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className={`
                          w-full px-4 py-3 border-2 rounded-lg transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                          ${errors.availableFrom 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-200 hover:border-gray-300 focus:border-orange-500'
                          }
                        `}
                      />
                    </div>

                    {/* Minimum Stay */}
                    <div>
                      <label htmlFor="minimumStay" className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Stay (months)
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        id="minimumStay"
                        name="minimumStay"
                        value={formData.minimumStay}
                        onChange={handleNumberChange}
                        required
                        className="w-full px-4 py-3 border-2 rounded-lg appearance-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 border-gray-200 hover:border-gray-300 focus:border-orange-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 9, 12, 18, 24, 36].map(num => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? 'month' : 'months'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Maximum Stay */}
                    <div>
                      <label htmlFor="maximumStay" className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Stay (optional)
                      </label>
                      <input
                        type="text"
                        id="maximumStay"
                        name="maximumStay"
                        value={formData.maximumStay}
                        onChange={handleNumberChange}
                        className="w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 border-gray-200 hover:border-gray-300 focus:border-orange-500"
                        placeholder="No limit"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <PhotoIcon className="h-5 w-5 mr-2 text-orange-600" />
                    Property Photos
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Good photos increase bookings by up to 40%! Add up to 10 high-quality images.
                  </p>

                  {/* Upload Area */}
                  <div className="relative">
                    <input
                      id="images"
                      name="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="images"
                      className="block w-full p-8 border-3 border-dashed border-gray-300 rounded-2xl cursor-pointer transition-all duration-300 hover:border-orange-400 hover:bg-orange-50 group"
                    >
                      <div className="text-center">
                        <div className="mx-auto h-16 w-16 text-gray-400 group-hover:text-orange-500 transition-colors">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="mt-4 text-lg font-medium text-gray-700 group-hover:text-orange-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          PNG, JPG, GIF up to 10MB each
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Image Preview Grid */}
                  {images.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700">
                          Uploaded Images ({images.length}/10)
                        </h4>
                        <p className="text-xs text-gray-500">
                          Drag to reorder • First image will be the main photo
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image: File, index: number) => (
                          <div
                            key={index}
                            className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                          >
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Property image ${index + 1}`}
                              className="h-32 w-full object-cover"
                            />
                            {index === 0 && (
                              <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                Main Photo
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-white text-xs">
                                {(image.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photo Tips */}
                  <div className="mt-6 bg-orange-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-orange-900 mb-2">
                      📸 Photo Tips for Success
                    </h4>
                    <ul className="text-xs text-orange-800 space-y-1">
                      <li>• Use natural lighting for bright, welcoming photos</li>
                      <li>• Include photos of all rooms and common areas</li>
                      <li>• Show the view from windows if it's attractive</li>
                      <li>• Keep rooms clean and tidy before photographing</li>
                      <li>• Highlight unique features that students will love</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 mr-2 text-teal-600" />
                    Review Your Listing
                  </h3>
                  <p className="text-sm text-gray-700">
                    Take a moment to review your property details. Everything look good?
                  </p>
                </div>

                {/* Property Preview Card */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                  {/* Image Gallery Preview */}
                  {images.length > 0 && (
                    <div className="relative h-64 bg-gray-100">
                      <img
                        src={URL.createObjectURL(images[0])}
                        alt={formData.title}
                        className="w-full h-full object-cover"
                      />
                      {images.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                          +{images.length - 1} photos
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6">
                    {/* Title and Type */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                          {formData.title}
                        </h2>
                        <p className="text-gray-600 flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {formData.address}
                        </p>
                      </div>
                      <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {helpers.capitalize(formData.propertyType)}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Monthly Rent</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {helpers.formatCurrency(Number(formData.price))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Deposit</p>
                          <p className="text-lg font-semibold text-gray-700">
                            {helpers.formatCurrency(Number(formData.deposit))}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Key Features */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl mb-1">🛏️</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formData.bedrooms} {formData.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl mb-1">🚿</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formData.bathrooms} {formData.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl mb-1">📐</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formData.area} m²
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {formData.description}
                      </p>
                    </div>

                    {/* Amenities & Utilities */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {formData.amenities.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.amenities.map((amenity: string) => (
                              <span
                                key={amenity}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                              >
                                {AMENITY_ICONS[amenity]} {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {formData.includedUtilities.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Included Utilities</h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.includedUtilities.map((utility: string) => (
                              <span
                                key={utility}
                                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium"
                              >
                                ✓ {utility}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Available from:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(formData.availableFrom).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Minimum stay:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {formData.minimumStay} {formData.minimumStay === 1 ? 'month' : 'months'}
                        </span>
                      </div>
                      {formData.isFurnished && (
                        <div className="col-span-2">
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                            🛋️ Fully Furnished
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div className="ml-3">
                      <h4 className="text-sm font-semibold text-yellow-800">
                        Important Notice
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your listing will be created as <strong>inactive</strong>. You can activate it from your dashboard to make it visible to students.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className={`
                  flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200
                  ${step === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back
              </button>

              <div className="flex items-center space-x-4">
                {step < 5 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Next Step
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(true)}
                    disabled={isSubmitting}
                    className="flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Submit Listing
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                Need Help?
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Our support team is here to help you create the perfect listing.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#" className="text-sm font-medium text-blue-700 hover:text-blue-800 underline">
                  View listing guide
                </a>
                <span className="text-blue-400">•</span>
                <a href="#" className="text-sm font-medium text-blue-700 hover:text-blue-800 underline">
                  Contact support
                </a>
                <span className="text-blue-400">•</span>
                <a href="#" className="text-sm font-medium text-blue-700 hover:text-blue-800 underline">
                  FAQ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-bounce-in">
            <div className="p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Ready to Submit?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Your property listing is complete and ready to go!
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-yellow-900 mb-1">
                  🔒 Your listing will start as inactive
                </h4>
                <p className="text-sm text-yellow-800">
                  After submission, activate it from your dashboard when you're ready for students to see it.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Review Again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmation(false);
                    submitForm();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Property'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}