"use client"

import { Droppable } from "@/components/dnd/droppable"
import { Button } from "@/components/ui/button"
import { DragItem, ItemTypes } from "@/lib/contexts/drag-drop-context"
import { Folder } from "@/lib/redis/types/folders"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Folder as FolderIcon } from "lucide-react"
import { useState } from "react"

interface FolderItemProps {
  folder: Folder
  isActive?: boolean
  isExpanded?: boolean
  onDrop?: (chatId: string) => Promise<void>
  onToggle?: () => void
  className?: string
}

export function FolderItem({
  folder,
  isActive = false,
  isExpanded = true,
  onDrop,
  onToggle,
  className = ""
}: FolderItemProps) {
  const [isOver, setIsOver] = useState(false)

  const handleDrop = async (item: DragItem) => {
    if (item.type === ItemTypes.CHAT && onDrop) {
      await onDrop(item.id)
    }
  }

  // Compact view for collapsed sidebar
  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "w-full h-8 my-1",
          isActive && "bg-accent"
        )}
        title={folder.name}
      >
        <FolderIcon className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Droppable
      accept={[ItemTypes.CHAT]}
      onDrop={handleDrop}
      isValidDrop={(item: DragItem) => !folder.chats.includes(item.id)}
      className={cn(
        'flex items-center hover:bg-muted cursor-pointer p-2 rounded border relative group',
        isActive ? 'bg-muted/70 border-border' : 'border-transparent',
        isOver && 'border-primary',
        className
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        className="flex-1 justify-start gap-2 h-6 px-2"
        onClick={onToggle}
      >
        <FolderIcon className="h-4 w-4" />
        <span className="flex-1 text-left truncate">{folder.name}</span>
        {folder.chats.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {folder.chats.length}
          </span>
        )}
        {onToggle && (
          isActive ? 
            <ChevronDown className="h-4 w-4" /> : 
            <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </Droppable>
  )
} 