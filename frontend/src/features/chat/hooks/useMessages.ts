"use client"

import { useState, useEffect, useRef } from "react"
import type { Message, MessageType, MessageRole } from "../types/chat.types"
import { createMessage } from "../utils/messageHelpers"

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([
    createMessage(
      "Hi there! I'm your AI travel assistant. How can I help plan your next adventure?",
      "assistant",
      "text",
    ),
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const addMessage = (content: string | any, role: MessageRole, type: MessageType = "text") => {
    const newMessage = createMessage(content, role, type)
    setMessages((prev) => [...prev, newMessage])
    return newMessage
  }

  const updateMessage = (id: string, content: string | any) => {
    setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, content } : message)))
  }

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== id))
  }

  const clearMessages = () => {
    setMessages([])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return {
    messages,
    isTyping,
    setIsTyping,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    messagesEndRef,
  }
}
