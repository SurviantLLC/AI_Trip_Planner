export interface Message {
  id: string
  conversation_id: string
  content: string
  role: "user" | "assistant" | "system"
  message_type: "text" | "image" | "file" | "location"
  created_at: string
  actions?: ActionCard[]
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ActionCard {
  id: string
  title: string
  description: string
  icon: string
  action: string
}

export interface ChatState {
  messages: Message[]
  isTyping: boolean
  isConnected: boolean
}

export interface QuickAction {
  id: string
  label: string
  icon: string
  prompt: string
}
