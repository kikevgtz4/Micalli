// frontend/src/app/(main)/subleases/create/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import apiService from "@/lib/api";
import toast from "react-hot-toast";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Import step components
import StepType from "@/components/subleases/create/StepType";
import StepBasics from "@/components/subleases/create/StepBasics";
import StepDates from "@/components/subleases/create/StepDates";
import StepProperty from "@/components/subleases/create/StepProperty";
import StepRoommates from "@/components/subleases/create/StepRoommates";
import StepPricing from "@/components/subleases/create/StepPricing";
import StepPhotos from "@/components/subleases/create/StepPhotos";
import StepLegal from "@/components/subleases/create/StepLegal";
import StepReview from "@/components/subleases/create/StepReview";

import type { SubleaseFormData, UrgencyLevel } from "@/types/sublease";
import { MAX_SUBLEASES_PER_USER, calculateDurationMonths } from "@/types/sublease";

// Step configuration
const STEPS = [
  { id: 1, name: "Tipo", component: StepType },
  { id: 2, name: "Información", component: StepBasics },
  { id: 3, name: "Fechas", component: StepDates },
  { id: 4, name: "Propiedad", component: StepProperty },
  { id: 5, name: "Compañeros", component: StepRoommates, conditional: true },
  { id: 6, name: "Precio", component: StepPricing },
  { id: 7, name: "Fotos", component: StepPhotos },
  { id: 8, name: "Legal", component: StepLegal },
  { id: 9, name: "Revisar", component: StepReview },
];

