"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mic, MicOff } from "lucide-react"

interface VoiceInputProps {
  onVoiceInput?: (text: string) => void
}

export default function VoiceInput({ onVoiceInput }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)

  const handleVoiceToggle = () => {
    setIsListening(!isListening)
    // Voice functionality would be implemented here
    console.log("Voice input toggled:", !isListening)
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleVoiceToggle}
      className={`p-3 rounded-full transition-all duration-200 ${
        isListening
          ? "bg-red-500 text-white shadow-lg"
          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
      }`}
    >
      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </motion.button>
  )
}
