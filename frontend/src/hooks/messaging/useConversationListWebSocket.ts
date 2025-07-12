// frontend/src/hooks/useConversationListWebSocket.ts
import { useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import type { Conversation, Message } from '@/types/api';

interface UseConversationListWebSocketOptions {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  userId: number;
}

export function useConversationListWebSocket({
  conversations,
  setConversations,
  userId,
}: UseConversationListWebSocketOptions) {
  // WebSocket connection for conversation list updates
  const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/conversations/?token=${localStorage.getItem('accessToken')}`;
  
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('Connected to conversation list WebSocket');
          reconnectAttempts = 0;
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        ws.onclose = (event) => {
          console.log('Conversation list WebSocket disconnected:', event.code);
          
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectTimeout = setTimeout(connect, delay);
          }
        };
        
        ws.onerror = (error) => {
          console.error('Conversation list WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
    };
    
    const handleWebSocketMessage = (data: any) => {
      switch (data.type) {
        case 'conversation_updated':
          updateConversation(data.conversation);
          break;
          
        case 'new_message':
          handleNewMessage(data.conversation_id, data.message);
          break;
          
        case 'conversation_status_changed':
          updateConversationStatus(data.conversation_id, data.status);
          break;
          
        case 'typing_status':
          // Optional: Show typing indicators in list
          break;
      }
    };
    
    const updateConversation = (updatedConversation: Conversation) => {
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === updatedConversation.id);
        if (index === -1) {
          // New conversation, add to top
          return [updatedConversation, ...prev];
        }
        // Update existing conversation
        const newConversations = [...prev];
        newConversations[index] = updatedConversation;
        // Sort by latest message
        return newConversations.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    };
    
    const handleNewMessage = (conversationId: number, message: Message) => {
      setConversations(prev => {
        const newConversations = prev.map(conv => {
          if (conv.id === conversationId) {
            const isOwnMessage = message.sender === userId;
            return {
              ...conv,
              latestMessage: message,
              updatedAt: message.createdAt,
              unreadCount: isOwnMessage ? conv.unreadCount : conv.unreadCount + 1,
            };
          }
          return conv;
        });
        
        // Sort by latest message
        return newConversations.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
      
      // Show notification for new messages
      if (message.sender !== userId && document.hidden) {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
    };
    
    const updateConversationStatus = (conversationId: number, status: string) => {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, status: status as any } : conv
        )
      );
    };
    
    // Connect on mount
    connect();
    
    // Cleanup
    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close(1000, 'Component unmount');
      }
    };
  }, [wsUrl, userId, setConversations]);
}