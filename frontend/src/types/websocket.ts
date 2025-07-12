// frontend/src/types/websocket.ts
import { Conversation, Message } from "./api";

export interface BaseWebSocketMessage {
  type: string;
  timestamp?: string;
}

export interface MessageSentEvent extends BaseWebSocketMessage {
  type: 'message_sent';
  message_id: number;
  temp_id?: number;
  timestamp: string;
}

export interface NewMessageEvent extends BaseWebSocketMessage {
  type: 'new_message';
  message: Message;
}

export interface TypingEvent extends BaseWebSocketMessage {
  type: 'user_typing';
  user_id: number;
  is_typing: boolean;
}

export interface ReadReceiptEvent extends BaseWebSocketMessage {
  type: 'messages_read';
  user_id: number;
  message_ids: number[];
}

export interface OnlineStatusEvent extends BaseWebSocketMessage {
  type: 'user_online_status';
  user_id: number;
  is_online: boolean;
  last_seen?: string;
}

export interface ConversationUpdateEvent extends BaseWebSocketMessage {
  type: 'conversation_updated';
  conversation: Conversation;
}

export interface ErrorEvent extends BaseWebSocketMessage {
  type: 'error';
  error: string;
  code?: string;
}

export type WebSocketMessage =
  | MessageSentEvent
  | NewMessageEvent
  | TypingEvent
  | ReadReceiptEvent
  | OnlineStatusEvent
  | ConversationUpdateEvent
  | ErrorEvent;

// Client to server messages
export interface SendMessageCommand {
  type: 'send_message';
  content: string;
  metadata?: Record<string, any>;
  temp_id?: number;
}

export interface TypingCommand {
  type: 'typing_start' | 'typing_stop';
}

export interface MarkReadCommand {
  type: 'mark_read';
  message_ids: number[];
}

export type WebSocketCommand =
  | SendMessageCommand
  | TypingCommand
  | MarkReadCommand;