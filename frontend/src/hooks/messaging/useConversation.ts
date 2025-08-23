// frontend/src/hooks/useConversation.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import apiService from '@/lib/api';
import { useWebSocket } from './useWebSocket';
import type { ConversationDetail, Message, User } from '@/types/api';
import { useRateLimit } from './useRateLimit';
import { useAuth } from '@/contexts/AuthContext';

interface UseConversationOptions {
  onUnauthorized?: () => void;
  markAsReadDelay?: number;
  enableWebSocket?: boolean;
}

export function useConversation(
  conversationId: number,
  options: UseConversationOptions = {}
) {
  const { 
    onUnauthorized, 
    markAsReadDelay = 1000,
    enableWebSocket = true 
  } = options;
  
  const router = useRouter();
  
  const { user } = useAuth();

  // Core state
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // WebSocket-related state
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  
  // Refs
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const conversationStartTimeRef = useRef<Date | null>(null);
  const typingTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  
  // IMPORTANT: Track if we've already fetched to prevent duplicates
  const hasFetchedRef = useRef(false);
  const onUnauthorizedRef = useRef(onUnauthorized);
  
  // Update ref when onUnauthorized changes
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  const { checkLimit, getRemainingAttempts } = useRateLimit(30, 60000);

  // WebSocket integration
  const { 
    sendMessage: sendWebSocketMessage, 
    isConnected 
  } = useWebSocket(
    enableWebSocket ? conversationId : null,
    {
      onMessage: handleWebSocketMessage,
      onConnect: () => {
        console.log('Connected to conversation WebSocket');
      },
      onDisconnect: () => {
        console.log('Disconnected from conversation WebSocket');
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
      }
    }
  );

  // Handle incoming WebSocket messages
  function handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'new_message':
        handleNewMessage(message.message);
        break;
        
      case 'user_typing':
        handleTypingIndicator(message.user_id, message.is_typing);
        break;
        
      case 'messages_read':
        handleReadReceipt(message.user_id, message.message_ids);
        break;
        
      case 'message_blocked':
        toast.error('Message blocked due to policy violations');
        break;
        
      case 'message_sent':
        handleMessageSent(message.temp_id, message.message_id);
        break;
        
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  // WebSocket message handlers
  const handleNewMessage = useCallback((messageData: Message) => {
    setConversation(prev => {
      if (!prev) return prev;
      
      // Check if message already exists
      const exists = prev.messages.some(m => m.id === messageData.id);
      if (exists) return prev;
      
      // Only increment unread count if message is from other user
      const isOwnMessage = messageData.sender === user?.id;
      
      return {
        ...prev,
        messages: [...prev.messages, messageData],
        latestMessage: messageData,
        unreadCount: isOwnMessage ? prev.unreadCount : prev.unreadCount + 1,
      };
    });
    
    // Play notification sound for messages from others
    const isOwnMessage = messageData.sender === user?.id;

    if (!isOwnMessage && document.hidden) {
      playNotificationSound();
    }
  }, [conversation]);

  const handleTypingIndicator = useCallback((userId: number, isTyping: boolean) => {
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      
      if (isTyping) {
        newSet.add(userId);
        
        // Clear existing timeout
        const existingTimeout = typingTimeoutRef.current.get(userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        
        // Set timeout to remove typing indicator after 3 seconds
        const timeout = setTimeout(() => {
          setTypingUsers(p => {
            const s = new Set(p);
            s.delete(userId);
            return s;
          });
        }, 3000);
        
        typingTimeoutRef.current.set(userId, timeout);
      } else {
        newSet.delete(userId);
        
        // Clear timeout
        const timeout = typingTimeoutRef.current.get(userId);
        if (timeout) {
          clearTimeout(timeout);
          typingTimeoutRef.current.delete(userId);
        }
      }
      
      return newSet;
    });
  }, []);

  const handleReadReceipt = useCallback((userId: number, messageIds: number[] | 'all') => {
    setConversation(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        messages: prev.messages.map(msg => {
          if (messageIds === 'all' || messageIds.includes(msg.id)) {
            return { ...msg, read: true, readAt: new Date().toISOString() };
          }
          return msg;
        }),
      };
    });
  }, []);

  const handleMessageSent = useCallback((tempId: number, actualId: number) => {
    // Update the temporary message ID with the actual server ID
    setConversation(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === tempId ? { ...msg, id: actualId } : msg
        ),
      };
    });
  }, []);

  // Fetch conversation data - FIXED to prevent infinite loops
  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;
    
    // Prevent duplicate fetches
    if (hasFetchedRef.current) {
      console.log('Skipping duplicate fetch');
      return;
    }
    
    try {
      setIsLoading(true);
      hasFetchedRef.current = true;
      
      const response = await apiService.messaging.getConversation(conversationId);
      setConversation(response.data);
      
      // Track response time for pending conversations
      if (response.data.status === 'pending_response' && !conversationStartTimeRef.current) {
        conversationStartTimeRef.current = new Date(response.data.createdAt);
      }
      
      return response.data;
    } catch (error: any) {
      hasFetchedRef.current = false; // Reset on error
      
      if (error.response?.status === 401 && onUnauthorizedRef.current) {
        onUnauthorizedRef.current();
      } else {
        console.error('Error fetching conversation:', error);
        toast.error('Failed to load conversation');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]); // Only depend on conversationId

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !conversation) return;
    
    try {
      if (isConnected && enableWebSocket) {
        // Send via WebSocket
        sendWebSocketMessage({ 
          type: 'mark_read', 
          message_ids: [] // Empty array means mark all as read
        });
      } else {
        // Fallback to REST API
        await apiService.messaging.markConversationRead(conversationId);
      }
      
      // Update local state immediately
      setConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          unreadCount: 0,
          messages: prev.messages.map(msg => ({ ...msg, read: true }))
        };
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [conversationId, conversation, isConnected, enableWebSocket, sendWebSocketMessage]);

  // Send a message
  const sendMessage = useCallback(async (
    content: string, 
    metadata?: any
  ): Promise<{ success: boolean; data?: any; error?: any }> => {
    if (!checkLimit()) {
    toast.error(`Rate limit exceeded. ${getRemainingAttempts()} messages remaining.`);
    return { success: false, error: 'rate_limit' };
  }

    if (!conversation || !content.trim()) {
      return { success: false, error: 'Invalid message' };
    }

    setIsSending(true);
    
    try {
      // Try WebSocket first if connected
      if (isConnected && enableWebSocket) {
        const tempId = Date.now(); // Temporary ID for optimistic update
        
        // Send via WebSocket
        const sent = sendWebSocketMessage({
          type: 'send_message',
          content: content.trim(),
          metadata,
          temp_id: tempId,
        });
        
        if (sent) {
          // Optimistically add message to UI
          const currentUserId = user?.id;

          const optimisticMessage: Message = {
            id: tempId,
            content: content.trim(),
            sender: currentUserId || 0,
            senderDetails: user ? {
              id: user.id,
              username: user.username,
              email: user.email,
              userType: user.userType,
              firstName: user.firstName,
              lastName: user.lastName,
              name: `${user.firstName} ${user.lastName}`.trim() || user.username,
              emailVerified: user.emailVerified,
              dateJoined: user.dateJoined
            } : {} as any,
            createdAt: new Date().toISOString(),
            delivered: false,
            read: false,
            messageType: 'text',
            metadata,
            isSystemMessage: false,
            hasFilteredContent: false,
            filterWarnings: [],
            isEdited: false,
            canEdit: true,
            readBy: [],
          };
          
          setConversation(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...prev.messages, optimisticMessage],
              latestMessage: optimisticMessage,
              status: prev.status === 'pending_response' ? 'active' : prev.status,
            };
          });
          
          return { success: true, data: optimisticMessage };
        }
      }
      
      // Fallback to REST API
      const response = await apiService.messaging.sendMessage(
        conversationId,
        content.trim(),
        metadata
      );

      // Check for content warnings
      if (response.data.contentWarning) {
        return {
          success: false,
          error: 'content_warning',
          data: response.data.contentWarning
        };
      }

      // Track response time if this was first response
      if (conversation.status === 'pending_response' && conversationStartTimeRef.current) {
        const responseTime = new Date().getTime() - conversationStartTimeRef.current.getTime();
        console.log('Response time:', Math.round(responseTime / 1000 / 60), 'minutes');
      }

      // Add message to local state (if not using WebSocket)
      if (!isConnected || !enableWebSocket) {
        const newMessage: Message = {
          ...response.data,
          conversation: conversationId,
        };

        setConversation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, newMessage],
            latestMessage: newMessage,
            status: prev.status === 'pending_response' ? 'active' : prev.status,
          };
        });
      }

      return { success: true, data: response.data };
    } catch (error: any) {
      if (error.response?.data?.violations) {
        return {
          success: false,
          error: 'policy_violation',
          data: error.response.data
        };
      }
      
      toast.error('Failed to send message');
      return { success: false, error };
    } finally {
      setIsSending(false);
    }
  }, [conversation, conversationId, isConnected, enableWebSocket, sendWebSocketMessage, checkLimit, getRemainingAttempts, user]);

  // Update conversation status
  const updateStatus = useCallback(async (newStatus: string) => {
    if (!conversation) return;
    
    setIsUpdatingStatus(true);
    
    try {
      // API call would go here
      // const response = await apiService.messaging.updateConversationStatus(conversationId, { status: newStatus });
      
      setConversation(prev => {
        if (!prev) return prev;
        return { ...prev, status: newStatus as any };
      });
      
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      return true;
    } catch (error) {
      toast.error('Failed to update status');
      return false;
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [conversation]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (isConnected && enableWebSocket) {
      sendWebSocketMessage({ type: 'typing_start' });
    }
  }, [isConnected, enableWebSocket, sendWebSocketMessage]);

  const stopTyping = useCallback(() => {
    if (isConnected && enableWebSocket) {
      sendWebSocketMessage({ type: 'typing_stop' });
    }
  }, [isConnected, enableWebSocket, sendWebSocketMessage]);

  // Initial fetch - FIXED to prevent infinite loops
  useEffect(() => {
    // Reset the fetch flag when conversation ID changes
    hasFetchedRef.current = false;
    
    // Fetch the conversation
    fetchConversation();
    
    // Cleanup function
    return () => {
      hasFetchedRef.current = false;
    };
  }, [conversationId]); // Only depend on conversationId, not fetchConversation

  // Mark as read with delay
  useEffect(() => {
    if (conversation && conversation.unreadCount > 0) {
      markAsReadTimeoutRef.current = setTimeout(() => {
        markAsRead();
      }, markAsReadDelay);
    }

    return () => {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
  }, [conversation?.unreadCount, markAsRead, markAsReadDelay]); // More specific dependencies

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all typing timeouts on unmount
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
      
      // Clear mark as read timeout
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Core state
    conversation,
    isLoading,
    isSending,
    isUpdatingStatus,
    
    // WebSocket state
    isConnected: enableWebSocket ? isConnected : false,
    typingUsers,
    
    // Methods
    sendMessage,
    updateStatus,
    markAsRead,
    refreshConversation: () => {
      hasFetchedRef.current = false;
      return fetchConversation();
    },
    
    // WebSocket methods
    startTyping,
    stopTyping,
  };
}

// Helper function
function playNotificationSound() {
  const audio = new Audio('/sounds/notification.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => {
    // Ignore errors (e.g., autoplay blocked)
  });
}