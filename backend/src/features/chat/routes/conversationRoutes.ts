// Using CommonJS pattern to import Express Router
const express = require('express');
const router = express.Router();
import { conversationController } from '../controllers/conversationController';

// Routes
router.post('/', conversationController.createConversation);
router.get('/:id', conversationController.getConversation);
router.get('/user/:userId', conversationController.getUserConversations);
router.put('/:id', conversationController.updateConversationTitle);
router.delete('/:id', conversationController.deleteConversation);

export default router;
