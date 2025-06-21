// frontend/src/app/(main)/roommates/profile/edit/page.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { calculateProfileCompletion } from "@/utils/profileCompletion";
import {
  ChevronLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
  UserCircleIcon,
  AcademicCapIcon,
  HomeIcon,
  UserGroupIcon,
  CameraIcon,
  HeartIcon,
  LockClosedIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import apiService from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Simplified section structure
const PROFILE_SECTIONS = [
  {
    id: 'core',
    title: 'Essential Information',
    icon: SparklesIcon,
    description: 'The basics that help find your perfect match',
    required: true,
    fields: ['firstName', 'lastName', 'bio', 'sleepSchedule', 'cleanliness', 'noiseTolerance', 'studyHabits', 'guestPolicy'],
  },
  {
    id: 'photos',
    title: 'Photos',
    icon: CameraIcon,
    description: 'Help others get to know you',
    required: false,
    fields: ['images'],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle & Interests',
    icon: HeartIcon,
    description: 'Share what makes you unique',
    required: false,
    fields: ['hobbies', 'socialActivities', 'personality', 'languages'],
  },
  {
    id: 'housing',
    title: 'Housing Preferences',
    icon: HomeIcon,
    description: 'What you\'re looking for in a home',
    required: false,
    fields: ['budgetMin', 'budgetMax', 'moveInDate', 'housingType'],
  },
  {
    id: 'roommate',
    title: 'Roommate Preferences',
    icon: UserGroupIcon,
    description: 'Your ideal roommate',
    required: false,
    fields: ['preferredRoommateGender', 'ageRangeMin', 'ageRangeMax', 'dealBreakers'],
  },
];

export default function EditRoommateProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('core');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['core']));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Simplified form state
  const [formData, setFormData] = useState({
    // Core fields
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    nickname: '',
    bio: '',
    sleepSchedule: 'flexible',
    cleanliness: 3,
    noiseTolerance: 3,
    studyHabits: 'flexible',
    guestPolicy: 'occasionally',
    
    // Photos
    images: [],
    
    // Lifestyle
    hobbies: [],
    socialActivities: [],
    personality: [],
    languages: [],
    
    // Housing
    budgetMin: 0,
    budgetMax: 5000,
    moveInDate: '',
    housingType: 'apartment',
    
    // Roommate preferences
    preferredRoommateGender: 'no_preference',
    ageRangeMin: 18,
    ageRangeMax: null,
    dealBreakers: [],
  });

  // Calculate completion for each section
  const sectionCompletion = useMemo(() => {
    const completion: Record<string, number> = {};
    
    PROFILE_SECTIONS.forEach(section => {
      const sectionFields = section.fields;
      const filledFields = sectionFields.filter(field => {
        const value = formData[field as keyof typeof formData];
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim() !== '';
        return value !== null && value !== undefined;
      });
      
      completion[section.id] = Math.round((filledFields.length / sectionFields.length) * 100);
    });
    
    return completion;
  }, [formData]);

  // Overall completion
  const overallCompletion = useMemo(() => {
    const coreCompletion = sectionCompletion['core'] || 0;
    const otherSections = Object.entries(sectionCompletion)
      .filter(([id]) => id !== 'core')
      .map(([_, value]) => value);
    
    // Core is worth 60%, other sections share the remaining 40%
    const otherAverage = otherSections.length > 0 
      ? otherSections.reduce((a, b) => a + b, 0) / otherSections.length 
      : 0;
    
    return Math.round(coreCompletion * 0.6 + otherAverage * 0.4);
  }, [sectionCompletion]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiService.roommates.createOrUpdateProfile(formData);
      toast.success('Profile updated successfully!');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-stone-600 hover:text-primary-600 mb-4"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back
            </button>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-stone-900 mb-2">
                  Edit Your Profile
                </h1>
                <p className="text-stone-600">
                  {overallCompletion < 60 
                    ? "Complete the essentials to start matching" 
                    : "Add more details to improve your matches"}
                </p>
              </div>
              
              {/* Completion Ring */}
              <div className="text-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-stone-200"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - overallCompletion / 100)}`}
                      className="text-primary-600 transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{overallCompletion}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-stone-900">Your Progress</h3>
              <div className="flex gap-2">
                {PROFILE_SECTIONS.map(section => (
                  <div
                    key={section.id}
                    className={`w-12 h-2 rounded-full transition-colors ${
                      sectionCompletion[section.id] === 100
                        ? 'bg-green-500'
                        : sectionCompletion[section.id] >= 50
                        ? 'bg-yellow-500'
                        : 'bg-stone-200'
                    }`}
                    title={`${section.title}: ${sectionCompletion[section.id]}%`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {PROFILE_SECTIONS.map((section, index) => {
              const isExpanded = expandedSections.has(section.id);
              const completion = sectionCompletion[section.id];
              const Icon = section.icon;
              
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden ${
                    section.required && completion < 100 ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        completion === 100 
                          ? 'bg-green-100 text-green-600'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                          {section.title}
                          {section.required && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                              Required
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-stone-600">{section.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-stone-900">
                          {completion}%
                        </div>
                        {completion === 100 && (
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <ChevronDownIcon className={`w-5 h-5 text-stone-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </button>

                  {/* Section Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 border-t border-stone-100">
                          {/* Render section-specific content */}
                          {section.id === 'core' && (
                            <CoreProfileSection 
                              formData={formData} 
                              onChange={setFormData}
                              user={user}
                            />
                          )}
                          {/* Add other sections as needed */}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Save Button */}
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-6 right-6"
            >
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}