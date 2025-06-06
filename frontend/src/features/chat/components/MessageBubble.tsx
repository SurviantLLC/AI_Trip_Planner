"use client"

import { motion } from "framer-motion"
import type { Message } from "../types/chat.types"
import { formatTimestamp } from "../utils/messageHelpers"
import { User, Bot, Plane, Hotel, MapPin, AlertTriangle } from "lucide-react"

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const isSystem = message.role === "system"

  const bubbleVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
      },
    },
  }

  const ActionCardComponent = ({ actions }: { actions: any[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      {actions.map((action) => (
        <motion.div
          key={action.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 cursor-pointer hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
              {action.icon === "plane" && <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              {action.icon === "hotel" && <Hotel className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              {action.icon === "map" && <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{action.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{action.description}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={`flex items-start space-x-3 mb-6 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-gradient-to-r from-blue-500 to-purple-600" : 
          isSystem ? "bg-gradient-to-r from-amber-500 to-red-500" : 
          "bg-gradient-to-r from-green-500 to-blue-500"
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : 
         isSystem ? <AlertTriangle className="w-4 h-4 text-white" /> : 
         <Bot className="w-4 h-4 text-white" />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-lg ${
            isUser
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md glass dark:glass-dark"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

          {message.actions && message.actions.length > 0 && <ActionCardComponent actions={message.actions} />}
        </div>

        <span className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isUser ? "text-right" : "text-left"}`}>
          {formatTimestamp(message.created_at)}
        </span>
      </div>
    </motion.div>
  )
}
