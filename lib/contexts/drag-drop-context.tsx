"use client"

import { createContext, ReactNode, useContext, useState } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { TouchBackend } from "react-dnd-touch-backend"

// Define item types for drag and drop
export const ItemTypes = {
  CHAT: "chat",
  FOLDER: "folder",
} as const

export type DragItemType = typeof ItemTypes[keyof typeof ItemTypes]

// Define the structure of draggable items
export interface DragItem {
  type: DragItemType
  id: string
  index: number
  parentId?: string
}

// Create context for custom drag and drop state
interface DragDropContextType {
  isDragging: boolean
  setIsDragging: (isDragging: boolean) => void
  draggedItem: DragItem | null
  setDraggedItem: (item: DragItem | null) => void
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined)

// Custom provider component
export function DragDropProvider({ children }: { children: ReactNode }) {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)

  // Detect touch device
  const isTouchDevice = () => {
    if (typeof window === "undefined") return false
    return "ontouchstart" in window || navigator.maxTouchPoints > 0
  }

  return (
    <DndProvider backend={isTouchDevice() ? TouchBackend : HTML5Backend}>
      <DragDropContext.Provider
        value={{
          isDragging,
          setIsDragging,
          draggedItem,
          setDraggedItem,
        }}
      >
        {children}
      </DragDropContext.Provider>
    </DndProvider>
  )
}

// Custom hook to use the drag and drop context
export function useDragDrop() {
  const context = useContext(DragDropContext)
  if (context === undefined) {
    throw new Error("useDragDrop must be used within a DragDropProvider")
  }
  return context
} 