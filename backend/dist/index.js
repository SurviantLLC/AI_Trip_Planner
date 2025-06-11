"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
// Import Express using require for better CommonJS compatibility
// @ts-ignore - Ignoring TypeScript errors for Express import to make it work
const express = require('express');
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const socket_io_1 = require("socket.io");
const http_status_codes_1 = require("http-status-codes");
const express_rate_limit_1 = require("express-rate-limit");
// Import routes
const chatRoutes_1 = __importDefault(require("./features/chat/routes/chatRoutes"));
const conversationRoutes_1 = __importDefault(require("./features/chat/routes/conversationRoutes"));
const amadeus_routes_1 = __importDefault(require("./features/flights/routes/amadeus.routes"));
const amadeus_debug_routes_1 = __importDefault(require("./features/flights/routes/amadeus-debug.routes"));
// Create simple error handler
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
};
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = express();
const server = http_1.default.createServer(app);
// Initialize Socket.io
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});
exports.io = io;
// Apply middlewares
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Rate limiting
const apiLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Too many requests, please try again later.'
    }
});
// Apply rate limiting to all API routes
app.use('/api', apiLimiter);
// API routes
app.use('/api/chat', chatRoutes_1.default);
app.use('/api/conversations', conversationRoutes_1.default);
app.use('/api/amadeus', amadeus_routes_1.default);
app.use('/api/amadeus-debug', amadeus_debug_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(http_status_codes_1.StatusCodes.OK).json({ status: 'ok', message: 'Server is running' });
});
// Socket.io connection handler
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Join a specific conversation room
    socket.on('joinConversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation: ${conversationId}`);
    });
    // Leave a conversation room
    socket.on('leaveConversation', (conversationId) => {
        socket.leave(conversationId);
        console.log(`User ${socket.id} left conversation: ${conversationId}`);
    });
    // New message handler
    socket.on('sendMessage', async (message) => {
        try {
            // We don't emit anything here anymore because this is handled by the chatService
            // The chatService will emit messages via Socket.io after saving to the database
            // and the AI response will be emitted after it's generated
            console.log(`Received socket message from ${socket.id} for conversation: ${message.conversationId}`);
            // No broadcasting here to avoid duplicate messages
        }
        catch (error) {
            console.error('Error handling socket message:', error);
            socket.emit('error', { message: 'Failed to process message' });
        }
    });
    // Disconnect handler
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
// Error handler middleware
app.use(errorHandler);
// Not found handler
app.use((req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`
    });
});
// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
