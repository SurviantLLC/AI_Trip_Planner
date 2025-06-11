"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Using CommonJS pattern to import Express Router
const express = require('express');
const router = express.Router();
const conversationController_1 = require("../controllers/conversationController");
// Routes
router.post('/', conversationController_1.conversationController.createConversation);
router.get('/:id', conversationController_1.conversationController.getConversation);
router.get('/user/:userId', conversationController_1.conversationController.getUserConversations);
router.put('/:id', conversationController_1.conversationController.updateConversationTitle);
router.delete('/:id', conversationController_1.conversationController.deleteConversation);
exports.default = router;
