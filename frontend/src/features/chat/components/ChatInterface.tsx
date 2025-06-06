"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import MessageBubble from "./MessageBubble"
import ChatInput from "./ChatInput"
import TypingIndicator from "./TypingIndicator"
import type { Message, Conversation } from "../types/chat.types"
import { createMessage, scrollToBottom } from "../utils/messageHelpers"
import { chatService } from "../services/chatService"

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  const mockUserId = "user-123" // In a real app, this would be from authentication

  // Initialize conversation and load message history
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Get or create a conversation for this user
        const userConversation = await chatService.getOrCreateConversation(mockUserId)
        setConversation(userConversation)
        
        // Load message history
        const history = await chatService.getMessageHistory(userConversation.id)
        
        if (history && history.length > 0) {
          setMessages(history)
        } else {
          // If no history, show welcome message
          const welcomeMessage = createMessage(
            "Hello! I'm your AI travel assistant. I can help you plan trips, find flights, book hotels, and create amazing itineraries. What would you like to explore today?",
            "assistant",
            userConversation.id
          )
          setMessages([welcomeMessage])
          
          // Save welcome message to backend
          await chatService.sendMessage(
            userConversation.id, 
            welcomeMessage.content,
            welcomeMessage.message_type
          )
        }
        
        // Connect to WebSocket for real-time updates
        const cleanup = chatService.connectToWebSocket(
          mockUserId,
          userConversation.id,
          (newMessage) => {
            if (newMessage.role === "assistant") {
              setMessages(prev => [...prev, newMessage])
              setIsTyping(false)
            }
          }
        )
        
        setIsConnected(true)
        return cleanup
      } catch (error) {
        console.error("Error initializing chat:", error)
      }
    }
    
    initializeChat()
  }, [])

  const handleSendMessage = async (content: string) => {
    if (!conversation) return
    
    // Add user message to UI immediately
    const userMessage = createMessage(content, "user", conversation.id)
    setMessages(prev => [...prev, userMessage])
    
    // Show typing indicator
    setIsTyping(true)
    
    try {
      // Send message to backend
      await chatService.sendMessage(conversation.id, content)
      
      // The AI response will come through the WebSocket connection
      // and be added to messages via the newMessage callback
    } catch (error) {
      console.error("Error sending message:", error)
      setIsTyping(false)
      
      // Show error message if API call fails
      const errorMessage = createMessage(
        "Sorry, there was an error processing your message. Please try again.",
        "system",
        conversation.id
      )
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom(messagesContainerRef.current)
  }, [messages, isTyping])

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Trip Planner
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your intelligent travel companion</p>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0">
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  )
}
