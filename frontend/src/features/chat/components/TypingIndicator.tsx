"use client"

import { motion } from "framer-motion"

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center space-x-2 p-4"
    >
      <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-lg glass dark:glass-dark">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">AI is thinking...</span>
      </div>
    </motion.div>
  )
}
