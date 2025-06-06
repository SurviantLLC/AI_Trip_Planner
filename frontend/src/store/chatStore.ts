import { create } from 'zustand';
import { Message } from '../features/chat/types/chat.types';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  addMessage: (message: Message) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,
  
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message] 
    })),
  
  setIsLoading: (isLoading) => 
    set(() => ({ 
      isLoading 
    })),
  
  setError: (error) => 
    set(() => ({ 
      error 
    })),
  
  clearMessages: () => 
    set(() => ({ 
      messages: [] 
    })),
}));
