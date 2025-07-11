// frontend/src/components/messaging/shared/TypingIndicator.tsx
import { motion, AnimatePresence } from 'framer-motion';
import type { UserBrief } from '@/types/api';

interface TypingIndicatorProps {
  typingUsers: Set<number>;
  participants: UserBrief[];
  currentUserId: number;
}

export function TypingIndicator({ 
  typingUsers, 
  participants, 
  currentUserId 
}: TypingIndicatorProps) {
  const typingUsersList = Array.from(typingUsers)
    .filter(id => id !== currentUserId)
    .map(id => participants.find(p => p.id === id))
    .filter(Boolean) as UserBrief[];
    
  if (typingUsersList.length === 0) return null;
  
  const getTypingText = () => {
    if (typingUsersList.length === 1) {
      return `${typingUsersList[0].name || typingUsersList[0].username} is typing`;
    } else if (typingUsersList.length === 2) {
      return `${typingUsersList[0].name} and ${typingUsersList[1].name} are typing`;
    } else {
      return `${typingUsersList.length} people are typing`;
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center space-x-2 px-4 py-2 text-sm text-neutral-500"
      >
        <div className="flex space-x-1">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-neutral-400 rounded-full"
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 bg-neutral-400 rounded-full"
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 bg-neutral-400 rounded-full"
          />
        </div>
        <span>{getTypingText()}</span>
      </motion.div>
    </AnimatePresence>
  );
}