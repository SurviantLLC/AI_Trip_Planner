"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageService = exports.MessageService = void 0;
const supabase_1 = require("../../../config/supabase");
const uuid_1 = require("uuid");
const index_1 = require("../../../index");
// Import OpenAI service directly
const openai_1 = __importDefault(require("openai"));
// Create a local instance of the OpenAI service to avoid import issues
class LocalOpenAIService {
    constructor() {
        // Initialize OpenAI client with API key from environment variables
        this.client = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        if (!process.env.OPENAI_API_KEY) {
            console.warn('WARNING: OPENAI_API_KEY is not set in environment variables');
        }
        else {
            console.log('OpenAI service initialized successfully');
        }
    }
    async generateResponse(messages) {
        try {
            const formattedMessages = [
                {
                    role: 'system',
                    content: 'You are an intelligent travel assistant. Help users plan trips, find flights, hotels, and attractions. Provide concise, helpful responses.'
                },
                ...messages
            ];
            console.log('Sending request to OpenAI API with', formattedMessages.length, 'messages');
            const completion = await this.client.chat.completions.create({
                model: 'gpt-4o',
                messages: formattedMessages,
                max_tokens: 500
            });
            return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response at this time.';
        }
        catch (error) {
            console.error('Error generating OpenAI response:', error?.message || error);
            return 'Sorry, I encountered an error while processing your request. Please try again later.';
        }
    }
}
// Create singleton instance
const openAIService = new LocalOpenAIService();
class MessageService {
    /**
     * Create a new message
     * @param data Message data
     * @returns The created message
     */
    async createMessage(data, role = 'user') {
        // Filter out 'system' message type and default to 'text' if needed
        let messageType = 'text';
        if (data.message_type && data.message_type !== 'system') {
            messageType = data.message_type;
        }
        const message = {
            id: (0, uuid_1.v4)(),
            conversation_id: data.conversation_id,
            role,
            content: data.content,
            message_type: messageType,
            created_at: new Date().toISOString()
        };
        const { data: insertedMessage, error } = await supabase_1.supabase
            .from('messages')
            .insert(message)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create message: ${error.message}`);
        }
        // Update the conversation's updated_at timestamp
        await supabase_1.supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', data.conversation_id);
        // Emit the new message via Socket.io if we're in a server context
        if (index_1.io) {
            index_1.io.to(data.conversation_id).emit('newMessage', insertedMessage);
        }
        return insertedMessage;
    }
    /**
     * Generate an AI response to a user message
     * @param userMessage User message to respond to
     * @returns The AI response message
     */
    async generateAIResponse(userMessage) {
        try {
            // Get previous messages from this conversation for context
            const { data: previousMessages } = await supabase_1.supabase
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
            const aiResponseContent = await openAIService.generateResponse(formattedMessages);
            // Create response message
            const responseData = {
                conversation_id: userMessage.conversation_id,
                content: aiResponseContent,
                message_type: 'text'
            };
            console.log('AI response generated successfully');
            // Create and save the AI message
            return this.createMessage(responseData, 'assistant');
        }
        catch (error) {
            console.error('Error generating AI response:', error?.message || error);
            // Create fallback response in case of errors
            const fallbackResponse = {
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
    async getConversationMessages(conversationId) {
        const { data, error } = await supabase_1.supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at');
        if (error) {
            throw new Error(`Failed to get conversation messages: ${error.message}`);
        }
        return data;
    }
    /**
     * Delete a specific message
     * @param messageId Message ID to delete
     * @returns boolean indicating success
     */
    async deleteMessage(messageId) {
        const { error } = await supabase_1.supabase
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
    async clearConversationHistory(conversationId) {
        const { error } = await supabase_1.supabase
            .from('messages')
            .delete()
            .eq('conversation_id', conversationId);
        if (error) {
            throw new Error(`Failed to clear conversation history: ${error.message}`);
        }
        return true;
    }
}
exports.MessageService = MessageService;
// Export a singleton instance
exports.messageService = new MessageService();
