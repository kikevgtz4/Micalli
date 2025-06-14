// frontend/src/components/roommates/ProfileCompletionPrompt.tsx

import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  CheckCircleIcon,
  LockClosedIcon,
  XMarkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

interface ProfileCompletionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  currentCompletion: number;
  requiredCompletion: number;
  onStartProfile: () => void;
}

export default function ProfileCompletionPrompt({
  isOpen,
  onClose,
  currentCompletion,
  requiredCompletion,
  onStartProfile,
}: ProfileCompletionPromptProps) {
  const featuresUnlocked =
    requiredCompletion === 50
      ? [
          "View complete roommate profiles",
          "See compatibility scores",
          "Contact potential roommates",
        ]
      : [
          "Browse all roommates",
          "Advanced filtering",
          "Priority in search results",
          "Unlimited matches",
        ];

  return (
    <Transition show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-3xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {/* Gradient header */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-400 to-pink-400 opacity-10" />

                <div className="relative">
                  {/* Close button */}
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-full bg-white/80 backdrop-blur p-2 text-gray-400 hover:text-gray-500 hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="sm:flex sm:items-start">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 sm:mx-0"
                    >
                      <LockClosedIcon
                        className="h-8 w-8 text-white"
                        aria-hidden="true"
                      />
                    </motion.div>

                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                      <DialogTitle
                        as="h3"
                        className="text-xl font-bold leading-6 text-gray-900"
                      >
                        Unlock Roommate Profiles
                      </DialogTitle>

                      <div className="mt-4">
                        {/* Enhanced progress visualization */}
                        <div className="mb-6 bg-gray-50 rounded-xl p-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-700">
                              Your Progress
                            </span>
                            <span className="font-bold text-purple-600">
                              {currentCompletion}%
                            </span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <motion.div
                                className="h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${currentCompletion}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                            <div
                              className="absolute top-0 h-4 w-1 bg-gray-700"
                              style={{ left: `${requiredCompletion}%` }}
                            />
                            <span
                              className="absolute -top-6 text-xs text-gray-600"
                              style={{
                                left: `${requiredCompletion}%`,
                                transform: "translateX(-50%)",
                              }}
                            >
                              Required: {requiredCompletion}%
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                          Complete{" "}
                          <span className="font-bold text-purple-600">
                            {requiredCompletion - currentCompletion}%
                          </span>{" "}
                          more of your profile to unlock:
                        </p>

                        <ul className="space-y-3 mb-6">
                          {featuresUnlocked.map((feature, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start"
                            >
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                                <CheckCircleIcon className="h-4 w-4 text-white" />
                              </div>
                              <span className="ml-3 text-sm text-gray-700">
                                {feature}
                              </span>
                            </motion.li>
                          ))}
                        </ul>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <SparklesIcon className="w-5 h-5 text-purple-600" />
                            <p className="text-sm font-semibold text-purple-800">
                              Pro Tip
                            </p>
                          </div>
                          <p className="text-sm text-purple-700">
                            Complete profiles get 3x more matches and higher
                            compatibility scores!
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className="inline-flex w-full justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl sm:w-auto"
                      onClick={onStartProfile}
                    >
                      Complete Profile Now
                    </motion.button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-md ring-1 ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={onClose}
                    >
                      Maybe Later
                    </button>
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
