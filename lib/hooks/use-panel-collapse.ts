import { useCallback, useEffect, useRef, useState } from 'react'

// Constants
const STORAGE_PREFIX = 'research-panel-collapsed'
const EXPAND_DELAY = 300 // More noticeable delay for smoother transition

interface UsePanelCollapseOptions {
  chatId: string
  isActive: boolean
}

// Storage utility functions
const getStorageKey = (chatId: string) => `${STORAGE_PREFIX}-${chatId}`

const getStoredState = (chatId: string): boolean | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const saved = localStorage.getItem(getStorageKey(chatId))
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Error reading collapsed state from storage:', error)
    return null
  }
}

const setStoredState = (chatId: string, state: boolean): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(getStorageKey(chatId), JSON.stringify(state))
  } catch (error) {
    console.error('Error saving collapsed state to storage:', error)
  }
}

export function usePanelCollapse({ chatId, isActive }: UsePanelCollapseOptions) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from storage during mount
    const stored = getStoredState(chatId)
    return stored ?? false
  })
  
  const isFirstActivation = useRef(true)

  // Handle storage persistence and panel expansion
  useEffect(() => {
    // Persist state changes to storage
    setStoredState(chatId, isCollapsed)
    
    // Auto-expand on first activation only
    if (isActive && isCollapsed && isFirstActivation.current) {
      const timeoutId = setTimeout(() => {
        setIsCollapsed(false)
        isFirstActivation.current = false
      }, EXPAND_DELAY)
      
      return () => clearTimeout(timeoutId)
    }
    
    // Mark as not first activation if active
    if (isActive) {
      isFirstActivation.current = false
    }
  }, [chatId, isActive, isCollapsed])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  return {
    isCollapsed,
    toggleCollapse
  }
} 