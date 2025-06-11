"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationController = exports.ConversationController = void 0;
const http_status_codes_1 = require("http-status-codes");
const conversationService_1 = require("../services/conversationService");
class ConversationController {
    /**
     * Create a new conversation
     * @route POST /api/conversations
     */
    async createConversation(req, res) {
        try {
            const data = req.body;
            // Validate required fields
            if (!data.user_id || !data.title) {
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    status: 'error',
                    message: 'User ID and title are required'
                });
            }
            const conversation = await conversationService_1.conversationService.createConversation(data);
            return res.status(http_status_codes_1.StatusCodes.CREATED).json({
                status: 'success',
                data: conversation
            });
        }
        catch (error) {
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                message: error.message || 'Failed to create conversation'
            });
        }
    }
    /**
     * Get a conversation by ID
     * @route GET /api/conversations/:id
     */
    async getConversation(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    status: 'error',
                    message: 'Conversation ID is required'
                });
            }
            const conversation = await conversationService_1.conversationService.getConversationById(id);
            return res.status(http_status_codes_1.StatusCodes.OK).json({
                status: 'success',
                data: conversation
            });
        }
        catch (error) {
            if (error.message.includes('not found')) {
                return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                    status: 'error',
                    message: error.message
                });
            }
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                message: error.message || 'Failed to get conversation'
            });
        }
    }
    /**
     * Get all conversations for a user
     * @route GET /api/conversations/user/:userId
     */
    async getUserConversations(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    status: 'error',
                    message: 'User ID is required'
                });
            }
            console.log(`Attempting to get conversations for user: ${userId}`);
            try {
                const conversations = await conversationService_1.conversationService.getUserConversations(userId);
                console.log(`Retrieved ${conversations.length} conversations for user ${userId}`);
                return res.status(http_status_codes_1.StatusCodes.OK).json({
                    status: 'success',
                    data: conversations
                });
            }
            catch (serviceError) {
                console.error('Conversation service error:', serviceError);
                throw serviceError; // Re-throw to be caught by the outer catch
            }
        }
        catch (error) {
            console.error('Error in getUserConversations controller:', error);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                message: error.message || 'Failed to get user conversations'
            });
        }
    }
    /**
     * Update a conversation title
     * @route PUT /api/conversations/:id
     */
    async updateConversationTitle(req, res) {
        try {
            const { id } = req.params;
            const { title } = req.body;
            if (!id || !title) {
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    status: 'error',
                    message: 'Conversation ID and title are required'
                });
            }
            const updatedConversation = await conversationService_1.conversationService.updateConversationTitle(id, title);
            return res.status(http_status_codes_1.StatusCodes.OK).json({
                status: 'success',
                data: updatedConversation
            });
        }
        catch (error) {
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                message: error.message || 'Failed to update conversation'
            });
        }
    }
    /**
     * Delete a conversation
     * @route DELETE /api/conversations/:id
     */
    async deleteConversation(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    status: 'error',
                    message: 'Conversation ID is required'
                });
            }
            await conversationService_1.conversationService.deleteConversation(id);
            return res.status(http_status_codes_1.StatusCodes.OK).json({
                status: 'success',
                message: 'Conversation deleted successfully'
            });
        }
        catch (error) {
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                message: error.message || 'Failed to delete conversation'
            });
        }
    }
}
exports.ConversationController = ConversationController;
// Export a singleton instance
exports.conversationController = new ConversationController();
