// frontend/src/components/roommates/ProfileCompletionPrompt.tsx

import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { CheckCircleIcon, LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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
  const featuresUnlocked = requiredCompletion === 50 
    ? ['View complete roommate profiles', 'See compatibility scores', 'Contact potential roommates']
    : ['Browse all roommates', 'Advanced filtering', 'Priority in search results', 'Unlimited matches'];

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
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <LockClosedIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Complete Your Profile to Unlock Features
                    </DialogTitle>
                    
                    <div className="mt-4">
                      {/* Progress visualization */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Current: {currentCompletion}%</span>
                          <span>Required: {requiredCompletion}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 relative">
                          <motion.div
                            className="bg-primary-500 h-3 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${currentCompletion}%` }}
                            transition={{ duration: 0.5 }}
                          />
                          <div 
                            className="absolute top-0 h-3 w-0.5 bg-gray-600"
                            style={{ left: `${requiredCompletion}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">
                        You need to complete {requiredCompletion - currentCompletion}% more of your profile 
                        to unlock these features:
                      </p>
                      
                      <ul className="space-y-2 mb-6">
                        {featuresUnlocked.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Tip:</strong> A complete profile gets 3x more matches!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto"
                    onClick={onStartProfile}
                  >
                    Complete Profile Now
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Maybe Later
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}