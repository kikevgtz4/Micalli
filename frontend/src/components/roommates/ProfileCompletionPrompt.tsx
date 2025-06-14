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
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

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
  const remainingCompletion = requiredCompletion - currentCompletion;

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
          <div className="fixed inset-0 bg-stone-800/30 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                {/* Close button */}
                <button
                  className="absolute right-4 top-4 text-stone-400 hover:text-stone-600"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="bg-white px-6 pb-6 pt-8">
                  {/* Icon */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                    <LockClosedIcon className="h-8 w-8 text-primary-600" />
                  </div>

                  {/* Content */}
                  <div className="mt-6 text-center">
                    <DialogTitle as="h3" className="text-xl font-semibold text-stone-900">
                      Complete Your Profile to View
                    </DialogTitle>
                    
                    <p className="mt-3 text-stone-600">
                      You need to complete at least {requiredCompletion}% of your profile to view 
                      other roommate profiles.
                    </p>

                    {/* Progress Visual */}
                    <div className="mt-6 mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-stone-500">Current Progress</span>
                        <span className="font-medium text-stone-900">{currentCompletion}%</span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-stone-200 rounded-full h-3">
                          <div
                            className="bg-primary-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${currentCompletion}%` }}
                          />
                        </div>
                        <div
                          className="absolute top-0 h-3 w-0.5 bg-stone-400"
                          style={{ left: `${requiredCompletion}%` }}
                        />
                      </div>
                      <p className="text-center text-sm text-stone-500 mt-2">
                        {remainingCompletion}% more needed
                      </p>
                    </div>

                    {/* Benefits */}
                    <div className="bg-primary-50 rounded-lg p-4 text-left">
                      <p className="text-sm font-medium text-primary-900 mb-2">
                        Complete profiles get:
                      </p>
                      <ul className="space-y-1 text-sm text-primary-700">
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-primary-600" />
                          3x more matches
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-primary-600" />
                          Higher compatibility scores
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-primary-600" />
                          Priority in search results
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      onClick={onStartProfile}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                    >
                      Complete Profile
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full px-4 py-3 bg-white text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors border border-stone-200"
                    >
                      Browse Limited Profiles
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