import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { messageService } from '../services/chatService';
import { MessageType } from '../models/message.model';

// Use same interface definition as in chatService.ts but extend MessageType to include system
type ExtendedMessageType = MessageType | 'system';

interface CreateMessageRequest {
  conversation_id: string;
  content: string;
  message_type?: ExtendedMessageType;
}

export class ChatController {
  /**
   * Send a new message and get AI response
   * @route POST /api/chat/message
   */
  async sendMessage(req: Request, res: Response) {
    try {
      console.log('Received message request:', JSON.stringify(req.body, null, 2));
      const data = req.body as CreateMessageRequest;
      
      // Validate required fields
      if (!data.conversation_id || !data.content) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Conversation ID and content are required'
        });
      }
      
      // Handle all message types safely
      try {
        // For regular user messages
        console.log('Creating user message in database...');
        const userMessage = await messageService.createMessage({
          conversation_id: data.conversation_id,
          content: data.content,
          message_type: data.message_type === 'system' ? 'text' : data.message_type || 'text'
        }, 'user');
        
        // Generate and save AI response asynchronously
        // We don't await here to improve response time
        try {
          console.log('Generating AI response asynchronously...');
          messageService.generateAIResponse(userMessage).catch(error => {
            console.error('Error generating AI response:', error);
          });
        } catch (aiError) {
          console.error('Failed to initiate AI response generation:', aiError);
          // Don't fail the request if AI generation fails to start
        }
        
        return res.status(StatusCodes.CREATED).json({
          status: 'success',
          data: userMessage,
          message: 'Message sent successfully, AI is generating a response'
        });
      } catch (dbError) {
        console.error('Database error when creating message:', dbError);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: 'error',
          message: 'Failed to create message in database'
        });
      }
    } catch (error: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: error.message || 'Failed to send message'
      });
    }
  }

  /**
   * Get conversation history
   * @route GET /api/chat/history/:conversationId
   */
  async getConversationHistory(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Conversation ID is required'
        });
      }
      
      const messages = await messageService.getConversationMessages(conversationId);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: messages
      });
    } catch (error: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: error.message || 'Failed to get conversation history'
      });
    }
  }

  /**
   * Delete a specific message
   * @route DELETE /api/chat/message/:messageId
   */
  async deleteMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      
      if (!messageId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Message ID is required'
        });
      }
      
      await messageService.deleteMessage(messageId);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Message deleted successfully'
      });
    } catch (error: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: error.message || 'Failed to delete message'
      });
    }
  }

  /**
   * Clear conversation history
   * @route DELETE /api/chat/history/:conversationId
   */
  async clearConversationHistory(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Conversation ID is required'
        });
      }
      
      await messageService.clearConversationHistory(conversationId);
      
      return res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Conversation history cleared successfully'
      });
    } catch (error: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: error.message || 'Failed to clear conversation history'
      });
    }
  }
}

// Export a singleton instance
export const chatController = new ChatController();
