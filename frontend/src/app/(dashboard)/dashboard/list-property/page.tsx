"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
    setFieldValue,
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
      router.push(`/properties/${response.data.id}?created=success`);
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

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">List Your Property</h1>
        <p className="mt-2 text-gray-600">
          Complete the form below to list your property for students.
        </p>
      </div>

      {/* Steps Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between">
          {["Basic Info", "Details", "Pricing", "Images", "Review"].map(
            (stepLabel, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step > index + 1
                      ? "bg-green-500 text-white"
                      : step === index + 1
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {step > index + 1 ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="mt-2 text-sm text-gray-600">{stepLabel}</span>
              </div>
            )
          )}
        </div>
        <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errors.submit && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Image upload issues:</p>
              <ul className="list-disc list-inside text-sm text-yellow-600 mt-1">
                {uploadErrors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <form onSubmit={(e) => e.preventDefault()}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Basic Information
              </h2>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Property Title*
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleFieldChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.title ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="e.g., Modern Apartment near Tec de Monterrey"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description*
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleFieldChange}
                    required
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.description ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Describe your property, including key features and advantages for students"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="propertyType"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Property Type*
                  </label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleFieldChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Address*
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleFieldChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.address ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Street, Number, Neighborhood, City"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="latitude"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                    <label
                      htmlFor="longitude"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Property Details
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="bedrooms"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.bedrooms ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors.bedrooms && (
                      <p className="mt-1 text-sm text-red-600">{errors.bedrooms}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="bathrooms"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.bathrooms ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors.bathrooms && (
                      <p className="mt-1 text-sm text-red-600">{errors.bathrooms}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="area"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Area (m²)*
                    </label>
                    <input
                      type="text"
                      id="area"
                      name="area"
                      value={formData.area}
                      onChange={handleNumberChange}
                      required
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.area ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="e.g., 75"
                    />
                    {errors.area && (
                      <p className="mt-1 text-sm text-red-600">{errors.area}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFurnished"
                      name="isFurnished"
                      checked={formData.isFurnished}
                      onChange={handleFieldChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isFurnished"
                      className="ml-2 block text-sm font-medium text-gray-700"
                    >
                      Furnished
                    </label>
                  </div>
                </div>

                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {AMENITIES_LIST.map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`amenity-${amenity}`}
                          name={`amenity-${amenity}`}
                          checked={formData.amenities.includes(amenity)}
                          onChange={handleFieldChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`amenity-${amenity}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
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
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Pricing & Availability
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                        className={`w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.price ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="e.g., 8500"
                      />
                    </div>
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="deposit"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                        className={`w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.deposit ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="e.g., 8500"
                      />
                    </div>
                    {errors.deposit && (
                      <p className="mt-1 text-sm text-red-600">{errors.deposit}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="paymentFrequency"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Payment Frequency
                  </label>
                  <select
                    id="paymentFrequency"
                    name="paymentFrequency"
                    value={formData.paymentFrequency}
                    onChange={handleFieldChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {PAYMENT_FREQUENCIES.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-2">
                    Included Utilities
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {UTILITIES_LIST.map((utility) => (
                      <div key={utility} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`utility-${utility}`}
                          name={`utility-${utility}`}
                          checked={formData.includedUtilities.includes(utility)}
                          onChange={handleFieldChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`utility-${utility}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {utility}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="availableFrom"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Available From*
                  </label>
                  <input
                    type="date"
                    id="availableFrom"
                    name="availableFrom"
                    value={formData.availableFrom}
                    onChange={handleFieldChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.availableFrom ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors.availableFrom && (
                    <p className="mt-1 text-sm text-red-600">{errors.availableFrom}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="minimumStay"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.minimumStay ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors.minimumStay && (
                      <p className="mt-1 text-sm text-red-600">{errors.minimumStay}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="maximumStay"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Property Images
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Photos
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

                {images.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Uploaded Images ({images.length}):
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((image: File, index: number) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Property image ${index + 1}`}
                            className="h-24 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
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
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Review Your Listing
              </h2>

              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                {images.length > 0 && (
                  <div className="mb-6 overflow-hidden rounded-lg">
                    <div className="relative h-64 w-full">
                      <img
                        src={URL.createObjectURL(images[0])}
                        alt={formData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {formData.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{formData.address}</p>

                  <div className="flex justify-between items-center mb-6">
                    <div className="bg-indigo-50 text-indigo-800 px-4 py-2 rounded-md text-xl font-bold">
                      {helpers.formatCurrency(Number(formData.price))}
                      <span className="text-sm font-normal ml-1">/ month</span>
                    </div>
                    <div className="text-gray-700">
                      <span className="font-medium">
                        {helpers.capitalize(formData.propertyType)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      <span>
                        {formData.bedrooms}{" "}
                        {formData.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                        />
                      </svg>
                      <span>
                        {formData.bathrooms}{" "}
                        {formData.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                        />
                      </svg>
                      <span>{formData.area} m²</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-700">{formData.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.amenities.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Amenities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.amenities.map((amenity: string) => (
                          <span
                            key={amenity}
                            className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.includedUtilities.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Included Utilities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.includedUtilities.map((utility: string) => (
                          <span
                            key={utility}
                            className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                          >
                            {utility}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Your listing will be created as inactive. You can activate it
                      from your dashboard to make it visible to students.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmation && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Confirm Submission
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to submit this property listing?
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> Your property will be created as
                    inactive. After submission, you can activate it from your
                    dashboard to make it visible to students.
                  </p>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowConfirmation(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmation(false);
                      submitForm();
                    }}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Property"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
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
                type="button"
                onClick={() => setShowConfirmation(true)}
                disabled={isSubmitting}
                className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Listing"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}