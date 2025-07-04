// frontend/src/components/roommate-profile/sections/CoreProfileSection.tsx
import { User, University } from "@/types/api";
import { RoommateProfileFormData } from "@/types/roommates";
import { useState, useEffect } from 'react';
import apiService from '@/lib/api';
import {
  SLEEP_SCHEDULES,
  CLEANLINESS_LEVELS,
  NOISE_TOLERANCE_LEVELS,
  STUDY_HABITS,
  GUEST_POLICIES,
} from "@/utils/constants";

interface CoreProfileSectionProps {
  formData: RoommateProfileFormData;
  onChange: (
    updater: (prev: RoommateProfileFormData) => RoommateProfileFormData
  ) => void;
  user: User | null;
}

export default function CoreProfileSection({
  formData,
  onChange,
  user,
}: CoreProfileSectionProps) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);

  // Load universities on component mount
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setIsLoadingUniversities(true);
        const response = await apiService.universities.getAll();
        // Handle both array and object with results property
        const universitiesList = Array.isArray(response.data) 
          ? response.data 
          : response.data.results || [];
        setUniversities(universitiesList);
      } catch (error) {
        console.error('Failed to load universities:', error);
        // If failed, at least include the user's university if they have one
        if (user?.university) {
          setUniversities([user.university]);
        }
      } finally {
        setIsLoadingUniversities(false);
      }
    };

    loadUniversities();
  }, [user]);

  const handleChange = (field: keyof RoommateProfileFormData, value: any) => {
    onChange((prev: RoommateProfileFormData) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const age = calculateAge(formData.dateOfBirth);

  return (
    <div className="space-y-6 pt-4">
      {/* Basic Info */}
      <div>
        <h4 className="text-sm font-semibold text-stone-900 mb-4">
          Basic Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={user?.firstName || "First name"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={user?.lastName || "Last name"}
            />
          </div>
        </div>

        {/* Age Display (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Age
            </label>
            <div className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-stone-700">
              {age ? `${age} years old` : 'Age not available'}
            </div>
            {!age && (
              <p className="text-xs text-amber-600 mt-1">
                Please update your date of birth in your account settings
              </p>
            )}
          </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Nickname (Optional)
          </label>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => handleChange("nickname", e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="What do your friends call you?"
          />
        </div>

        {/* Academic Information */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-stone-900 mb-4">
            Academic Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                University
              </label>
              <select
                value={formData.university || user?.university?.id || ""}
                onChange={(e) =>
                  handleChange(
                    "university",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoadingUniversities}
              >
                <option value="">Select your university</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
              {isLoadingUniversities && (
                <p className="mt-1 text-xs text-stone-500">Loading universities...</p>
              )}
              {!isLoadingUniversities && universities.length > 1 && (
                <p className="mt-1 text-xs text-stone-500">
                  Select from available universities
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Major/Program
              </label>
              <input
                type="text"
                value={formData.major || ""}
                onChange={(e) => handleChange("major", e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Computer Science, Marketing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Graduation Year
              </label>
              <select
                value={formData.graduationYear || ""}
                onChange={(e) =>
                  handleChange(
                    "graduationYear",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select graduation year</option>
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() + i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            About You
          </label>
          <textarea
            value={formData.bio || ""}
            onChange={(e) => handleChange("bio", e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={4}
            placeholder="Tell potential roommates about yourself..."
            maxLength={500}
          />
          <p className="text-xs text-stone-500 mt-1">
            {(formData.bio || '').length}/500 characters
          </p>
        </div>
      </div>

      {/* Rest of the component remains the same... */}
      {/* Core 5 Compatibility Factors */}
      <div>
        <h4 className="text-sm font-semibold text-stone-900 mb-4">
          Compatibility Factors
          <span className="ml-2 text-xs font-normal text-stone-600">
            These help us find your best matches
          </span>
        </h4>

        {/* Sleep Schedule */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Sleep Schedule
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SLEEP_SCHEDULES.map((schedule) => (
              <button
                key={schedule.value}
                type="button"
                onClick={() => handleChange("sleepSchedule", schedule.value)}
                className={`p-3 rounded-lg border transition-all ${
                  formData.sleepSchedule === schedule.value
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-stone-200 hover:border-stone-300 text-stone-500"
                }`}
              >
                <div className="font-medium text-sm">{schedule.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Cleanliness */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Cleanliness Level
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-600 w-20">Messy</span>
            <div className="flex-1 flex items-center gap-2">
              {CLEANLINESS_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleChange("cleanliness", level.value)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    formData.cleanliness === level.value
                      ? "bg-primary-500 text-white"
                      : formData.cleanliness > level.value
                      ? "bg-primary-200"
                      : "bg-stone-200 hover:bg-stone-300"
                  }`}
                  title={level.label}
                >
                  {level.value}
                </button>
              ))}
            </div>
            <span className="text-sm text-stone-600 w-20 text-right">
              Clean
            </span>
          </div>
        </div>

        {/* Noise Tolerance */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Noise Tolerance
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-600 w-20">Quiet</span>
            <div className="flex-1 flex items-center gap-2">
              {NOISE_TOLERANCE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleChange("noiseTolerance", level.value)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    formData.noiseTolerance === level.value
                      ? "bg-primary-500 text-white"
                      : formData.noiseTolerance > level.value
                      ? "bg-primary-200"
                      : "bg-stone-200 hover:bg-stone-300"
                  }`}
                  title={level.label}
                >
                  {level.value}
                </button>
              ))}
            </div>
            <span className="text-sm text-stone-600 w-20 text-right">
              Loud OK
            </span>
          </div>
        </div>

        {/* Study Habits */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Study Habits
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {STUDY_HABITS.map((habit) => (
              <button
                key={habit.value}
                type="button"
                onClick={() => handleChange("studyHabits", habit.value)}
                className={`p-3 rounded-lg border transition-all ${
                  formData.studyHabits === habit.value
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-stone-200 hover:border-stone-300 text-stone-500"
                }`}
              >
                <div className="font-medium text-sm">{habit.label}</div>
                <div className="text-xs text-stone-500 mt-1">
                  {habit.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Guest Policy */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Guest Policy
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {GUEST_POLICIES.map((policy) => (
              <button
                key={policy.value}
                type="button"
                onClick={() => handleChange("guestPolicy", policy.value)}
                className={`p-3 rounded-lg border transition-all ${
                  formData.guestPolicy === policy.value
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-stone-200 hover:border-stone-300 text-stone-500"
                }`}
              >
                <div className="text-2xl mb-1">{policy.icon}</div>
                <div className="font-medium text-sm">{policy.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}