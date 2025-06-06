import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller';

const router = Router();

// Routes
router.post('/', conversationController.createConversation);
router.get('/:id', conversationController.getConversation);
router.get('/user/:userId', conversationController.getUserConversations);
router.put('/:id', conversationController.updateConversationTitle);
router.delete('/:id', conversationController.deleteConversation);

export default router;
