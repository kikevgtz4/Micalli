// frontend/src/components/messaging/shared/ConnectionStatus.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
}

export function ConnectionStatus({ isConnected, isConnecting }: ConnectionStatusProps) {
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
          flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg
          ${isConnecting 
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
          }
        `}>
          {isConnecting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <WifiIcon className="h-5 w-5" />
              </motion.div>
              <span className="text-sm font-medium">Connecting...</span>
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Connection lost. Retrying...</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}