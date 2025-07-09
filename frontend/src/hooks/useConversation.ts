// frontend/src/hooks/useConversation.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import apiService from '@/lib/api';
import type { ConversationDetail, Message } from '@/types/api';

interface UseConversationOptions {
  onUnauthorized?: () => void;
  markAsReadDelay?: number;
}

export function useConversation(
  conversationId: number,
  options: UseConversationOptions = {}
) {
  const { onUnauthorized, markAsReadDelay = 1000 } = options;
  const router = useRouter();
  
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const conversationStartTimeRef = useRef<Date | null>(null);

  // Fetch conversation data
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

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !conversation) return;
    
    try {
      await apiService.messaging.markConversationRead(conversationId);
      
      // Update local state
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
  }, [conversationId, conversation]);

  // Send a message
  const sendMessage = useCallback(async (
    content: string, 
    metadata?: any
  ): Promise<{ success: boolean; data?: any; error?: any }> => {
    if (!conversation || !content.trim()) {
      return { success: false, error: 'Invalid message' };
    }

    setIsSending(true);
    
    try {
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

      // Add message to local state optimistically
      const newMessage: Message = {
        ...response.data,
        sender: conversation.participants.find(p => p !== conversation.otherParticipant?.id) || 0,
        senderDetails: response.data.senderDetails,
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
  }, [conversation, conversationId]);

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
  }, [conversation, conversationId]);

  // Initial fetch
  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

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
  }, [conversation, markAsRead, markAsReadDelay]);

  return {
    conversation,
    isLoading,
    isSending,
    isUpdatingStatus,
    sendMessage,
    updateStatus,
    markAsRead,
    refreshConversation: fetchConversation,
  };
}