import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { conversationService } from '../services/conversation.service';
import { CreateConversationRequest } from '../models/types';

export class ConversationController {
  /**
   * Create a new conversation
   * @route POST /api/conversations
   */
  async createConversation(req: Request, res: Response) {
    try {
      const data = req.body as CreateConversationRequest;
      
      // Validate required fields
      if (!data.user_id || !data.title) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'User ID and title are required'
        });
      }
      
      const conversation = await conversationService.createConversation(data);
      
      return res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: conversation
      });
    } catch (error: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: error.message || 'Failed to create conversation'
      });
    }
  }

  /**
   * Get a conversation by ID
   * @route GET /api/conversations/:id
   */
  async getConversation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Conversation ID is required'
        });
      }
      
      const conversation = await conversationService.getConversationById(id);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: conversation
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: 'error',
          message: error.message
        });
      }
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: error.message || 'Failed to get conversation'
      });
    }
  }

  /**
   * Get all conversations for a user
   * @route GET /api/conversations/user/:userId
   */
  async getUserConversations(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'User ID is required'
        });
      }
      
      console.log(`Attempting to get conversations for user: ${userId}`);
      
      try {
        const conversations = await conversationService.getUserConversations(userId);
        
        console.log(`Retrieved ${conversations.length} conversations for user ${userId}`);
        
        return res.status(StatusCodes.OK).json({
          status: 'success',
          data: conversations
        });
      } catch (serviceError: any) {
        console.error('Conversation service error:', serviceError);
        throw serviceError; // Re-throw to be caught by the outer catch
      }
    } catch (error: any) {
      console.error('Error in getUserConversations controller:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: error.message || 'Failed to get user conversations'
      });
    }
  }

  /**
   * Update a conversation title
   * @route PUT /api/conversations/:id
   */
  async updateConversationTitle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title } = req.body;
      
      if (!id || !title) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Conversation ID and title are required'
        });
      }
      
      const updatedConversation = await conversationService.updateConversationTitle(id, title);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: updatedConversation
      });
    } catch (error: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: error.message || 'Failed to update conversation'
      });
    }
  }

  /**
   * Delete a conversation
   * @route DELETE /api/conversations/:id
   */
  async deleteConversation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Conversation ID is required'
        });
      }
      
      await conversationService.deleteConversation(id);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Conversation deleted successfully'
      });
    } catch (error: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: error.message || 'Failed to delete conversation'
      });
    }
  }
}

// Export a singleton instance
export const conversationController = new ConversationController();
