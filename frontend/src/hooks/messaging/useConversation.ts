// frontend/src/hooks/useConversation.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import apiService from '@/lib/api';
import { useWebSocket } from './useWebSocket';
import type { ConversationDetail, Message } from '@/types/api';

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
  
  // Core state (from your original)
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // New WebSocket-related state
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  
  // Refs (from your original + new ones)
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const conversationStartTimeRef = useRef<Date | null>(null);
  const typingTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // WebSocket integration (only if enabled)
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
        // Update the optimistic message with server data
        handleMessageSent(message.message_id, message.timestamp);
        break;
        
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  // WebSocket message handlers
  const handleNewMessage = useCallback((messageData: Message) => {
    setConversation(prev => {
      if (!prev) return prev;
      
      // Check if message already exists (prevent duplicates)
      const exists = prev.messages.some(m => m.id === messageData.id);
      if (exists) return prev;
      
      // Only increment unread count if message is from other user
      const isOwnMessage = messageData.sender === prev.participants.find(p => p !== prev.otherParticipant?.id);
      
      return {
        ...prev,
        messages: [...prev.messages, messageData],
        latestMessage: messageData,
        unreadCount: isOwnMessage ? prev.unreadCount : prev.unreadCount + 1,
      };
    });
    
    // Play notification sound for messages from others
    const isOwnMessage = messageData.sender === conversation?.participants.find(p => p !== conversation?.otherParticipant?.id);
    if (!isOwnMessage) {
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

  const handleReadReceipt = useCallback((userId: number, messageIds: number[]) => {
    setConversation(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        messages: prev.messages.map(msg => {
          if (messageIds.includes(msg.id) || (messageIds.length === 0 && msg.sender !== userId)) {
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

  // Fetch conversation data (from your original)
  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      setIsLoading(true);
      const response = await apiService.messaging.getConversation(conversationId);
      setConversation(response.data);
      
      // Track response time for pending conversations
      if (response.data.status === 'pending_response' && !conversationStartTimeRef.current) {
        conversationStartTimeRef.current = new Date(response.data.createdAt);
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401 && onUnauthorized) {
        onUnauthorized();
      } else {
        console.error('Error fetching conversation:', error);
        toast.error('Failed to load conversation');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, onUnauthorized]);

  // Mark messages as read (enhanced with WebSocket)
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

  // Send a message (enhanced with WebSocket)
  const sendMessage = useCallback(async (
    content: string, 
    metadata?: any
  ): Promise<{ success: boolean; data?: any; error?: any }> => {
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
          const currentUser = conversation.participants.find(p => p !== conversation.otherParticipant?.id);
          const optimisticMessage: Message = {
            id: tempId,
            content: content.trim(),
            sender: currentUser || 0,
            senderDetails: conversation.participantsDetails.find(p => p.id === currentUser) || {} as any,
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
  }, [conversation, conversationId, isConnected, enableWebSocket, sendWebSocketMessage]);

  // Update conversation status (from your original)
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
  }, [conversation, conversationId]);

  // Typing indicators (new WebSocket features)
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

  // Initial fetch (from your original)
  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Mark as read with delay (from your original)
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
  }, [conversation, markAsRead, markAsReadDelay]);

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, []);

  return {
    // Core state (from your original)
    conversation,
    isLoading,
    isSending,
    isUpdatingStatus,
    
    // WebSocket state (new)
    isConnected: enableWebSocket ? isConnected : false,
    typingUsers,
    
    // Methods (original + new)
    sendMessage,
    updateStatus,
    markAsRead,
    refreshConversation: fetchConversation,
    
    // WebSocket methods (new)
    startTyping,
    stopTyping,
  };
}

// Helper function
function playNotificationSound() {
  // Only play sound if page is not focused
  if (document.hidden) {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore errors (e.g., autoplay blocked)
    });
  }
}