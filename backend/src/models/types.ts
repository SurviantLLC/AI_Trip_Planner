// Define the role type for messages
export type MessageRole = 'user' | 'assistant' | 'system';

// Define message types
export type MessageType = 'text' | 'image' | 'file' | 'location';

// Define the structure for a message
export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  message_type: MessageType;
  created_at: string;
}

// Define the structure for a conversation
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Define request body for creating a new message
export interface CreateMessageRequest {
  conversation_id: string;
  content: string;
  message_type?: MessageType; // Optional, defaults to 'text'
}

// Define request body for creating a new conversation
export interface CreateConversationRequest {
  user_id: string;
  title: string;
}

// Define the structure for API responses
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}
