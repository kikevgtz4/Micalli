// frontend/src/hooks/useConversationList.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '@/lib/api';
import type { Conversation } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { useConversationListWebSocket } from './useConversationListWebSocket';

interface ConversationFilters {
  type?: 'property_inquiry' | 'roommate_inquiry' | 'general';
  status?: string;
  property?: number;
  unreadOnly?: boolean;
}

export function useConversationList(initialFilters: ConversationFilters = {}) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ConversationFilters>(initialFilters);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    pending: 0,
    today: 0,
  });

  // Add WebSocket integration
  useConversationListWebSocket({
    conversations,
    setConversations,
    userId: user?.id || 0,
  });

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await apiService.messaging.getConversations(filters);
      const conversationData = response.data.results || response.data;
      const conversations = Array.isArray(conversationData) ? conversationData : [];
      
      setConversations(conversations);
      
      // Calculate stats
      const today = new Date().toDateString();
      setStats({
        total: conversations.length,
        unread: conversations.filter(c => c.unreadCount > 0).length,
        pending: conversations.filter(c => c.status === 'pending_response').length,
        today: conversations.filter(c => new Date(c.createdAt).toDateString() === today).length,
      });
      
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
      setConversations([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Recalculate stats when conversations change (from WebSocket updates)
    const today = new Date().toDateString();
    setStats({
      total: conversations.length,
      unread: conversations.filter(c => c.unreadCount > 0).length,
      pending: conversations.filter(c => c.status === 'pending_response').length,
      today: conversations.filter(c => new Date(c.createdAt).toDateString() === today).length,
    });
  }, [conversations]);

  const updateFilters = useCallback((newFilters: Partial<ConversationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const markAsRead = useCallback(async (conversationId: number) => {
    try {
      await apiService.messaging.markConversationRead(conversationId);
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    filters,
    stats,
    updateFilters,
    refreshConversations: fetchConversations,
    markAsRead,
  };
}