export default function CreateSubleasePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasExistingSublease, setHasExistingSublease] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<SubleaseFormData>({
    // Step 1: Type
    listingType: '',
    subleaseType: '',
    
    // Step 2: Basics
    title: '',
    description: '',
    additionalInfo: '',
    
    // Step 3: Dates
    startDate: '',
    endDate: '',
    isFlexible: false,
    flexibilityRangeDays: 7,
    availableImmediately: false,
    urgencyLevel: '',
    
    // Step 4: Property - ADD THE NEW FIELDS HERE
    propertyType: '',
    address: '',
    latitude: undefined,  // ADD THIS
    longitude: undefined, // ADD THIS  
    displayNeighborhood: '', // ADD THIS
    displayArea: '', // ADD THIS
    bedrooms: 1,
    bathrooms: 1,
    totalArea: undefined,
    furnished: false,
    amenities: [],
    petFriendly: false,
    smokingAllowed: false,
    
    // Step 5: Roommates (conditional)
    totalRoommates: undefined,
    currentRoommates: undefined,
    roommateGenders: '',
    roommateDescription: '',
    sharedSpaces: [],
    
    // Step 6: Pricing
    originalRent: 0,
    subleaseRent: 0,
    depositRequired: false,
    depositAmount: 0,
    utilitiesIncluded: [],
    additionalFees: {},
    
    // Step 7: Photos
    images: [],
    
    // Step 8: Legal
    landlordConsentStatus: '',
    landlordConsentDocument: undefined,
    leaseTransferAllowed: false,
    subleaseAgreementRequired: false,
    disclaimersAccepted: false,
    });

  // Check if user already has a sublease
  useEffect(() => {
    const checkExistingSublease = async () => {
      if (!isAuthenticated || user?.userType !== 'student') {
        router.push('/roommates');
        return;
      }

      try {
        const response = await apiService.subleases.getMySubleases();
        const activeSubleases = response.data.results.filter(
          s => s.status === 'active' || s.status === 'pending'
        );
        
        if (activeSubleases.length >= MAX_SUBLEASES_PER_USER) {
          setHasExistingSublease(true);
          toast.error("Ya tienes un subarriendo activo. Solo puedes tener uno a la vez.");
          router.push('/profile');
        }
      } catch (error) {
        console.error("Error checking existing subleases:", error);
      }
    };

    checkExistingSublease();
  }, [isAuthenticated, user, router]);

  // Calculate urgency level based on start date
  useEffect(() => {
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let urgencyLevel: UrgencyLevel = 'low';
      if (daysUntilStart <= 7) {
        urgencyLevel = 'urgent';
      } else if (daysUntilStart <= 14) {
        urgencyLevel = 'high';
      } else if (daysUntilStart <= 30) {
        urgencyLevel = 'medium';
      }
      
      handleFieldChange('urgencyLevel', urgencyLevel);
    }
  }, [formData.startDate]);

  // Determine if roommate step should be shown
  const shouldShowRoommateStep = () => {
    return formData.subleaseType === 'shared_room' || formData.subleaseType === 'private_room';
  };

  // Get active steps (filtering out conditional ones)
  const getActiveSteps = () => {
    return STEPS.filter(step => {
      if (step.id === 5) { // Roommates step
        return shouldShowRoommateStep();
      }
      return true;
    });
  };

  // Update form field
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate current step
  const validateStep = (stepId: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (stepId) {
      case 1: // Type
        if (!formData.listingType) newErrors.listingType = "Selecciona un tipo de listado";
        if (!formData.subleaseType) newErrors.subleaseType = "Selecciona un tipo de subarriendo";
        break;
        
      case 2: // Basics
        if (!formData.title || formData.title.length < 10) {
          newErrors.title = "El título debe tener al menos 10 caracteres";
        }
        if (!formData.description || formData.description.length < 50) {
          newErrors.description = "La descripción debe tener al menos 50 caracteres";
        }
        break;
        
      case 3: // Dates
        if (!formData.startDate) newErrors.startDate = "Fecha de inicio requerida";
        if (!formData.endDate) newErrors.endDate = "Fecha de fin requerida";
        if (formData.startDate && formData.endDate) {
          const start = new Date(formData.startDate);
          const end = new Date(formData.endDate);
          if (end <= start) {
            newErrors.endDate = "La fecha de fin debe ser posterior a la de inicio";
          }
          const duration = calculateDurationMonths(formData.startDate, formData.endDate);
          if (duration > 12) {
            newErrors.endDate = "La duración máxima es de 12 meses";
          }
        }
        break;
        
      case 4: // Property
        if (!formData.propertyType) newErrors.propertyType = "Tipo de propiedad requerido";
        if (!formData.address) newErrors.address = "Dirección requerida";
        if (!formData.bedrooms || formData.bedrooms < 1) {
          newErrors.bedrooms = "Número de habitaciones inválido";
        }
        if (!formData.bathrooms || formData.bathrooms < 1) {
          newErrors.bathrooms = "Número de baños inválido";
        }
        break;
        
      case 5: // Roommates (conditional)
        if (shouldShowRoommateStep()) {
          if (!formData.totalRoommates || formData.totalRoommates < 1) {
            newErrors.totalRoommates = "Número total de compañeros requerido";
          }
          if (formData.currentRoommates === undefined || formData.currentRoommates < 0) {
            newErrors.currentRoommates = "Número actual de compañeros requerido";
          }
          if (formData.subleaseType === 'shared_room' && !formData.roommateDescription) {
            newErrors.roommateDescription = "Descripción del compañero de cuarto requerida para cuartos compartidos";
          }
        }
        break;
        
      case 6: // Pricing
        if (!formData.originalRent || formData.originalRent <= 0) {
          newErrors.originalRent = "Renta original requerida";
        }
        if (!formData.subleaseRent || formData.subleaseRent <= 0) {
          newErrors.subleaseRent = "Renta del subarriendo requerida";
        }
        if (formData.depositRequired && (!formData.depositAmount || formData.depositAmount <= 0)) {
          newErrors.depositAmount = "Monto del depósito requerido";
        }
        break;
        
      case 7: // Photos
        if (!formData.images || formData.images.length < 3) {
          newErrors.images = "Se requieren al menos 3 fotos";
        }
        if (formData.images && formData.images.length > 7) {
          newErrors.images = "Máximo 7 fotos permitidas";
        }
        break;
        
      case 8: // Legal
        if (!formData.landlordConsentStatus) {
          newErrors.landlordConsentStatus = "Estado del consentimiento requerido";
        }
        if (!formData.disclaimersAccepted) {
          newErrors.disclaimersAccepted = "Debes aceptar los términos y condiciones";
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      const activeSteps = getActiveSteps();
      const currentIndex = activeSteps.findIndex(s => s.id === currentStep);
      if (currentIndex < activeSteps.length - 1) {
        setCurrentStep(activeSteps[currentIndex + 1].id);
      }
    } else {
      toast.error("Por favor completa todos los campos requeridos");
    }
  };

  const handlePrevious = () => {
    const activeSteps = getActiveSteps();
    const currentIndex = activeSteps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(activeSteps[currentIndex - 1].id);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Only allow going back to previous steps
    const activeSteps = getActiveSteps();
    const targetIndex = activeSteps.findIndex(s => s.id === stepId);
    const currentIndex = activeSteps.findIndex(s => s.id === currentStep);
    
    if (targetIndex < currentIndex) {
      setCurrentStep(stepId);
    } else if (targetIndex > currentIndex) {
      // Validate all steps up to target
      let canProceed = true;
      for (let i = currentIndex; i < targetIndex; i++) {
        if (!validateStep(activeSteps[i].id)) {
          canProceed = false;
          break;
        }
      }
      if (canProceed) {
        setCurrentStep(stepId);
      } else {
        toast.error("Completa los pasos anteriores primero");
      }
    }
  };

  // Submit form
  const handleSubmit = async () => {
  if (!validateStep(currentStep)) {
    toast.error("Por favor completa todos los campos requeridos");
    return;
  }

  setIsSubmitting(true);
  
  try {
    // Extract neighborhood and area from address if not already set
    const addressParts = formData.address.split(',').map(part => part.trim());
    
    // Prepare form data for submission
    const submitData: any = {
      ...formData,
      // Remove images from main data (uploaded separately)
      images: undefined,
      landlordConsentDocument: undefined,
      
      // Add location fields with proper extraction
      displayNeighborhood: formData.displayNeighborhood || addressParts[1] || addressParts[0] || 'Sin especificar',
      displayArea: formData.displayArea || (addressParts.length > 2 ? addressParts[2] : addressParts[1]) || 'Sin especificar',
      city: addressParts[addressParts.length - 3] || 'Monterrey',
      state: addressParts[addressParts.length - 2] || 'Nuevo León',
      
      // Include coordinates if available
      latitude: formData.latitude ? parseFloat(formData.latitude).toFixed(6) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude).toFixed(6) : null,
      
      // Fix roommate genders - use default if empty
      roommateGenders: formData.roommateGenders || 'prefer_not_say',
      
      // Ensure status is set
      status: 'active',
    };

    // Remove empty string values that should be null
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === '') {
        if (['roommateGenders', 'propertyType', 'listingType', 'subleaseType', 'landlordConsentStatus'].includes(key)) {
          delete submitData[key];
        }
      }
    });

    // Create sublease
    const response = await apiService.subleases.create(submitData);
    const subleaseId = response.data.id;

    // Upload images if any
    if (formData.images && formData.images.length > 0) {
      const imageFormData = new FormData();
      formData.images.forEach((file, index) => {
        imageFormData.append('images', file);
        if (index === 0) {
          imageFormData.append('is_main', 'true');
        }
      });

      await apiService.subleases.uploadImages(subleaseId, imageFormData);
    }

    toast.success("¡Subarriendo publicado exitosamente!");
    router.push(`/subleases/${subleaseId}`);
  } catch (error: any) {
    console.error("Error creating sublease:", error);
    
    if (error.response?.data) {
      const backendErrors = error.response.data;
      console.error("Backend validation errors:", backendErrors);
      
      if (typeof backendErrors === 'object') {
        setErrors(backendErrors);
        
        const firstError = Object.values(backendErrors)[0];
        if (Array.isArray(firstError)) {
          toast.error(firstError[0] as string);
        } else {
          toast.error("Por favor corrige los errores en el formulario");
        }
      } else {
        toast.error(backendErrors.detail || "Error al crear el subarriendo");
      }
    } else {
      toast.error("Error al crear el subarriendo. Intenta de nuevo.");
    }
  } finally {
    setIsSubmitting(false);
  }
};

  // Get current step component
  const getCurrentStepComponent = () => {
    const step = STEPS.find(s => s.id === currentStep);
    if (!step) return null;
    
    const StepComponent = step.component;
    return (
      <StepComponent
        data={formData}
        onChange={handleFieldChange}
        errors={errors}
      />
    );
  };

  const activeSteps = getActiveSteps();
  const currentStepIndex = activeSteps.findIndex(s => s.id === currentStep);
  const isLastStep = currentStepIndex === activeSteps.length - 1;

  if (hasExistingSublease) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XMarkIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Ya tienes un subarriendo activo</h2>
            <p className="text-gray-600 mb-6">
              Solo puedes tener un subarriendo activo a la vez. 
              Administra tu subarriendo existente desde tu perfil.
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Ir a mi dashboard
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Publicar Subarriendo
              </h1>
              <button
                onClick={() => router.push('/roommates')}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="flex items-center justify-between">
                {activeSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex-1 flex flex-col items-center"
                  >
                    <button
                      onClick={() => handleStepClick(step.id)}
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                        step.id === currentStep
                          ? "bg-primary text-white"
                          : step.id < currentStep
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      } ${
                        step.id <= currentStep ? "cursor-pointer hover:scale-110" : "cursor-not-allowed"
                      }`}
                      disabled={step.id > currentStep}
                    >
                      {step.id < currentStep ? (
                        <CheckIcon className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </button>
                    <span className={`mt-2 text-xs font-medium ${
                      step.id === currentStep ? "text-primary" : "text-gray-500"
                    }`}>
                      {step.name}
                    </span>
                    
                    {/* Progress line */}
                    {index < activeSteps.length - 1 && (
                      <div
                        className={`absolute top-5 left-[50%] w-full h-0.5 ${
                          step.id < currentStep ? "bg-green-500" : "bg-gray-200"
                        }`}
                        style={{ transform: 'translateX(50%)' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
            {getCurrentStepComponent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                currentStepIndex === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Anterior
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  // Save draft functionality could go here
                  toast.success("Borrador guardado");
                }}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Guardar Borrador
              </button>

              {isLastStep ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Publicando...
                    </>
                  ) : (
                    <>
                      Publicar Subarriendo
                      <CheckIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-all"
                >
                  Siguiente
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}