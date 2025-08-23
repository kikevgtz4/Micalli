import { useEffect, useRef } from 'react';

interface QueuedMessage {
  id: string;
  conversationId: number;
  content: string;
  metadata?: any;
  timestamp: number;
  retries: number;
}

export function useMessageQueue() {
  const queueRef = useRef<QueuedMessage[]>([]);
  const processingRef = useRef(false);
  
  // Load queue from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('messageQueue');
    if (saved) {
      try {
        queueRef.current = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load message queue:', e);
      }
    }
  }, []);
  
  const addToQueue = (message: Omit<QueuedMessage, 'id' | 'timestamp' | 'retries'>) => {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };
    
    queueRef.current.push(queuedMessage);
    localStorage.setItem('messageQueue', JSON.stringify(queueRef.current));
    
    return queuedMessage.id;
  };
  
  const removeFromQueue = (id: string) => {
    queueRef.current = queueRef.current.filter(m => m.id !== id);
    localStorage.setItem('messageQueue', JSON.stringify(queueRef.current));
  };
  
  const processQueue = async (sendFunction: (msg: QueuedMessage) => Promise<boolean>) => {
    if (processingRef.current || queueRef.current.length === 0) return;
    
    processingRef.current = true;
    
    for (const message of [...queueRef.current]) {
      try {
        const success = await sendFunction(message);
        if (success) {
          removeFromQueue(message.id);
        } else {
          message.retries++;
          if (message.retries > 3) {
            removeFromQueue(message.id);
          }
        }
      } catch (error) {
        console.error('Failed to process queued message:', error);
      }
    }
    
    processingRef.current = false;
  };
  
  return {
    addToQueue,
    removeFromQueue,
    processQueue,
    getQueueSize: () => queueRef.current.length,
  };
}