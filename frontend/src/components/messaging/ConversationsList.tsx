// src/components/messaging/ConversationsList.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/api';

interface Conversation {
  id: number;
  participants_details: any[];
  latest_message: {
    content: string;
    created_at: string;
  };
  property_details?: any;
  unread_count: number;
}

export default function ConversationsList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.messaging.getConversations();
        setConversations(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to load conversations:', err);
        setError('Failed to load conversations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const getOtherParticipant = (conversation: Conversation) => {
    // Find the other participant (not the current user)
    // This is a simplification - you'll need to compare with the current user's ID
    return conversation.participants_details[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading conversations...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-error-500">{error}</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center border rounded-lg">
        <p className="text-stone-600 mb-4">You don't have any conversations yet.</p>
        <p className="text-sm text-stone-500">
          Start a conversation by contacting a property owner or potential roommate.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-medium text-stone-900">Messages</h2>
      </div>
      <ul className="divide-y divide-stone-100">
        {conversations.map((conversation) => {
          const otherParticipant = getOtherParticipant(conversation);
          return (
            <li key={conversation.id}>
              <div 
                className={`block hover:bg-stone-50 px-4 py-4 sm:px-6 cursor-pointer ${
                  conversation.unread_count > 0 ? 'bg-primary-50' : ''
                }`}
                onClick={() => router.push(`/messages/${conversation.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <div className="flex items-center">
                      <p className="font-medium text-stone-900 truncate">
                        {otherParticipant.name}
                      </p>
                      {conversation.property_details && (
                        <span className="ml-2 text-sm text-stone-500">
                          • {conversation.property_details.title}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-stone-600 truncate">
                      {conversation.latest_message?.content || 'No messages yet'}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                    <p className="text-xs text-stone-500">
                      {conversation.latest_message ? 
                        formatDate(conversation.latest_message.created_at) : ''}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}