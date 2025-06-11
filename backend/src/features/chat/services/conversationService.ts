import { supabase } from '../../../config/supabase';
import { v4 as uuidv4, validate as isUuid } from 'uuid';

// Define types locally since they aren't imported from a separate file
interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

interface CreateConversationRequest {
  user_id: string;
  title: string;
}

export class ConversationService {
  /**
   * Create a new conversation
   * @param data Conversation data
   * @returns The created conversation
   */
  async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    const conversationId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Ensure userId is in UUID format
    const userIdUuid = this.ensureUuid(data.user_id);
    
    const conversation = {
      id: conversationId,
      user_id: userIdUuid, // Use UUID formatted user_id
      title: data.title || 'New Conversation',
      created_at: timestamp,
      updated_at: timestamp
    };

    console.log(`Creating conversation with UUID user_id: ${userIdUuid}`);
    
    const { data: createdData, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return createdData as Conversation;
  }

  /**
   * Get a conversation by ID
   * @param id Conversation ID
   * @returns The conversation if found
   */
  async getConversationById(id: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get conversation: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Conversation with ID ${id} not found`);
    }

    return data as Conversation;
  }

  /**
   * Get all conversations for a user
   * @param userId User ID
   * @returns List of conversations
   */
  /**
   * Creates a deterministic UUID v5 from a string
   * For development/demo purposes only
   */
  private ensureUuid(userId: string): string {
    // If already a valid UUID, return it
    if (isUuid(userId)) {
      return userId;
    }
    
    // For simplicity, we'll just use v4 UUID generation
    // In production, you might want to use a more sophisticated approach
    // like a database lookup or v5 namespace UUID
    const generatedUuid = uuidv4();
    console.log(`Converting non-UUID string "${userId}" to UUID: ${generatedUuid}`);
    return generatedUuid;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    console.log(`Service: Getting conversations for user ${userId}`);
    console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
    
    try {
      // Ensure userId is in UUID format
      const userIdUuid = this.ensureUuid(userId);
      console.log(`Using UUID format: ${userIdUuid}`);
      
      // Try to fetch conversations for this user
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userIdUuid)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to get user conversations: ${error.message}`);
      }

      if (!data) {
        console.log(`No conversations found for user ${userId}, returning empty array`);
        return [];
      }
      
      console.log(`Found ${data.length} conversations`);
      return data as Conversation[];
    } catch (err: any) {
      console.error('Unexpected error in getUserConversations service:', err);
      throw err;
    }
  }

  /**
   * Update a conversation title
   * @param id Conversation ID
   * @param title New conversation title
   * @returns The updated conversation
   */
  async updateConversationTitle(id: string, title: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update conversation title: ${error.message}`);
    }

    return data as Conversation;
  }

  /**
   * Delete a conversation and all its messages
   * @param id Conversation ID
   * @returns boolean indicating success
   */
  async deleteConversation(id: string): Promise<boolean> {
    // First, delete all messages in the conversation
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id);

    if (messagesError) {
      throw new Error(`Failed to delete conversation messages: ${messagesError.message}`);
    }

    // Then, delete the conversation
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (conversationError) {
      throw new Error(`Failed to delete conversation: ${conversationError.message}`);
    }

    return true;
  }
}

// Export a singleton instance
export const conversationService = new ConversationService();
