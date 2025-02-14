'use client'

import { generateId } from 'ai'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface ChatSessionContextType {
  isSessionActive: boolean
  setIsSessionActive: (active: boolean) => void
  chatId: string
  resetChatId: () => void
}

const ChatSessionContext = createContext<ChatSessionContextType | undefined>(undefined)

const CHAT_ID_KEY = 'ather_chat_id'

interface ChatSessionProviderProps {
  children: ReactNode
}

export function ChatSessionProvider({ children }: ChatSessionProviderProps) {
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [chatId, setChatId] = useState<string>('')

  // Initialize chatId on mount
  useEffect(() => {
    const storedId = localStorage.getItem(CHAT_ID_KEY)
    if (storedId) {
      setChatId(storedId)
    } else {
      const newId = generateId()
      localStorage.setItem(CHAT_ID_KEY, newId)
      setChatId(newId)
    }
  }, [])

  const resetChatId = () => {
    const newId = generateId()
    localStorage.setItem(CHAT_ID_KEY, newId)
    setChatId(newId)
  }

  const value = useMemo(() => ({
    isSessionActive,
    setIsSessionActive,
    chatId,
    resetChatId
  }), [isSessionActive, chatId])

  return (
    <ChatSessionContext.Provider value={value}>
      {children}
    </ChatSessionContext.Provider>
  )
}

export function useChatSession(): ChatSessionContextType {
  const context = useContext(ChatSessionContext)
  
  if (context === undefined) {
    throw new Error('useChatSession must be used within a ChatSessionProvider')
  }
  
  return context
} 