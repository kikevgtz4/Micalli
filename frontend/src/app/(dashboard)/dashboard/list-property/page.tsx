"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/lib/api";

export default function ListPropertyPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formData, setFormData] = useState({
    // Basic Info
    title: "",
    description: "",
    propertyType: "apartment",

    // Location
    address: "",
    latitude: "",
    longitude: "",

    // Details
    bedrooms: 1,
    bathrooms: 1,
    area: "",
    isFurnished: false,
    amenities: [] as string[],

    // Pricing
    price: "",
    deposit: "",
    paymentFrequency: "monthly",
    includedUtilities: [] as string[],

    // Availability
    availableFrom: "",
    minimumStay: 1,
    maximumStay: "",

    // Images
    images: [] as File[],
  });

  const amenitiesList = [
    "WiFi",
    "Air Conditioning",
    "Heating",
    "Washing Machine",
    "Dryer",
    "Kitchen",
    "Refrigerator",
    "Microwave",
    "Dishwasher",
    "TV",
    "Cable TV",
    "Parking",
    "Gym",
    "Swimming Pool",
    "Security System",
    "Elevator",
    "Balcony",
    "Patio",
    "Garden",
    "Study Room",
  ];

  const utilitiesList = [
    "Electricity",
    "Water",
    "Gas",
    "Internet",
    "Cable TV",
    "Trash Collection",
  ];

  // Check if the user is authenticated and a property owner
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/dashboard/list-property");
    } else if (user?.userType !== "property_owner") {
      setError("Only property owners can create listings.");
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      const { checked } = checkbox;

      if (name === "isFurnished") {
        setFormData({ ...formData, [name]: checked });
      } else if (name.startsWith("amenity-")) {
        const amenity = name.replace("amenity-", "");
        setFormData({
          ...formData,
          amenities: checked
            ? [...formData.amenities, amenity]
            : formData.amenities.filter((a) => a !== amenity),
        });
      } else if (name.startsWith("utility-")) {
        const utility = name.replace("utility-", "");
        setFormData({
          ...formData,
          includedUtilities: checked
            ? [...formData.includedUtilities, utility]
            : formData.includedUtilities.filter((u) => u !== utility),
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === "" || !isNaN(Number(value))) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({
        ...formData,
        images: [...formData.images, ...Array.from(e.target.files)],
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields first
      if (
        !formData.title ||
        !formData.description ||
        !formData.address ||
        !formData.bedrooms ||
        !formData.bathrooms ||
        !formData.area ||
        !formData.price ||
        !formData.deposit ||
        !formData.availableFrom
      ) {
        setError("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      // Create FormData object for property submission
      const propertyData = new FormData();

      // Basic info - string fields are straightforward
      propertyData.append("title", formData.title);
      propertyData.append("description", formData.description);
      propertyData.append("property_type", formData.propertyType);
      propertyData.append("address", formData.address);

      // Numeric fields - ensure they're valid numbers
      if (formData.latitude)
        propertyData.append("latitude", formData.latitude.toString());
      if (formData.longitude)
        propertyData.append("longitude", formData.longitude.toString());

      // Make sure numeric fields are formatted correctly
      propertyData.append(
        "bedrooms",
        parseInt(formData.bedrooms.toString()).toString()
      );
      propertyData.append(
        "bathrooms",
        parseFloat(formData.bathrooms.toString()).toString()
      );
      propertyData.append(
        "total_area",
        parseFloat(formData.area.toString()).toString()
      );

      // Boolean values
      propertyData.append("furnished", formData.isFurnished ? "true" : "false");

      // Array fields - Django expects JSON strings for ArrayFields
      propertyData.append("amenities", JSON.stringify(formData.amenities));
      propertyData.append(
        "included_utilities",
        JSON.stringify(formData.includedUtilities)
      );
      propertyData.append("rules", JSON.stringify([])); // Empty array for rules (not in form)

      // Pricing - ensure valid numbers
      propertyData.append(
        "rent_amount",
        parseFloat(formData.price.toString()).toString()
      );
      propertyData.append(
        "deposit_amount",
        parseFloat(formData.deposit.toString()).toString()
      );
      propertyData.append("payment_frequency", formData.paymentFrequency);

      // Date field - format as YYYY-MM-DD for Django
      // Make sure the date is in ISO format
      const availableDate = new Date(formData.availableFrom);
      const formattedDate = availableDate.toISOString().split("T")[0];
      propertyData.append("available_from", formattedDate);

      // Stay duration
      propertyData.append(
        "minimum_stay",
        parseInt(formData.minimumStay.toString()).toString()
      );
      if (formData.maximumStay) {
        propertyData.append(
          "maximum_stay",
          parseInt(formData.maximumStay.toString()).toString()
        );
      }

      // Debug: Log the data being sent
      console.log("Submitting property data:");
      for (const [key, value] of propertyData.entries()) {
        console.log(`${key}: ${value}`);
      }

      // Make the API call
      const response = await apiService.properties.create(propertyData);
      console.log("API Response:", response);

      // Handle image uploads if there are any
      if (formData.images.length > 0 && response.data && response.data.id) {
        try {
          console.log(
            `Uploading ${formData.images.length} images for property ${response.data.id}`
          );

          const imagesFormData = new FormData();

          // Add each image to the form data
          formData.images.forEach((image, index) => {
            console.log(`Adding image ${index + 1}: ${image.name}`);
            imagesFormData.append("images", image);
          });

          // Log the URL we're posting to
          console.log(`POST URL: /api/properties/${response.data.id}/images/`);

          const imageResponse = await apiService.properties.uploadImages(
            response.data.id,
            imagesFormData
          );
          console.log("Image upload response:", imageResponse);
        } catch (imgError: any) {
          console.error("Error uploading images:", imgError);

          // Show error but continue since the property was created
          const errorMessage =
            imgError.message || "Unknown error uploading images";
          setError(
            `Property was created but there was an issue uploading images: ${errorMessage}`
          );

          // Continue to the property page despite image upload error
          setTimeout(() => {
            router.push(
              `/properties/${response.data.id}?created=success&images=failed`
            );
          }, 3000);
          return;
        }
      }

      // Redirect to the property page on success
      router.push(`/properties/${response.data.id}?created=success`);
    } catch (error: any) {
      console.error("Error submitting property:", error);

      // Enhanced error handling
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);

        // Try to extract and format validation errors
        if (error.response.data) {
          if (typeof error.response.data === "object") {
            // Format field errors for display
            const errorMessages = Object.entries(error.response.data)
              .map(([field, errors]) => {
                if (Array.isArray(errors)) {
                  return `${field}: ${errors.join(" ")}`;
                } else if (typeof errors === "string") {
                  return `${field}: ${errors}`;
                } else {
                  return `${field}: Invalid value`;
                }
              })
              .join("\n");

            setError(
              errorMessages ||
                "Failed to create property listing. Please check the form for errors."
            );
          } else if (typeof error.response.data === "string") {
            setError(error.response.data);
          } else {
            setError("Failed to create property listing. Please try again.");
          }
        } else {
          setError(`Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError("Network error. Please check your connection and try again.");
      } else {
        // Something else happened
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">List Your Property</h1>
        <p className="mt-2 text-gray-600">
          Complete the form below to list your property for students.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Steps */}
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
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-gray-300" />
          </div>
        </div>
      </div>

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
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Modern Apartment near Tec de Monterrey"
                  />
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
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe your property, including key features and advantages for students"
                  />
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
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Street, Number, Neighborhood, City"
                  />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
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
                    {amenitiesList.map((amenity) => (
                      <div key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`amenity-${amenity}`}
                          name={`amenity-${amenity}`}
                          checked={formData.amenities.includes(amenity)}
                          onChange={handleChange}
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
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., 8500"
                      />
                    </div>
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
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., 8500"
                      />
                    </div>
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
                  <p className="block text-sm font-medium text-gray-700 mb-2">
                    Included Utilities
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {utilitiesList.map((utility) => (
                      <div key={utility} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`utility-${utility}`}
                          name={`utility-${utility}`}
                          checked={formData.includedUtilities.includes(utility)}
                          onChange={handleChange}
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
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
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
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Uploaded Images:
                    </h3>
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
                {formData.images.length > 0 && (
                  <div className="mb-6 overflow-hidden rounded-lg">
                    <div className="relative h-64 w-full">
                      <img
                        src={URL.createObjectURL(formData.images[0])}
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
                      ${parseFloat(formData.price.toString()).toLocaleString()}
                      <span className="text-sm font-normal ml-1">/ month</span>
                    </div>
                    <div className="text-gray-700">
                      <span className="font-medium">
                        {formData.propertyType.charAt(0).toUpperCase() +
                          formData.propertyType.slice(1)}
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
                        {formData.amenities.map((amenity) => (
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
                        {formData.includedUtilities.map((utility) => (
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
                      Your listing will be reviewed by our team before becoming
                      visible to students. This usually takes 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      handleSubmit();
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
                  >
                    Submit Property
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
                onClick={() => {
                  // ONLY changes the step, nothing else
                  setStep(step + 1);
                  window.scrollTo(0, 0);
                }}
                className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Next
              </button>
            ) : (
              <button
                type="button" // Change to type="button" instead of "submit"
                onClick={() => setShowConfirmation(true)} // Only show confirmation
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
