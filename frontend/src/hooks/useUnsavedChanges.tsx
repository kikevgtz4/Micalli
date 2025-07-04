// frontend/src/hooks/useUnsavedChanges.tsx
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { DialogDescription } from '@radix-ui/react-dialog';

interface UseUnsavedChangesProps {
  hasChanges: boolean;
  onSave?: () => Promise<void>;
  onDiscard?: () => void;
}

export function useUnsavedChanges({ hasChanges, onSave, onDiscard }: UseUnsavedChangesProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [nextRoute, setNextRoute] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // Handle browser back/forward and page reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && !isLeaving) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isLeaving]);

  // Handle Next.js route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (hasChanges && !isLeaving) {
        setNextRoute(url);
        setShowDialog(true);
        throw 'Route change aborted due to unsaved changes';
      }
    };

    // For Next.js 13+ with app directory
    const originalPush = router.push;
    router.push = (...args: Parameters<typeof router.push>) => {
      const [url] = args;
      if (hasChanges && !isLeaving) {
        setNextRoute(url as string);
        setShowDialog(true);
        return Promise.reject('Route change aborted');
      }
      return originalPush.apply(router, args);
    };

    return () => {
      router.push = originalPush;
    };
  }, [router, hasChanges, isLeaving]);

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave();
      }
      setIsLeaving(true);
      setShowDialog(false);
      if (nextRoute) {
        router.push(nextRoute);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard();
    }
    setIsLeaving(true);
    setShowDialog(false);
    if (nextRoute) {
      router.push(nextRoute);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setNextRoute(null);
  };

  const UnsavedChangesDialog = () => (
    <Dialog
      open={showDialog}
      onClose={handleCancel}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-neutral-900">
              Unsaved Changes
            </DialogTitle>
          </div>
          
          <DialogDescription className="text-neutral-600 mb-6">
            You have unsaved changes. What would you like to do?
          </DialogDescription>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition"
            >
              Stay on Page
            </button>
            <button
              onClick={handleDiscard}
              className="px-4 py-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Save & Leave
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );

  return { Dialog: UnsavedChangesDialog };
}