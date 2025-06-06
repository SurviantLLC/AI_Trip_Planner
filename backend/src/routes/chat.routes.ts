import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting specifically for message sending
// More restrictive than the global limiter
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 message requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many messages sent. Please try again later.'
  }
});

// Routes
router.post('/message', messageLimiter, chatController.sendMessage);
router.get('/history/:conversationId', chatController.getConversationHistory);
router.delete('/message/:messageId', chatController.deleteMessage);
router.delete('/history/:conversationId', chatController.clearConversationHistory);

export default router;
