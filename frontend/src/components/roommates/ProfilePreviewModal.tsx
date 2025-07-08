// frontend/src/components/roommates/ProfilePreviewModal.tsx
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import { XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";
import { RoommateProfileFormData } from "@/types/roommates";
import { RoommateProfile } from "@/types/api";
import Image from "next/image";
import { getImageUrl } from "@/utils/imageUrls";
import {
  AcademicCapIcon,
  MapPinIcon,
  CheckBadgeIcon,
  SparklesIcon,
  CalendarIcon,
  BookOpenIcon,
  HomeIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: RoommateProfileFormData;
  user: any;
}

export default function ProfilePreviewModal({
  isOpen,
  onClose,
  formData,
  user,
}: ProfilePreviewModalProps) {
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const age = calculateAge(user?.dateOfBirth);
  const displayName =
    formData.nickname || formData.firstName || user?.firstName || "Student";

  // Get primary image
  const primaryImage =
    formData.images?.find((img) => img.isPrimary && !img.isDeleted) ||
    formData.images?.[0];
  const imageUrl = primaryImage?.url || getImageUrl(user?.profilePicture);

  // Helper function to get lifestyle labels
  const getLifestyleLabel = (field: string, value: any) => {
    const labels: Record<string, Record<string, string>> = {
      sleepSchedule: {
        early_bird: "🌅 Early Bird",
        night_owl: "🌙 Night Owl",
        average: "😴 Flexible Sleep",
      },
      cleanliness: {
        1: "🌪️ Relaxed",
        2: "🧹 Tidy",
        3: "✨ Clean",
        4: "🌟 Very Clean",
        5: "💎 Spotless",
      },
      studyHabits: {
        at_home: "📚 Study at Home",
        library: "🏛️ Library/Campus",
        flexible: "📖 Flexible Study",
      },
      guestPolicy: {
        rarely: "🚪 Few Guests",
        occasionally: "👥 Some Guests",
        frequently: "🎉 Social",
      },
    };

    return labels[field]?.[value] || value;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-stone-50 shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <EyeIcon className="w-6 h-6 text-white" />
                      <DialogTitle className="text-lg font-semibold text-white">
                        Profile Preview
                      </DialogTitle>
                      <span className="text-sm text-primary-100">
                        This is how others will see your profile
                      </span>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white hover:text-primary-100 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[80vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Column - Images & Core Info */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Profile Images */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                          <div className="aspect-[4/3] relative">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={displayName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                                <span className="text-6xl text-stone-400">
                                  {displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Image thumbnails */}
                          {formData.images &&
                            formData.images.filter((img) => !img.isDeleted)
                              .length > 1 && (
                              <div className="p-4 flex gap-2 overflow-x-auto">
                                {formData.images
                                  .filter((img) => !img.isDeleted && img.url) // Add check for url
                                  .slice(0, 5)
                                  .map((img, idx) => (
                                    <div
                                      key={img.id}
                                      className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                                    >
                                      {img.url ? (
                                        <Image
                                          src={img.url}
                                          alt={`Photo ${idx + 1}`}
                                          width={80}
                                          height={80}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-stone-200" />
                                      )}
                                    </div>
                                  ))}
                              </div>
                            )}
                        </div>

                        {/* Bio Section */}
                        {formData.bio && (
                          <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-stone-900 mb-3">
                              About Me
                            </h2>
                            <p className="text-stone-600 whitespace-pre-wrap">
                              {formData.bio}
                            </p>
                          </div>
                        )}

                        {/* Lifestyle Compatibility */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                          <h2 className="text-xl font-semibold text-stone-900 mb-4">
                            Lifestyle & Compatibility
                          </h2>
                          <div className="grid grid-cols-2 gap-4">
                            {formData.sleepSchedule && (
                              <div className="p-4 bg-stone-50 rounded-xl">
                                <p className="text-sm text-stone-600 mb-1">
                                  Sleep Schedule
                                </p>
                                <p className="font-medium text-stone-900">
                                  {getLifestyleLabel(
                                    "sleepSchedule",
                                    formData.sleepSchedule
                                  )}
                                </p>
                              </div>
                            )}
                            {formData.cleanliness && (
                              <div className="p-4 bg-stone-50 rounded-xl">
                                <p className="text-sm text-stone-600 mb-1">
                                  Cleanliness
                                </p>
                                <p className="font-medium text-stone-900">
                                  {getLifestyleLabel(
                                    "cleanliness",
                                    formData.cleanliness
                                  )}
                                </p>
                              </div>
                            )}
                            {formData.studyHabits && (
                              <div className="p-4 bg-stone-50 rounded-xl">
                                <p className="text-sm text-stone-600 mb-1">
                                  Study Habits
                                </p>
                                <p className="font-medium text-stone-900">
                                  {getLifestyleLabel(
                                    "studyHabits",
                                    formData.studyHabits
                                  )}
                                </p>
                              </div>
                            )}
                            {formData.guestPolicy && (
                              <div className="p-4 bg-stone-50 rounded-xl">
                                <p className="text-sm text-stone-600 mb-1">
                                  Guest Policy
                                </p>
                                <p className="font-medium text-stone-900">
                                  {getLifestyleLabel(
                                    "guestPolicy",
                                    formData.guestPolicy
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Quick Info */}
                      <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
                          {/* Name & Basic Info */}
                          <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-stone-900 mb-2">
                              {displayName}
                              {user?.studentIdVerified && (
                                <CheckBadgeIcon className="inline-block w-6 h-6 text-primary-500 ml-2" />
                              )}
                            </h1>

                            {/* Age & Gender */}
                            <div className="flex items-center justify-center gap-3 text-stone-600 mb-2">
                              {age && (
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="w-4 h-4" />
                                  {age} years old
                                </span>
                              )}
                              {user?.gender && <span>{user.gender}</span>}
                            </div>

                            {/* Academic Info */}
                            {(formData.major || formData.year) && (
                              <div className="text-sm text-stone-600">
                                {formData.major && (
                                  <span className="flex items-center justify-center gap-1 mb-1">
                                    <BookOpenIcon className="w-4 h-4" />
                                    {formData.major}
                                  </span>
                                )}
                                {formData.year && (
                                  <span>Year {formData.year}</span>
                                )}
                              </div>
                            )}

                            {/* University */}
                            {user?.university && (
                              <p className="text-sm text-stone-500 flex items-center justify-center gap-1 mt-2">
                                <MapPinIcon className="w-4 h-4" />
                                {user.university.name}
                              </p>
                            )}
                          </div>

                          {/* Housing Preferences */}
                          {(formData.budgetMin ||
                            formData.budgetMax ||
                            formData.moveInDate) && (
                            <div className="border-t pt-4">
                              <h3 className="text-sm font-semibold text-stone-700 mb-3">
                                Housing Preferences
                              </h3>
                              <div className="space-y-2">
                                {(formData.budgetMin || formData.budgetMax) && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <CurrencyDollarIcon className="w-4 h-4 text-stone-400" />
                                    <span className="text-stone-600">
                                      ${formData.budgetMin || 0} - $
                                      {formData.budgetMax || "∞"}/mo
                                    </span>
                                  </div>
                                )}
                                {formData.moveInDate && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <CalendarIcon className="w-4 h-4 text-stone-400" />
                                    <span className="text-stone-600">
                                      Move in:{" "}
                                      {new Date(
                                        formData.moveInDate
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                                {formData.housingType && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <HomeIcon className="w-4 h-4 text-stone-400" />
                                    <span className="text-stone-600 capitalize">
                                      {formData.housingType}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Interests */}
                          {((formData.hobbies?.length ?? 0) > 0 ||
                            (formData.socialActivities?.length ?? 0) > 0) && (
                            <div className="border-t pt-4 mt-4">
                              <h3 className="text-sm font-semibold text-stone-700 mb-3">
                                Interests
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {formData.hobbies
                                  ?.slice(0, 5)
                                  .map((hobby, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs"
                                    >
                                      {hobby}
                                    </span>
                                  ))}
                                {formData.socialActivities
                                  ?.slice(0, 3)
                                  .map((activity, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs"
                                    >
                                      {activity}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
