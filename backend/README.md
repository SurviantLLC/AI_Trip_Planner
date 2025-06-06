# AI Trip Planner - Backend API

This is the backend API for the AI Trip Planner application, built with Node.js, Express, TypeScript, and Supabase.

## Features

- Real-time chat using Socket.io
- REST API for chat and conversation management
- Supabase integration for data storage
- TypeScript for type safety
- Rate limiting for API protection

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Supabase account

### Setup

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies

```bash
cd backend
npm install
```

### Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Once your project is created, go to the SQL Editor
3. Copy the contents of `src/config/supabase_schema.sql` and execute it in the SQL Editor
4. This will create the necessary tables and security policies
5. Go to Project Settings > API to get your Supabase URL and anon key
6. Add these values to your `.env` file

### Running the Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### Chat API

- `POST /api/chat/message` - Send a new message and get AI response
- `GET /api/chat/history/:conversationId` - Get conversation history
- `DELETE /api/chat/message/:messageId` - Delete a specific message
- `DELETE /api/chat/history/:conversationId` - Clear conversation history

### Conversation API

- `POST /api/conversations` - Create a new conversation
- `GET /api/conversations/:id` - Get a conversation by ID
- `GET /api/conversations/user/:userId` - Get all conversations for a user
- `PUT /api/conversations/:id` - Update a conversation title
- `DELETE /api/conversations/:id` - Delete a conversation

## WebSocket Events

### Client to Server

- `joinConversation` - Join a specific conversation room
- `leaveConversation` - Leave a conversation room
- `sendMessage` - Send a new message

### Server to Client

- `newMessage` - Receive a new message
- `error` - Receive an error notification

## Request and Response Examples

### Create a new conversation

**Request:**
```http
POST /api/conversations
Content-Type: application/json

{
  "user_id": "user-uuid",
  "title": "Trip to Paris"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "conversation-uuid",
    "user_id": "user-uuid",
    "title": "Trip to Paris",
    "created_at": "2023-06-05T12:00:00.000Z",
    "updated_at": "2023-06-05T12:00:00.000Z"
  }
}
```

### Send a message

**Request:**
```http
POST /api/chat/message
Content-Type: application/json

{
  "conversation_id": "conversation-uuid",
  "content": "I want to plan a trip to Paris",
  "message_type": "text"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "message-uuid",
    "conversation_id": "conversation-uuid",
    "role": "user",
    "content": "I want to plan a trip to Paris",
    "message_type": "text",
    "created_at": "2023-06-05T12:01:00.000Z"
  },
  "message": "Message sent successfully, AI is generating a response"
}
```

## Database Schema

### Conversations Table

| Column     | Type      | Description               |
|------------|-----------|---------------------------|
| id         | UUID      | Primary key               |
| user_id    | UUID      | User identifier           |
| title      | TEXT      | Conversation title        |
| created_at | TIMESTAMP | Creation timestamp        |
| updated_at | TIMESTAMP | Last update timestamp     |

### Messages Table

| Column          | Type      | Description                          |
|-----------------|-----------|--------------------------------------|
| id              | UUID      | Primary key                          |
| conversation_id | UUID      | Reference to conversations table     |
| role            | TEXT      | Message sender role (user/assistant) |
| content         | TEXT      | Message content                      |
| message_type    | TEXT      | Type of message (text/image/etc)     |
| created_at      | TIMESTAMP | Creation timestamp                   |
