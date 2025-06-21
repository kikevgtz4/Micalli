// frontend/src/components/roommates/SmartEditForm.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileImageUpload from "./ProfileImageUpload";
import toast from "react-hot-toast";
import {
  UserIcon,
  HomeIcon,
  HeartIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  PhoneIcon,
  EyeSlashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ImageData } from "@/types/roommates";
import { roommateValidation, validateRoommateProfile, hasFormErrors } from '@/utils/validation';

interface SmartEditFormProps {
  basicInfo: any;
  lifestyle: any;
  preferences: any;
  social: any;
  roommatePrefs: any;
  housing: any;
  images: ImageData[];
  additional: any;
  privacy: any;
  user: any;
  onInputChange: (section: string, field: string, value: any) => void;
  onImagesChange: (images: ImageData[]) => void;
  onSubmit: (e?: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  completion: number;
}

interface EditSectionProps {
  title: string;
  icon: React.ElementType;
  description: string;
  isComplete: boolean;
  completionPercentage: number;
  children: React.ReactNode;
  colorScheme: "primary" | "secondary" | "tertiary" | "accent";
}

const EditSection: React.FC<EditSectionProps> = ({
  title,
  icon: Icon,
  description,
  isComplete,
  completionPercentage,
  children,
  colorScheme,
}) => {
  const [isExpanded, setIsExpanded] = useState(!isComplete);
  
  const colorClasses = {
    primary: {
      bg: "from-primary-500 to-primary-600",
      lightBg: "bg-primary-50",
      border: "border-primary-200",
      text: "text-primary-600",
    },
    secondary: {
      bg: "from-secondary-500 to-secondary-600",
      lightBg: "bg-secondary-50",
      border: "border-secondary-200",
      text: "text-secondary-600",
    },
    tertiary: {
      bg: "from-purple-500 to-purple-600",
      lightBg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-600",
    },
    accent: {
      bg: "from-pink-500 to-pink-600",
      lightBg: "bg-pink-50",
      border: "border-pink-200",
      text: "text-pink-600",
    },
  };
  
  const colors = colorClasses[colorScheme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${
        isComplete ? 'border-green-200' : colors.border
      } transition-all hover:shadow-md`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${colors.bg} shadow-sm`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              {title}
              {isComplete && (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              )}
            </h3>
            <p className="text-sm text-stone-600">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-2xl font-bold ${
              completionPercentage >= 100 ? 'text-green-600' :
              completionPercentage >= 50 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {Math.round(completionPercentage)}%
            </p>
            <p className="text-xs text-stone-500">Complete</p>
          </div>
          <ChevronDownIcon
            className={`w-5 h-5 text-stone-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-stone-100"
          >
            <div className="p-6 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function SmartEditForm({
  basicInfo,
  lifestyle,
  preferences,
  social,
  roommatePrefs,
  housing,
  images,
  additional,
  privacy,
  user,
  onInputChange,
  onImagesChange,
  onSubmit,
  isSubmitting,
  completion,
}: SmartEditFormProps) {
  // Calculate section completions
  const calculateSectionCompletion = (fields: Record<string, any>) => {
    const values = Object.values(fields);
    const filled = values.filter(v => 
      v !== "" && v !== null && v !== undefined && 
      (Array.isArray(v) ? v.length > 0 : true)
    ).length;
    return values.length > 0 ? (filled / values.length) * 100 : 0;
  };

  const sections = [
    {
      key: "photos",
      title: "Profile Photos",
      icon: SparklesIcon,
      description: "Add photos to make your profile stand out",
      colorScheme: "primary" as const,
      completion: images.length > 0 ? 100 : 0,
      content: (
        <div>
          <ProfileImageUpload
            images={images}
            onChange={onImagesChange}
            maxImages={6}
          />
          <p className="text-sm text-stone-500 mt-2">
            Tip: Profiles with photos get 10x more matches!
          </p>
        </div>
      ),
    },
    {
      key: "basic",
      title: "Basic Information",
      icon: UserIcon,
      description: "Tell us about yourself",
      colorScheme: "secondary" as const,
      completion: calculateSectionCompletion(basicInfo),
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name fields */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              First Name *
              <span className="text-stone-400 text-xs ml-2">(Updates your account)</span>
            </label>
            <input
              type="text"
              value={basicInfo.firstName}
              onChange={(e) => onInputChange("basic", "firstName", e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Your first name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Last Name *
              <span className="text-stone-400 text-xs ml-2">(Updates your account)</span>
            </label>
            <input
              type="text"
              value={basicInfo.lastName}
              onChange={(e) => onInputChange("basic", "lastName", e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Your last name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Nickname
              <span className="text-stone-400 text-xs ml-2">(Optional - for roommate matching)</span>
            </label>
            <input
              type="text"
              value={basicInfo.nickname}
              onChange={(e) => onInputChange("basic", "nickname", e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="What friends call you"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Gender *
            </label>
            <select
              value={basicInfo.gender}
              onChange={(e) => onInputChange("basic", "gender", e.target.value || undefined)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Bio *
              <span className="text-stone-400 text-xs ml-2">
                Tell potential roommates about yourself
              </span>
            </label>
            <div className="relative">
              <textarea
                value={basicInfo.bio}
                onChange={(e) => onInputChange("basic", "bio", e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                rows={4}
                placeholder="Share your personality, what you're studying, your hobbies..."
                maxLength={500}
              />
              <span className="absolute bottom-3 right-3 text-xs text-stone-400">
                {basicInfo.bio.length}/500
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              University *
            </label>
            <select
              value={user?.university?.id || ""}
              onChange={(e) => {
                toast("University changes should be made in your account settings");
              }}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl bg-stone-50 cursor-not-allowed"
              disabled
            >
              <option value="">
                {user?.university?.name || "No university set"}
              </option>
            </select>
            <p className="mt-1 text-xs text-stone-500">
              Update in account settings
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : ""}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl bg-stone-50 cursor-not-allowed"
              disabled
              readOnly
            />
            {user?.age && (
              <p className="mt-1 text-sm text-stone-600">
                Age: {user.age} years old
              </p>
            )}
            <p className="mt-1 text-xs text-stone-500">
              Update date of birth in account settings
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Major/Program
            </label>
            <input
              type="text"
              value={basicInfo.program}
              onChange={(e) => onInputChange("basic", "program", e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="e.g., Computer Science"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Graduation Year
            </label>
            <input
              type="number"
              value={basicInfo.graduationYear}
              onChange={(e) => onInputChange("basic", "graduationYear", parseInt(e.target.value))}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              min={new Date().getFullYear()}
              max={new Date().getFullYear() + 8}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Sleep Schedule
            </label>
            <select
              value={basicInfo.sleepSchedule}
              onChange={(e) => onInputChange("basic", "sleepSchedule", e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              <option value="early_bird">🌅 Early Bird (Before 10 PM)</option>
              <option value="average">😊 Average (10 PM - 12 AM)</option>
              <option value="night_owl">🦉 Night Owl (After 12 AM)</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      key: "lifestyle",
      title: "Lifestyle & Habits",
      icon: HeartIcon,
      description: "Help us find compatible roommates",
      colorScheme: "tertiary" as const,
      completion: calculateSectionCompletion(lifestyle),
      content: (
        <div className="space-y-6">
          {/* Cleanliness Scale */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">
              Cleanliness Level
            </label>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-stone-500">Messy</span>
              <span className="text-sm text-stone-500">Neat Freak</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={lifestyle.cleanliness}
              onChange={(e) => onInputChange("lifestyle", "cleanliness", parseInt(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between mt-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <span
                  key={num}
                  className={`text-xs ${
                    num === lifestyle.cleanliness ? 'text-primary-600 font-bold' : 'text-stone-400'
                  }`}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
          
          {/* Noise Tolerance */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">
              Noise Tolerance
            </label>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-stone-500">Need Silence</span>
              <span className="text-sm text-stone-500">Party Animal</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={lifestyle.noiseTolerance}
              onChange={(e) => onInputChange("lifestyle", "noiseTolerance", parseInt(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between mt-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <span
                  key={num}
                  className={`text-xs ${
                    num === lifestyle.noiseTolerance ? 'text-primary-600 font-bold' : 'text-stone-400'
                  }`}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Guest Policy
              </label>
              <select
                value={lifestyle.guestPolicy}
                onChange={(e) => onInputChange("lifestyle", "guestPolicy", e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="">Select preference</option>
                <option value="rarely">Rarely have guests</option>
                <option value="occasionally">Occasionally have guests</option>
                <option value="frequently">Frequently have guests</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Study Habits
              </label>
              <input
                type="text"
                value={lifestyle.studyHabits}
                onChange={(e) => onInputChange("lifestyle", "studyHabits", e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="e.g., Study at home, library, coffee shops"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Work Schedule
              </label>
              <input
                type="text"
                value={lifestyle.workSchedule}
                onChange={(e) => onInputChange("lifestyle", "workSchedule", e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="e.g., Monday-Friday 9am-5pm, Weekend shifts, Remote work"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "housing",
      title: "Housing Preferences",
      icon: HomeIcon,
      description: "What kind of place are you looking for?",
      colorScheme: "primary" as const,
      completion: calculateSectionCompletion(housing),
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Budget Range (MXN/month)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                  <input
                    type="number"
                    value={housing.budgetMin}
                    onChange={(e) => onInputChange("housing", "budgetMin", parseInt(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Min"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                  <input
                    type="number"
                    value={housing.budgetMax}
                    onChange={(e) => onInputChange("housing", "budgetMax", parseInt(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Move-in Date
              </label>
              <input
                type="date"
                value={housing.moveInDate}
                onChange={(e) => onInputChange("housing", "moveInDate", e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Lease Duration
              </label>
              <select
                value={housing.leaseDuration}
                onChange={(e) => onInputChange("housing", "leaseDuration", e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="1_month">1 Month</option>
                <option value="3_months">3 Months</option>
                <option value="6_months">6 Months</option>
                <option value="12_months">12 Months</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Housing Type
              </label>
              <select
                value={housing.housingType}
                onChange={(e) => onInputChange("housing", "housingType", e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="shared_room">Shared Room</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Preferred Locations
              </label>
              <input
                type="text"
                placeholder="Add location (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    e.preventDefault();
                    onInputChange("housing", "preferredLocations", [
                      ...housing.preferredLocations,
                      e.currentTarget.value.trim(),
                    ]);
                    e.currentTarget.value = "";
                  }
                }}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {housing.preferredLocations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {housing.preferredLocations.map((location: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 rounded-full text-sm text-primary-700"
                    >
                      {location}
                      <button
                        type="button"
                        onClick={() =>
                          onInputChange(
                            "housing",
                            "preferredLocations",
                            housing.preferredLocations.filter((_: any, i: number) => i !== index)
                          )
                        }
                        className="text-primary-500 hover:text-primary-700"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "preferences",
      title: "Preferences & Compatibility",
      icon: CheckCircleIcon,
      description: "Your living preferences and requirements",
      colorScheme: "secondary" as const,
      completion: calculateSectionCompletion(preferences),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
              <label className="text-sm font-medium text-stone-700">
                Pet Friendly
              </label>
              <button
                type="button"
                onClick={() => onInputChange("preferences", "petFriendly", !preferences.petFriendly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.petFriendly ? "bg-primary-600" : "bg-stone-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.petFriendly ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
              <label className="text-sm font-medium text-stone-700">
                Smoking Allowed
              </label>
              <button
                type="button"
                onClick={() => onInputChange("preferences", "smokingAllowed", !preferences.smokingAllowed)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.smokingAllowed ? "bg-primary-600" : "bg-stone-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.smokingAllowed ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Dietary Restrictions
            </label>
            <input
              type="text"
              placeholder="Add dietary restriction (press Enter)"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  onInputChange("preferences", "dietaryRestrictions", [
                    ...preferences.dietaryRestrictions,
                    e.currentTarget.value.trim(),
                  ]);
                  e.currentTarget.value = "";
                }
              }}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {preferences.dietaryRestrictions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {preferences.dietaryRestrictions.map((diet: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full text-sm text-green-700"
                  >
                    {diet}
                    <button
                      type="button"
                      onClick={() =>
                        onInputChange(
                          "preferences",
                          "dietaryRestrictions",
                          preferences.dietaryRestrictions.filter((_: any, i: number) => i !== index)
                        )
                      }
                      className="text-green-500 hover:text-green-700"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Languages
            </label>
            <input
              type="text"
              placeholder="Add language (press Enter)"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  onInputChange("preferences", "languages", [
                    ...preferences.languages,
                    e.currentTarget.value.trim(),
                  ]);
                  e.currentTarget.value = "";
                }
              }}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {preferences.languages.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {preferences.languages.map((lang: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-700"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() =>
                        onInputChange(
                          "preferences",
                          "languages",
                          preferences.languages.filter((_: any, i: number) => i !== index)
                        )
                      }
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "social",
      title: "Social & Activities",
      icon: UserGroupIcon,
      description: "Share your interests and social preferences",
      colorScheme: "tertiary" as const,
      completion: calculateSectionCompletion(social),
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Hobbies
            </label>
            <input
              type="text"
              placeholder="Add hobbies (press Enter)"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  onInputChange("social", "hobbies", [
                    ...social.hobbies,
                    e.currentTarget.value.trim(),
                  ]);
                  e.currentTarget.value = "";
                }
              }}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {social.hobbies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {social.hobbies.map((hobby: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-full text-sm text-primary-700 font-medium"
                  >
                    {hobby}
                    <button
                      type="button"
                      onClick={() =>
                        onInputChange(
                          "social",
                          "hobbies",
                          social.hobbies.filter((_: any, i: number) => i !== index)
                        )
                      }
                      className="text-primary-500 hover:text-primary-700"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Social Activities
            </label>
            <input
              type="text"
              placeholder="Add activities (press Enter)"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  onInputChange("social", "socialActivities", [
                    ...social.socialActivities,
                    e.currentTarget.value.trim(),
                  ]);
                  e.currentTarget.value = "";
                }
              }}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {social.socialActivities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {social.socialActivities.map((activity: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-sm text-purple-700 font-medium"
                  >
                    {activity}
                    <button
                      type="button"
                      onClick={() =>
                        onInputChange(
                          "social",
                          "socialActivities",
                          social.socialActivities.filter((_: any, i: number) => i !== index)
                        )
                      }
                      className="text-purple-500 hover:text-purple-700"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "roommate",
      title: "Ideal Roommate",
      icon: UserGroupIcon,
      description: "Describe your perfect roommate",
      colorScheme: "accent" as const,
      completion: calculateSectionCompletion(roommatePrefs),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Gender Preference
              </label>
              <select
                value={roommatePrefs.preferredRoommateGender}
                onChange={(e) => onInputChange("roommate", "preferredRoommateGender", e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="no_preference">No Preference</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Number of Roommates
              </label>
              <input
                type="number"
                value={roommatePrefs.preferredRoommateCount}
                onChange={(e) => onInputChange("roommate", "preferredRoommateCount", parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                min="1"
                max="5"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Age Range
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="number"
                value={roommatePrefs.ageRangeMin}
                onChange={(e) => onInputChange("roommate", "ageRangeMin", parseInt(e.target.value))}
                className="flex-1 px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Min"
                min="18"
              />
              <span className="text-stone-500">to</span>
              <input
                type="number"
                value={roommatePrefs.ageRangeMax || ""}
                onChange={(e) => onInputChange("roommate", "ageRangeMax", e.target.value ? parseInt(e.target.value) : null)}
                className="flex-1 px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Max"
                min="18"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "additional",
      title: "Additional Preferences",
      icon: ClipboardDocumentCheckIcon,
      description: "Personality traits, deal breakers, and more",
      colorScheme: "primary" as const,
      completion: calculateSectionCompletion(additional),
      content: (
        <div className="space-y-6">
          {/* Personality Traits */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Personality Traits
            </label>
            <p className="text-sm text-stone-500 mb-3">
              Add words that describe your personality
            </p>
            <input
              type="text"
              placeholder="Type and press Enter to add"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  onInputChange("additional", "personality", [
                    ...additional.personality,
                    e.currentTarget.value.trim(),
                  ]);
                  e.currentTarget.value = "";
                }
              }}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
            {additional.personality.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {additional.personality.map((trait: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {trait}
                    <button
                      type="button"
                      onClick={() =>
                        onInputChange(
                          "additional",
                          "personality",
                          additional.personality.filter((_: any, i: number) => i !== index)
                        )
                      }
                      className="ml-1 hover:text-purple-900"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Deal Breakers */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Deal Breakers
            </label>
            <p className="text-sm text-stone-500 mb-3">
              Things you absolutely cannot live with
            </p>
            <input
              type="text"
              placeholder="Type and press Enter to add"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  onInputChange("additional", "dealBreakers", [
                    ...additional.dealBreakers,
                    e.currentTarget.value.trim(),
                  ]);
                  e.currentTarget.value = "";
                }
              }}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
            {additional.dealBreakers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {additional.dealBreakers.map((breaker: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {breaker}
                    <button
                      type="button"
                      onClick={() =>
                        onInputChange(
                          "additional",
                          "dealBreakers",
                          additional.dealBreakers.filter((_: any, i: number) => i !== index)
                        )
                      }
                      className="ml-1 hover:text-red-900"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Shared Interests */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Things You'd Like to Share
            </label>
            <p className="text-sm text-stone-500 mb-3">
              Activities or interests you'd enjoy doing with roommates
            </p>
            <input
              type="text"
              placeholder="Type and press Enter to add"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  onInputChange("additional", "sharedInterests", [
                    ...additional.sharedInterests,
                    e.currentTarget.value.trim(),
                  ]);
                  e.currentTarget.value = "";
                }
              }}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
            {additional.sharedInterests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {additional.sharedInterests.map((interest: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() =>
                        onInputChange(
                          "additional",
                          "sharedInterests",
                          additional.sharedInterests.filter((_: any, i: number) => i !== index)
                        )
                      }
                      className="ml-1 hover:text-green-900"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Additional Information
            </label>
            <textarea
              value={additional.additionalInfo}
              onChange={(e) => onInputChange("additional", "additionalInfo", e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              placeholder="Anything else you'd like potential roommates to know..."
            />
          </div>
        </div>
      ),
    },
    {
      key: "privacy",
      title: "Privacy Settings",
      icon: EyeSlashIcon,
      description: "Control who can see your profile",
      colorScheme: "tertiary" as const,
      completion: calculateSectionCompletion(privacy),
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              Control who can see different parts of your profile. You can always change these settings later.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Profile Visibility
              </label>
              <select
                value={privacy.profileVisibleTo}
                onChange={(e) => onInputChange("privacy", "profileVisibleTo", e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="everyone">Everyone</option>
                <option value="matches_only">Matches Only</option>
                <option value="nobody">Nobody (Hidden)</option>
              </select>
              <p className="mt-1 text-xs text-stone-500">
                Who can see your profile in search results
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Contact Information Visibility
              </label>
              <select
                value={privacy.contactVisibleTo}
                onChange={(e) => onInputChange("privacy", "contactVisibleTo", e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="everyone">Everyone</option>
                <option value="matches_only">Matches Only</option>
                <option value="nobody">Nobody (Request to Connect)</option>
              </select>
              <p className="mt-1 text-xs text-stone-500">
                Who can see your contact details
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Images Visibility
              </label>
              <select
                value={privacy.imagesVisibleTo}
                onChange={(e) => onInputChange("privacy", "imagesVisibleTo", e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-primary-500"
              >
                <option value="everyone">Everyone</option>
                <option value="matches_only">Matches Only</option>
                <option value="nobody">Nobody</option>
              </select>
              <p className="mt-1 text-xs text-stone-500">
                Who can see your profile photos
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl p-6 shadow-sm"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">{images.filter(img => !img.isDeleted).length}</p>
            <p className="text-sm text-stone-600">Photos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-secondary-600">
              {Math.round(completion)}%
            </p>
            <p className="text-sm text-stone-600">Complete</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {sections.filter(s => s.completion >= 100).length}
            </p>
            <p className="text-sm text-stone-600">Sections Done</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {completion >= 80 ? "Ready!" : "Almost"}
            </p>
            <p className="text-sm text-stone-600">Profile Status</p>
          </div>
        </div>
      </motion.div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <EditSection
            key={section.key}
            title={section.title}
            icon={section.icon}
            description={section.description}
            isComplete={section.completion >= 100}
            completionPercentage={section.completion}
            colorScheme={section.colorScheme}
          >
            {section.content}
          </EditSection>
        ))}
      </div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end gap-4 pt-6"
      >
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-8 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            completion >= 80
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transform hover:scale-105"
              : "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg"
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              {completion >= 80 ? "🎉 Save Profile" : "💾 Save Progress"}
            </>
          )}
        </button>
      </motion.div>
    </form>
  );
}