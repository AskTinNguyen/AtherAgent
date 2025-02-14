'use client'

import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

interface SidebarContextType {
  isExpanded: boolean
  activeFolder: string | null
  searchQuery: string
  toggleSidebar: () => void
  setActiveFolder: (folderId: string | null) => void
  updateSearchQuery: (query: string) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleSidebar = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        activeFolder,
        searchQuery,
        toggleSidebar,
        setActiveFolder,
        updateSearchQuery
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarContext() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider')
  }
  return context
} 