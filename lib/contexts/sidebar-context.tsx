'use client'

import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

export interface SidebarContextType {
  isExpanded: boolean
  isCollapsed: boolean
  activeFolder: string | null
  searchQuery: string
  toggleSidebar: () => void
  setActiveFolder: (folderId: string | null) => void
  updateSearchQuery: (query: string) => void
  setIsExpanded: (value: boolean) => void
}

export const SidebarContext = createContext<SidebarContextType>({
  isExpanded: false,
  isCollapsed: false,
  setIsExpanded: () => {},
  activeFolder: null,
  searchQuery: '',
  toggleSidebar: () => {},
  setActiveFolder: () => {},
  updateSearchQuery: () => {}
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isCollapsed = !isExpanded
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
        isCollapsed,
        setIsExpanded,
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

export const useSidebarContext = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider')
  }
  return context
} 