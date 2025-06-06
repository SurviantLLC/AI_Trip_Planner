import type { Message, Conversation } from "../types/chat.types";
import api from "../../../services/api";
import WebSocketService from "../../../services/websocket";
import { v4 as uuidv4 } from "uuid";

// Chat service for interacting with the backend API
export const chatService = {
  // Get or create a conversation
  getOrCreateConversation: async (userId: string, title: string = "New conversation"): Promise<Conversation> => {
    try {
      // Convert string userId to UUID format for the database
      // For development/testing, we'll generate a consistent UUID based on the userId
      const userUUID = userId.includes('-') ? userId : uuidv4();
      console.log(`Using UUID: ${userUUID} for user: ${userId}`);
      
      // Try to get the most recent conversation for the user
      const response = await api.get(`/conversations/user/${userUUID}`);
      const conversations = response.data.data;
      
      // If conversations exist, return the most recent one
      if (conversations && conversations.length > 0) {
        return conversations[0];
      }
      
      // If no conversations exist, create a new one
      const createResponse = await api.post('/conversations', { user_id: userUUID, title });
      return createResponse.data.data;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      throw new Error('Failed to get or create conversation');
    }
  },
  
  // Send a message to the backend
  sendMessage: async (conversationId: string, content: string, messageType = 'text'): Promise<Message> => {
    try {
      const response = await api.post('/chat/message', {
        conversation_id: conversationId,
        content,
        message_type: messageType
      });
      return response.data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  },

  // Get message history for a conversation
  getMessageHistory: async (conversationId: string): Promise<Message[]> => {
    try {
      const response = await api.get(`/chat/history/${conversationId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting message history:', error);
      throw new Error('Failed to get message history');
    }
  },

  // Clear a conversation's message history
  clearConversation: async (conversationId: string): Promise<boolean> => {
    try {
      await api.delete(`/chat/history/${conversationId}`);
      return true;
    } catch (error) {
      console.error('Error clearing conversation:', error);
      throw new Error('Failed to clear conversation');
    }
  },
  
  // Get list of user's conversations
  getUserConversations: async (userId: string): Promise<Conversation[]> => {
    try {
      // Convert string userId to UUID format for the database
      const userUUID = userId.includes('-') ? userId : uuidv4();
      
      const response = await api.get(`/conversations/user/${userUUID}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  },
  
  // Delete a conversation
  deleteConversation: async (conversationId: string, userId: string): Promise<boolean> => {
    try {
      // Convert string userId to UUID format for the database
      const userUUID = userId.includes('-') ? userId : uuidv4();
      
      await api.delete(`/conversations/${conversationId}`, { data: { user_id: userUUID } });
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  },
  
  // Connect to WebSocket for real-time messaging
  connectToWebSocket: (userId: string, conversationId: string, onNewMessage: (message: Message) => void) => {
    // Convert string userId to UUID format for the database
    const userUUID = userId.includes('-') ? userId : uuidv4();
    console.log(`Connecting WebSocket with UUID: ${userUUID} for user: ${userId}`);
    
    const wsService = WebSocketService.getInstance();
    const socket = wsService.connect(userUUID);
    
    // Join the conversation room
    socket.emit('joinConversation', conversationId);
    
    // Listen for new messages
    socket.on('newMessage', (message: Message) => {
      if (message.conversation_id === conversationId) {
        onNewMessage(message);
      }
    });
    
    return () => {
      // Cleanup function to remove listeners when component unmounts
      socket.off('newMessage');
      socket.emit('leaveConversation', conversationId);
    };
  }
}
