// frontend/src/components/roommate-profile/sections/CoreProfileSection.tsx
import { User } from "@/types/api";
import { RoommateProfileFormData } from "@/types/roommates";
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
  const handleChange = (field: keyof RoommateProfileFormData, value: any) => {
    onChange((prev: RoommateProfileFormData) => ({
      ...prev,
      [field]: value,
    }));
  };

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

        <div className="mt-4">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Bio
          </label>
          <textarea
            value={formData.bio || ""} // Add default empty string
            onChange={(e) => handleChange("bio", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Tell potential roommates about yourself..."
            maxLength={500}
          />
          <p className="text-xs text-stone-500 mt-1">
            {(formData.bio || "").length}/500 characters{" "}
            {/* Add default empty string */}
          </p>
        </div>
      </div>

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
                    : "border-stone-200 hover:border-stone-300"
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
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="font-medium text-sm">{habit.label}</div>
                <div className="text-xs text-stone-600 mt-1">
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
                    : "border-stone-200 hover:border-stone-300"
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
