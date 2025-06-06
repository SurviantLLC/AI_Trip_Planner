import type { Message } from "../types/chat.types"
import { v4 as uuidv4 } from 'uuid';

export const createMessage = (
  content: string,
  role: "user" | "assistant" | "system",
  conversation_id: string = "",
  message_type: "text" | "image" | "file" | "location" = "text",
  id?: string
): Message => ({
  id: id || uuidv4(),
  conversation_id,
  content,
  role,
  message_type,
  created_at: new Date().toISOString(),
  actions: []
})

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const scrollToBottom = (element: HTMLElement | null) => {
  if (element) {
    element.scrollTop = element.scrollHeight
  }
}
