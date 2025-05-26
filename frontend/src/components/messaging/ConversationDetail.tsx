// src/components/messaging/ConversationDetail.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';

interface Message {
  id: number;
  content: string;
  sender: number;
  sender_details: {
    id: number;
    username: string;
    name: string;
    profile_picture: string | null;
  };
  created_at: string;
  read: boolean;
}

interface Conversation {
  id: number;
  participants_details: any[];
  property_details?: any;
  messages: Message[];
}

export default function ConversationDetail({ conversationId }: { conversationId: number }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversation = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.messaging.getConversation(conversationId);
      setConversation(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError('Failed to load the conversation. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
    
    // Set up a polling mechanism to check for new messages
    const intervalId = setInterval(fetchConversation, 10000); // Poll every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      setIsSending(true);
      await apiService.messaging.sendMessage(conversationId, newMessage);
      setNewMessage('');
      await fetchConversation(); // Refresh conversation to show new message
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages
    }));
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading conversation...</div>;
  }

  if (error || !conversation) {
    return (
      <div className="p-4 text-center text-error-500">
        {error || 'Conversation not found'}
        <button
          onClick={() => router.push('/messages')}
          className="block mx-auto mt-4 text-primary-600 hover:text-primary-700 transition-colors"
        >
          Back to all conversations
        </button>
      </div>
    );
  }

  const getOtherParticipant = () => {
    // Find the participant that isn't the current user
    return conversation.participants_details.find(p => p.id !== user?.id) || conversation.participants_details[0];
  };

  const otherParticipant = getOtherParticipant();
  const messageGroups = groupMessagesByDate(conversation.messages || []);

  return (
    <div className="flex flex-col h-full bg-surface rounded-lg shadow overflow-hidden">
      {/* Conversation header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/messages')}
            className="mr-2 text-stone-500 hover:text-stone-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-medium text-stone-900">{otherParticipant.name}</h2>
            {conversation.property_details && (
              <p className="text-sm text-stone-500">{conversation.property_details.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 bg-stone-50">
        {messageGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <div className="text-center mb-4">
              <span className="px-2 py-1 bg-stone-200 text-stone-600 text-xs rounded-full">
                {formatDate(group.date)}
              </span>
            </div>
            {group.messages.map((message) => {
              const isCurrentUser = message.sender_details.id === user?.id;
              
              return (
                <div 
                  key={message.id} 
                  className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`rounded-lg px-4 py-2 max-w-xs lg:max-w-md ${
                      isCurrentUser 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-surface border text-stone-900'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-indigo-200' : 'text-stone-500'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="bg-primary-500 text-white px-4 py-2 rounded-r-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}