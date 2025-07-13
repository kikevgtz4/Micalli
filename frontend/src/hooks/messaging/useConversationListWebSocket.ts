// frontend/src/hooks/messaging/useConversationListWebSocket.ts
import { useEffect } from 'react';
import { getWebSocketUrl, WebSocketError } from '@/utils/websocket';
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
  useEffect(() => {
    if (!userId) {
      console.log('No userId provided, skipping WebSocket connection');
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connect = () => {
      try {
        // Get the WebSocket URL
        const wsUrl = getWebSocketUrl('/conversations/');
        console.log('🔌 Attempting WebSocket connection to:', wsUrl);
        
        ws = new WebSocket(wsUrl);
        
        // Add readyState logging
        console.log('WebSocket readyState after creation:', ws.readyState);
        
        ws.onopen = () => {
          console.log('✅ Connected to conversation list WebSocket');
          console.log('WebSocket readyState:', ws?.readyState);
          reconnectAttempts = 0;
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Received WebSocket message:', data.type);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          
          // Common close codes for debugging
          const closeReasons: Record<number, string> = {
            1000: 'Normal closure',
            1001: 'Going away',
            1002: 'Protocol error',
            1003: 'Unsupported data',
            1006: 'Abnormal closure',
            1007: 'Invalid frame payload data',
            1008: 'Policy violation',
            1009: 'Message too big',
            1010: 'Missing extension',
            1011: 'Internal error',
            1012: 'Service restart',
            1013: 'Try again later',
            1014: 'Bad gateway',
            1015: 'TLS handshake',
            4001: 'Unauthorized',
            4003: 'Forbidden'
          };
          
          console.log('Close reason:', closeReasons[event.code] || 'Unknown');
          
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`⏱️ Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
            reconnectTimeout = setTimeout(connect, delay);
          }
        };
        
        ws.onerror = (error) => {
          console.error('❌ WebSocket error event:', error);
          console.error('WebSocket URL was:', wsUrl);
          console.error('WebSocket readyState:', ws?.readyState);
          
          // Try to get more info about the connection
          if (ws) {
            console.error('WebSocket details:', {
              url: ws.url,
              readyState: ws.readyState,
              protocol: ws.protocol,
              extensions: ws.extensions,
              bufferedAmount: ws.bufferedAmount
            });
          }
        };
      } catch (error) {
        if (error instanceof WebSocketError) {
          console.error('❌ WebSocket configuration error:', error.message);
          return;
        }
        console.error('❌ Failed to create WebSocket connection:', error);
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
    console.log('🚀 Starting WebSocket connection for userId:', userId);
    connect();
    
    // Cleanup
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close(1000, 'Component unmount');
      }
    };
  }, [userId, setConversations]);
}