"use client"

import { useState, useCallback } from "react"
import { useMessages } from "./useMessages"
import type { QuickAction } from "../types/chat.types"

// Simulating API call to get response from AI
const simulateAIResponse = async (message: string): Promise<string> => {
  // In a real app, this would be an API call to your backend
  await new Promise((resolve) => setTimeout(resolve, 2000))

  if (message.toLowerCase().includes("trip")) {
    return "I'd be happy to help plan your trip! Where would you like to go?"
  } else if (message.toLowerCase().includes("flight")) {
    return "Let me search for flights for you. What's your departure city and destination?"
  } else if (message.toLowerCase().includes("hotel")) {
    return "I can help you find the perfect accommodation. What's your destination and dates?"
  }

  return "Thanks for your message! How else can I assist with your travel plans?"
}

export const useChat = () => {
  const { messages, isTyping, setIsTyping, addMessage, messagesEndRef } = useMessages()

  const [inputValue, setInputValue] = useState("")

  const quickActions: QuickAction[] = [
    {
      id: "1",
      label: "Plan a trip",
      icon: "map",
      prompt: "I want to plan a trip to",
    },
    {
      id: "2",
      label: "Search flights",
      icon: "plane",
      prompt: "Find flights from",
    },
    {
      id: "3",
      label: "Find hotels",
      icon: "hotel",
      prompt: "Find hotels in",
    },
    {
      id: "4",
      label: "Explore activities",
      icon: "compass",
      prompt: "What can I do in",
    },
  ]

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return

      // Add user message
      addMessage(message, "user")
      setInputValue("")

      // Show typing indicator
      setIsTyping(true)

      try {
        // Get AI response
        const response = await simulateAIResponse(message)

        // Add AI response
        addMessage(response, "assistant")
      } catch (error) {
        console.error("Error getting AI response:", error)
        addMessage("Sorry, I encountered an error. Please try again.", "assistant")
      } finally {
        setIsTyping(false)
      }
    },
    [addMessage, setIsTyping],
  )

  const handleQuickAction = useCallback((action: QuickAction) => {
    setInputValue(action.prompt + " ")
  }, [])

  return {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    handleSendMessage,
    quickActions,
    handleQuickAction,
    messagesEndRef,
  }
}
