// frontend/src/components/roommates/steps/RoommatePreferencesStep.tsx
import { StepProps } from "@/types/roommates";
import { GENDER_PREFERENCES } from "@/utils/constants";
import { motion } from "framer-motion";
import {
  UserGroupIcon,
  CalendarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

export const RoommatePreferencesStep = ({
  data,
  onChange,
  errors,
}: StepProps) => {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-stone-900 mb-2">
          Your Ideal Roommate
        </h3>
        <p className="text-stone-600">
          Tell us what you're looking for in a roommate to help us find the best
          matches.
        </p>
      </motion.div>

      {/* Gender Preference */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block text-sm font-semibold text-stone-700 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <UserGroupIcon className="w-5 h-5 text-purple-600" />
            Preferred Roommate Gender
          </div>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GENDER_PREFERENCES.map((pref) => (
            <motion.button
              key={pref.value}
              type="button"
              onClick={() => onChange("preferredRoommateGender", pref.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                data.preferredRoommateGender === pref.value
                  ? "border-purple-500 bg-purple-50 shadow-lg"
                  : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              <div className="text-3xl mb-3">{pref.icon}</div>
              <div
                className={`text-sm font-medium ${
                  data.preferredRoommateGender === pref.value
                    ? "text-purple-700"
                    : "text-stone-700"
                }`}
              >
                {pref.label}
              </div>
              {data.preferredRoommateGender === pref.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                >
                  <div className="w-3 h-3 bg-white rounded-full" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
        {errors.preferredRoommateGender && (
          <p className="mt-2 text-sm text-red-600">
            {errors.preferredRoommateGender}
          </p>
        )}
      </motion.div>

      {/* Age Range */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-semibold text-stone-700 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Preferred Age Range
          </div>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-stone-600 mb-2">
              Minimum Age
            </label>
            <input
              type="number"
              value={data.ageRangeMin || ""}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty value for better UX
                if (value === "") {
                  onChange("ageRangeMin", null);
                } else {
                  const numValue = parseInt(value);
                  // Only set if valid number
                  if (!isNaN(numValue)) {
                    onChange("ageRangeMin", numValue);
                  }
                }
              }}
              onBlur={(e) => {
                // Validate on blur
                const value = e.target.value;
                if (value === "" || parseInt(value) < 18) {
                  onChange("ageRangeMin", 18);
                }
              }}
              placeholder="18"
              min="18"
              max="99"
              className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all border-stone-200 hover:border-stone-300"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-600 mb-2">
              Maximum Age
            </label>
            <input
              type="number"
              value={data.ageRangeMax || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  onChange("ageRangeMax", null);
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    // Limit to maximum of 99
                    const clampedValue = Math.min(numValue, 99);
                    onChange("ageRangeMax", clampedValue);
                  }
                }
              }}
              onBlur={(e) => {
                // Additional validation on blur
                const value = e.target.value;
                if (value !== "") {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue > 99) {
                    onChange("ageRangeMax", 99);
                  }
                }
              }}
              placeholder="99 (no limit)"
              min="18"
              max="99"
              className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all border-stone-200 hover:border-stone-300"
            />
          </div>
        </div>
        <p className="mt-2 text-sm text-stone-500">
          Leave maximum age empty for no upper limit
        </p>
      </motion.div>

      {/* Number of Roommates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="block text-sm font-semibold text-stone-700 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <UsersIcon className="w-5 h-5 text-green-600" />
            How many roommates would you like?
          </div>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((num) => (
            <motion.button
              key={num}
              type="button"
              onClick={() => onChange("preferredRoommateCount", num)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-primary-200 ${
                data.preferredRoommateCount === num
                  ? "border-green-500 bg-green-50 shadow-lg"
                  : "border-stone-200 hover:border-stone-200 hover:bg-stone-50"
              }`}
            >
              <div className="text-2xl font-bold mb-2 text-center">
                {num === 4 ? "4+" : num}
              </div>
              <div
                className={`text-xs font-medium text-center ${
                  data.preferredRoommateCount === num
                    ? "text-green-700"
                    : "text-stone-600"
                }`}
              >
                {num === 1
                  ? "Just one"
                  : num === 4
                  ? "Large group"
                  : `${num} roommates`}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                {num + 1} people total
              </div>
              {data.preferredRoommateCount === num && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <div className="w-3 h-3 bg-white rounded-full" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Perfect Match Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6"
      >
        <div className="flex items-start gap-3">
          <UserGroupIcon className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-stone-900 mb-2">
              Finding Your Perfect Match
            </h4>
            <p className="text-stone-600 text-sm">
              Our algorithm considers all your preferences along with lifestyle
              compatibility to find roommates you'll genuinely enjoy living
              with. The more specific you are, the better your matches!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
