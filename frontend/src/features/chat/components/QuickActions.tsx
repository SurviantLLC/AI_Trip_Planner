"use client"

import { motion } from "framer-motion"
import type { QuickAction } from "../types/chat.types"
import { Plane, Hotel, MapPin, Calendar } from "lucide-react"

interface QuickActionsProps {
  onActionClick: (prompt: string) => void
}

const quickActions: QuickAction[] = [
  {
    id: "1",
    label: "Plan a trip",
    icon: "map",
    prompt: "Help me plan a trip",
  },
  {
    id: "2",
    label: "Search flights",
    icon: "plane",
    prompt: "I want to search for flights",
  },
  {
    id: "3",
    label: "Find hotels",
    icon: "hotel",
    prompt: "Help me find hotels",
  },
  {
    id: "4",
    label: "Check dates",
    icon: "calendar",
    prompt: "What are the best travel dates?",
  },
]

export default function QuickActions({ onActionClick }: QuickActionsProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "map":
        return <MapPin className="w-4 h-4" />
      case "plane":
        return <Plane className="w-4 h-4" />
      case "hotel":
        return <Hotel className="w-4 h-4" />
      case "calendar":
        return <Calendar className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {quickActions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onActionClick(action.prompt)}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-all duration-200 glass dark:glass-dark border border-gray-200 dark:border-gray-700"
        >
          <span className="text-blue-600 dark:text-blue-400">{getIcon(action.icon)}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
