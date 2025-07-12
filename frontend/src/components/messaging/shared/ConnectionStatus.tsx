// frontend/src/components/messaging/shared/ConnectionStatus.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
}

export function ConnectionStatus({ isConnected, isConnecting }: ConnectionStatusProps) {
  // Show nothing when connected
  if (isConnected) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
      >
        <div className={`
          flex items-center space-x-3 px-5 py-3 rounded-full shadow-lg backdrop-blur-md
          ${isConnecting 
            ? 'bg-yellow-50/95 text-yellow-800 border border-yellow-200' 
            : 'bg-red-50/95 text-red-800 border border-red-200'
          }
        `}>
          {isConnecting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="flex-shrink-0"
              >
                <WifiIcon className="h-5 w-5" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Reconnecting...</span>
                <span className="text-xs opacity-75">Your messages will be sent when connected</span>
              </div>
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Connection lost</span>
                <span className="text-xs opacity-75">Messages will sync when reconnected</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}