"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Using CommonJS pattern to import Express Router
const express = require('express');
const router = express.Router();
const chatController_1 = require("../controllers/chatController");
const express_rate_limit_1 = require("express-rate-limit");
// Rate limiting specifically for message sending
// More restrictive than the global limiter
const messageLimiter = (0, express_rate_limit_1.rateLimit)({
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
router.post('/message', messageLimiter, chatController_1.chatController.sendMessage);
router.get('/history/:conversationId', chatController_1.chatController.getConversationHistory);
router.delete('/message/:messageId', chatController_1.chatController.deleteMessage);
router.delete('/history/:conversationId', chatController_1.chatController.clearConversationHistory);
exports.default = router;
