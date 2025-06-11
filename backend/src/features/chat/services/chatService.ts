import { supabase } from '../../../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageType, MessageRole } from '../models/message.model';

// Extended message type that includes 'system' for internal communications
type ExtendedMessageType = MessageType | 'system';
import { io } from '../../../index';
// Import our enhanced OpenAI service with travel intent detection
import openAIService from './openai.service';


// Define request type locally if it's not exported elsewhere
interface CreateMessageRequest {
  conversation_id: string;
  content: string;
  message_type?: ExtendedMessageType;
}

export class MessageService {
  /**
   * Create a new message
   * @param data Message data
   * @returns The created message
   */
  async createMessage(data: CreateMessageRequest, role: MessageRole = 'user'): Promise<Message> {
    // Filter out 'system' message type and default to 'text' if needed
    let messageType: MessageType = 'text';
    if (data.message_type && data.message_type !== 'system') {
      messageType = data.message_type as MessageType;
    }

    const message: Message = {
      id: uuidv4(),
      conversation_id: data.conversation_id,
      role,
      content: data.content,
      message_type: messageType,
      created_at: new Date().toISOString()
    };

    const { data: insertedMessage, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }

    // Update the conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', data.conversation_id);

    // Emit the new message via Socket.io if we're in a server context
    if (io) {
      io.to(data.conversation_id).emit('newMessage', insertedMessage);
    }

    return insertedMessage as Message;
  }

  /**
   * Generate an AI response to a user message
   * @param userMessage User message to respond to
   * @returns The AI response message
   */
  async generateAIResponse(userMessage: Message): Promise<Message> {
    try {
      // Get previous messages from this conversation for context
      const { data: previousMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', userMessage.conversation_id)
        .order('created_at', { ascending: true });
      
      // No limit on messages to ensure we have the full conversation context
      // Format messages for OpenAI API - ensure all messages are included for context
      console.log(`Found ${previousMessages?.length || 0} previous messages in conversation`);
      
      // Make sure messages are properly formatted for OpenAI with correct roles
      const formattedMessages = previousMessages?.map(msg => {
        // Ensure role is one of the valid OpenAI roles
        let role = msg.role;
        if (role !== 'user' && role !== 'assistant' && role !== 'system') {
          role = 'user'; // Default to user if unexpected role
        }
        return {
          role: role,
          content: msg.content
        };
      }) || [];
      
      // Log conversation context being sent to OpenAI
      console.log('Conversation context length:', formattedMessages.length);
      formattedMessages.forEach((msg, i) => {
        console.log(`Message ${i} (${msg.role}): ${msg.content.substring(0, 30)}...`);
      });
      
      // Check if openAIService is properly imported and initialized
      if (!openAIService || typeof openAIService.generateResponse !== 'function') {
        console.error('OpenAI service is not properly initialized');
        throw new Error('OpenAI service unavailable');
      }
      
      // Get AI response using OpenAI with the full conversation context
      console.log('Generating AI response to:', userMessage.content);
      
      // Convert formatted messages to the Message type expected by our enhanced OpenAI service
      const messagesForAI = formattedMessages.map(msg => ({
        id: '', // id is required but won't be used by the AI service
        conversation_id: userMessage.conversation_id,
        role: msg.role as MessageRole,
        content: msg.content,
        message_type: 'text' as MessageType,
        created_at: new Date().toISOString()
      }));
      
      const aiResponseContent = await openAIService.generateResponse(messagesForAI);
      
      // Create response message
      const responseData: CreateMessageRequest = {
        conversation_id: userMessage.conversation_id,
        content: aiResponseContent,
        message_type: 'text'
      };
      
      console.log('AI response generated successfully');
      
      // Create and save the AI message
      return this.createMessage(responseData, 'assistant');
    } catch (error: any) {
      console.error('Error generating AI response:', error?.message || error);
      
      // Create fallback response in case of errors
      const fallbackResponse: CreateMessageRequest = {
        conversation_id: userMessage.conversation_id,
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        message_type: 'text'
      };
      
      return this.createMessage(fallbackResponse, 'assistant');
    }
  }

  /**
   * Get all messages for a conversation
   * @param conversationId Conversation ID
   * @returns List of messages in the conversation
   */
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at');

    if (error) {
      throw new Error(`Failed to get conversation messages: ${error.message}`);
    }

    return data as Message[];
  }

  /**
   * Delete a specific message
   * @param messageId Message ID to delete
   * @returns boolean indicating success
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }

    return true;
  }

  /**
   * Delete all messages in a conversation
   * @param conversationId Conversation ID
   * @returns boolean indicating success
   */
  async clearConversationHistory(conversationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (error) {
      throw new Error(`Failed to clear conversation history: ${error.message}`);
    }

    return true;
  }
}

// Export a singleton instance
export const messageService = new MessageService();
