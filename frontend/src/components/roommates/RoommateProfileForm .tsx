// frontend/src/components/roommates/RoommateProfileForm.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/lib/api";
import { toast } from "react-hot-toast";
import { RoommateProfileFormData } from "@/types/roommates";
import {
  calculateProfileCompletion,
  convertProfileToFormData,
} from "@/utils/profileCompletion";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

// Import all step components
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { LifestyleStep } from "./steps/LifestyleStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { SocialStep } from "./steps/SocialStep";
import { RoommatePreferencesStep } from "./steps/RoommatePreferencesStep";

interface RoommateProfileFormProps {
  initialData?: Partial<RoommateProfileFormData>;
  onComplete?: () => void;
  onSkip?: () => void;
  isEditing?: boolean;
  profileId?: number;
}

const STEPS = [
  {
    id: "basic",
    title: "Basic Info",
    subtitle: "Tell us about yourself",
    icon: "👤",
    color: "from-blue-500 to-blue-600",
    component: BasicInfoStep,
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    subtitle: "Your daily habits",
    icon: "🏠",
    color: "from-purple-500 to-purple-600",
    component: LifestyleStep,
  },
  {
    id: "preferences",
    title: "Preferences",
    subtitle: "Living preferences",
    icon: "⚙️",
    color: "from-green-500 to-green-600",
    component: PreferencesStep,
  },
  {
    id: "social",
    title: "Social",
    subtitle: "Interests & activities",
    icon: "🎯",
    color: "from-orange-500 to-orange-600",
    component: SocialStep,
  },
  {
    id: "roommate",
    title: "Ideal Roommate",
    subtitle: "Who you're looking for",
    icon: "🤝",
    color: "from-pink-500 to-pink-600",
    component: RoommatePreferencesStep,
  },
];

