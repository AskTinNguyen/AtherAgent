"use client"

import { DragItem, useDragDrop } from "@/lib/contexts/drag-drop-context"
import { ReactNode, useEffect } from "react"
import { useDrag, type DragSourceMonitor } from "react-dnd"

interface DraggableProps {
  item: DragItem
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function Draggable({
  item,
  children,
  className = "",
  disabled = false
}: DraggableProps) {
  const { setIsDragging, setDraggedItem } = useDragDrop()

  const [{ isDragging }, dragRef] = useDrag<DragItem, unknown, { isDragging: boolean }>(() => ({
    type: item.type,
    item: () => {
      setDraggedItem(item)
      return item
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: !disabled
  }), [item, disabled])

  useEffect(() => {
    setIsDragging(isDragging)
    if (!isDragging) {
      setDraggedItem(null)
    }
  }, [isDragging, setIsDragging, setDraggedItem])

  return (
    <div
      ref={dragRef}
      className={`${className} ${isDragging ? "opacity-50" : ""} ${
        disabled ? "cursor-not-allowed" : "cursor-move"
      }`}
    >
      {children}
    </div>
  )
} 