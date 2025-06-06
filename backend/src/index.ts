import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { StatusCodes } from 'http-status-codes';
import { rateLimit } from 'express-rate-limit';

// Import routes
import chatRoutes from './routes/chat.routes';
import conversationRoutes from './routes/conversation.routes';

// Import middlewares
import { errorHandler } from './middlewares/error.middleware';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Apply middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
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
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({ status: 'ok', message: 'Server is running' });
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
      // We would typically save the message to the database here
      // and then broadcast it to all users in the conversation
      
      // Broadcast message to all users in the conversation
      io.to(message.conversationId).emit('newMessage', message);
      
      // Mock AI response after a short delay
      setTimeout(() => {
        const aiResponse = {
          id: Date.now().toString(),
          conversationId: message.conversationId,
          role: 'assistant',
          content: `This is a mock AI response to: "${message.content}"`,
          timestamp: new Date().toISOString(),
          messageType: 'text'
        };
        
        io.to(message.conversationId).emit('newMessage', aiResponse);
      }, 1000);
      
    } catch (error) {
      console.error('Error handling message:', error);
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
  res.status(StatusCodes.NOT_FOUND).json({ 
    status: 'error',
    message: `Route ${req.originalUrl} not found` 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { io };