export default function RoommateProfileForm({
  initialData,
  onComplete,
  onSkip,
  isEditing = false,
  profileId,
}: RoommateProfileFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  // frontend/src/components/roommates/RoommateProfileForm.tsx
  const [formData, setFormData] = useState<Partial<RoommateProfileFormData>>(
    () => {
      // Base data with defaults
      const baseData: Partial<RoommateProfileFormData> = {
        petFriendly: false,
        smokingAllowed: false,
        preferredRoommateCount: 1,
        hobbies: [],
        socialActivities: [],
        dietaryRestrictions: [],
        languages: [],
      };

      // If we have initialData, merge it with base data
      if (initialData) {
        return { ...baseData, ...initialData };
      }

      // For new profiles, sync from user if available
      const syncedData: Partial<RoommateProfileFormData> = {};

      if (user && user.userType === "student") {
        if (user.program) {
          syncedData.program = user.program;
        }
        if (user.university?.id) {
          syncedData.university = user.university.id;
        }
        if (user.graduationYear) {
          const currentYear = new Date().getFullYear();
          const studyYear = user.graduationYear - currentYear + 1;
          if (studyYear >= 1 && studyYear <= 5) {
            syncedData.graduationYear = studyYear;
          }
        }
      }
      // Always return a valid object
      return { ...baseData, ...syncedData };
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedSteps, setTouchedSteps] = useState<Set<number>>(new Set());
  const [backendCompletion, setBackendCompletion] = useState<number | null>(null);

  const calculateCompletion = (
    data?: Partial<RoommateProfileFormData>
  ): number => {
    return calculateProfileCompletion(data || formData);
  };

  const CurrentStepComponent = STEPS[currentStep].component;
  const currentStepData = STEPS[currentStep];

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  useEffect(() => {
    if (user && !user.university) {
      console.warn(
        "User profile does not have a university set. Please update your profile."
      );
    }
  }, [user]);

  // Debug helper
  useEffect(() => {
    console.log("Current form data state:", formData);
  }, [formData]);

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation logic remains the same...
    switch (currentStep) {
    case 0: // Basic Info
      // University validation - must be a number (ID), not just text
      if (!formData.university && !user?.university?.id) {
        newErrors.university = "Please select your university from the dropdown";
      }

      if (!formData.sleepSchedule) {
        newErrors.sleepSchedule = "Please select your sleep schedule";
      }
      // Fix: use 'program' instead of 'major' for error key
      if (!formData.program || formData.program.trim().length < 2) {
        newErrors.program = "Please enter your field of study";
      }
      // Fix: use 'graduationYear' instead of 'year'
      if (!formData.graduationYear) {
        newErrors.graduationYear = "Please select your graduation year";
      }
      if (!formData.bio || formData.bio.trim().length < 10) {
        newErrors.bio = "Please tell us about yourself (at least 10 characters)";
      }
      // Add university validation
      if (!formData.university && !user?.university?.id) {
        newErrors.university = "Please select your university";
      }
      break;

      case 1: // Lifestyle
        if (!formData.cleanliness) {
          newErrors.cleanliness = "Please rate your cleanliness level";
        }
        if (!formData.noiseTolerance) {
          newErrors.noiseTolerance = "Please rate your noise tolerance";
        }
        if (!formData.guestPolicy) {
          newErrors.guestPolicy = "Please select your guest policy";
        }
        break;

      case 2: // Preferences
        // Check if dietary restrictions checkbox is checked but no items added
        if (
          formData.dietaryRestrictions !== undefined &&
          formData.dietaryRestrictions !== null &&
          formData.dietaryRestrictions.length === 0
        ) {
          // Check if the checkbox is checked (we can infer this from the form state)
          const hasCheckedDietaryBox =
            touchedSteps.has(currentStep) &&
            formData.dietaryRestrictions !== null;
          if (hasCheckedDietaryBox) {
            newErrors.dietaryRestrictions =
              "Please add at least one dietary restriction or uncheck the box";
          }
        }
        break;

      case 4: // Roommate Preferences
        if (!formData.preferredRoommateGender) {
          newErrors.preferredRoommateGender = "Please select your preference";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setTouchedSteps((prev) => new Set(prev).add(currentStep));
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex < currentStep || touchedSteps.has(stepIndex - 1)) {
      setCurrentStep(stepIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate current step first
      if (!validateCurrentStep()) {
        toast.error("Please complete all required fields");
        return;
      }

      // Get university from form data or user profile
      const universityId = formData.university || user?.university?.id;
      
      if (!universityId) {
        toast.error("Please select your university");
        return;
      }

      // Prepare submission data
      const submissionData: Partial<RoommateProfileFormData> = {
        ...formData,
        university: universityId,
        // Ensure required fields have defaults
        ageRangeMin: formData.ageRangeMin || 18,
        ageRangeMax: formData.ageRangeMax || null,
        dietaryRestrictions: formData.dietaryRestrictions || [],
        hobbies: formData.hobbies || [],
        socialActivities: formData.socialActivities || [],
        languages: formData.languages || [],
        petFriendly: formData.petFriendly ?? false,
        smokingAllowed: formData.smokingAllowed ?? false,
        preferredRoommateCount: formData.preferredRoommateCount || 1,
      };

      console.log("=== PROFILE SUBMISSION ===");
      console.log("University ID:", universityId);
      console.log("Submission data:", submissionData);

      // Create or update profile
      let response;
      if (isEditing && profileId) {
        response = await apiService.roommates.updateProfile({
          ...submissionData,
          id: profileId,
        });
      } else {
        response = await apiService.roommates.createOrUpdateProfile(submissionData);
      }

      console.log("Profile saved successfully:", response.data);

      // Show success message
      const completion = response.data.profileCompletionPercentage || 0;
      if (completion >= 80) {
        toast.success("🎉 Profile completed! You now have full access to all features.");
      } else if (completion >= 50) {
        toast.success(`Profile updated! ${Math.round(completion)}% complete.`);
      } else {
        toast.success(`Profile saved! ${Math.round(completion)}% complete.`);
      }

      if (onComplete) {
        setTimeout(onComplete, 1000);
      }
    } catch (error: any) {
      console.error("Profile submission error:", error);
      
      const errorMessage = 
        error.response?.data?.detail || 
        error.response?.data?.error ||
        error.response?.data?.nonFieldErrors?.[0] ||
        "Failed to save profile. Please try again.";
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const completion = calculateCompletion();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-stone-900 mb-2">
              {isEditing ? "Edit Your Profile" : "Create Your Roommate Profile"}
            </h2>
            <p className="text-stone-600">
              Fill out your profile to find compatible roommates
            </p>
          </div>

          {/* Completion Badge */}
<div className="text-center">
  <div
    className={`relative w-20 h-20 rounded-full ${
      completion >= 80
        ? "bg-green-100"
        : completion >= 50
        ? "bg-yellow-100"
        : "bg-red-100"
    }`}
  >
    <svg className="w-20 h-20 transform -rotate-90">
      <circle
        cx="40"
        cy="40"
        r="36"
        stroke="currentColor"
        strokeWidth="8"
        fill="none"
        className={
          completion >= 80
            ? "text-green-200"
            : completion >= 50
            ? "text-yellow-200"
            : "text-red-200"
        }
      />
      <circle
        cx="40"
        cy="40"
        r="36"
        stroke="currentColor"
        strokeWidth="8"
        fill="none"
        strokeDasharray={`${2 * Math.PI * 36}`}
        strokeDashoffset={`${
          2 * Math.PI * 36 * (1 - completion / 100)
        }`}
        className={`transition-all duration-1000 ${
          completion >= 80
            ? "text-green-500"
            : completion >= 50
            ? "text-yellow-500"
            : "text-red-500"
        }`}
      />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center">
      <span className={`text-xl font-bold ${
        completion >= 80
          ? "text-green-900"  // Dark green text on light green background
          : completion >= 50
          ? "text-yellow-900"  // Dark yellow text on light yellow background
          : "text-red-900"     // Dark red text on light red background
      }`}>
        {completion}%
      </span>
    </div>
  </div>
  <p className="text-sm text-stone-600 mt-2">Complete</p>
</div>
        </div>

        {/* Enhanced Progress Steps */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-10 left-0 right-0 h-1 bg-stone-200">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
              initial={{ width: 0 }}
              animate={{
                width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Step Indicators */}
          <div className="relative flex justify-between">
            {STEPS.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted =
                index < currentStep || touchedSteps.has(index);
              const isClickable =
                index < currentStep || touchedSteps.has(index - 1);

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <button
                    onClick={() => isClickable && handleStepClick(index)}
                    disabled={!isClickable}
                    className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-br ${step.color} shadow-lg scale-110`
                        : isCompleted
                        ? "bg-green-500 shadow-md hover:scale-105"
                        : "bg-stone-200 hover:bg-stone-300"
                    } ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
                  >
                    {isCompleted && !isActive ? (
                      <CheckIcon className="w-8 h-8 text-white" />
                    ) : (
                      <span
                        className={`text-2xl ${
                          isActive ? "animate-bounce" : ""
                        }`}
                      >
                        {step.icon}
                      </span>
                    )}
                  </button>
                  <div className="mt-3 text-center">
                    <p
                      className={`text-sm font-semibold ${
                        isActive ? "text-stone-900" : "text-stone-600"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-stone-500 mt-1 hidden sm:block">
                      {step.subtitle}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content Card */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Step Header */}
        <div
          className={`bg-gradient-to-r ${currentStepData.color} p-6 text-white`}
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">{currentStepData.icon}</div>
            <div>
              <h3 className="text-2xl font-bold">{currentStepData.title}</h3>
              <p className="text-white/80">{currentStepData.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          <CurrentStepComponent
            data={formData}
            onChange={handleChange}
            errors={errors}
          />
        </div>
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8">
        <button
          type="button"
          onClick={currentStep === 0 ? handleSkip : handlePrevious}
          className="flex items-center gap-2 px-6 py-3 text-stone-600 hover:text-stone-800 font-medium transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          {currentStep === 0 ? "Skip for now" : "Previous"}
        </button>

        <div className="flex gap-3">
          {currentStep < STEPS.length - 1 ? (
            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Next
              <ArrowRightIcon className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  {isEditing ? "Update Profile" : "Complete Profile"}
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Motivational Tips */}
      {completion < 80 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6"
        >
          <div className="flex items-start gap-3 justify-center">
            <SparklesIcon className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-stone-900 mb-2 items-center">
                {completion < 50
                  ? "You're just getting started!"
                  : "You're doing great!"}
              </h4>
              <p className="text-stone-600 text-sm">
                {completion < 50
                  ? "Complete at least 50% of your profile to start viewing full roommate profiles."
                  : `Complete ${
                      80 - completion
                    }% more to unlock all features and get better matches!`}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
