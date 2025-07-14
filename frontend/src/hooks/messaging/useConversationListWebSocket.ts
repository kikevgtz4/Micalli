// frontend/src/hooks/messaging/useConversationListWebSocket.ts
import { useEffect, useRef } from 'react';
import { getWebSocketUrl, WebSocketError, wsManager } from '@/utils/websocket';
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
  const connectionKeyRef = useRef<string>('');
  
  useEffect(() => {
    if (!userId) {
      console.log('No userId provided, skipping WebSocket connection');
      return;
    }

    connectionKeyRef.current = `conversations-${userId}`;
    let isIntentionalClose = false;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connect = () => {
      if (isIntentionalClose) return;
      
      try {
        const wsUrl = getWebSocketUrl('/conversations/');
        console.log('🔌 Connecting to conversation list WebSocket');
        
        // Use connection manager to prevent duplicates
        const ws = wsManager.getConnection(connectionKeyRef.current, wsUrl, {
          onopen: () => {
            console.log('✅ Connected to conversation list WebSocket');
            reconnectAttempts = 0;
          },
          
          onmessage: (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('📨 Received WebSocket message:', data.type);
              
              // Handle connection_established separately
              if (data.type === 'connection_established') {
                console.log('Connection established for user:', data.user_id);
                return;
              }
              
              handleWebSocketMessage(data);
            } catch (error) {
              console.error('Failed to parse WebSocket message:', error);
            }
          },
          
          onclose: (event) => {
            console.log('🔌 WebSocket disconnected:', {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean
            });
            
            // Handle auth errors
            if (event.code === 4001) {
              console.error('Authentication required for WebSocket');
              return;
            }
            
            // Only reconnect if not intentionally closed and under max attempts
            if (!isIntentionalClose && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
              reconnectAttempts++;
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
              console.log(`⏱️ Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
              reconnectTimeout = setTimeout(connect, delay);
            }
          },
          
          onerror: (error) => {
            console.error('❌ WebSocket error');
          }
        });
        
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
    
    // Connect with small delay to avoid React double-render
    const connectTimer = setTimeout(() => {
      console.log('🚀 Starting WebSocket connection for userId:', userId);
      connect();
    }, 100);
    
    // Cleanup
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      isIntentionalClose = true;
      clearTimeout(connectTimer);
      clearTimeout(reconnectTimeout);
      wsManager.closeConnection(connectionKeyRef.current);
    };
  }, [userId]); // Only depend on userId
}