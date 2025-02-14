"use client"

import { DragItem, DragItemType } from "@/lib/contexts/drag-drop-context"
import { ReactNode } from "react"
import { useDrop, type DropTargetMonitor } from "react-dnd"

interface DroppableProps {
  accept: DragItemType | DragItemType[]
  onDrop: (item: DragItem) => void
  children: ReactNode
  className?: string
  disabled?: boolean
  isValidDrop?: (item: DragItem) => boolean
}

export function Droppable({
  accept,
  onDrop,
  children,
  className = "",
  disabled = false,
  isValidDrop = () => true
}: DroppableProps) {
  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
    accept,
    drop: (item: DragItem) => {
      onDrop(item)
    },
    canDrop: (item: DragItem, monitor: DropTargetMonitor<DragItem>) => !disabled && isValidDrop(item),
    collect: (monitor: DropTargetMonitor<DragItem>) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [accept, onDrop, disabled, isValidDrop])

  const isActive = isOver && canDrop
  const isInvalid = isOver && !canDrop

  return (
    <div
      ref={dropRef}
      className={`
        ${className}
        ${isActive ? "ring-2 ring-blue-500" : ""}
        ${isInvalid ? "ring-2 ring-red-500" : ""}
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
        transition-all duration-200
      `}
    >
      {children}
    </div>
  )
} 