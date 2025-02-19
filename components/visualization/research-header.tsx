'use client'

import { Button } from '@/components/ui/button'
import { useResearch } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, Trash2 } from 'lucide-react'

interface ResearchHeaderProps {
  isActive: boolean
  isCollapsed: boolean
  isFullScreen: boolean
  onCollapse: () => void
  onFullScreen: () => void
  onClearAll: () => void
  location: 'sidebar' | 'header'
}

export function ResearchHeader({
  isActive,
  isCollapsed,
  isFullScreen,
  onCollapse,
  onFullScreen,
  onClearAll,
  location
}: ResearchHeaderProps) {
  const { state } = useResearch()
  const currentActivity = state.activity[state.activity.length - 1]

  return (
    <div className={cn(
      "relative flex h-14 items-center justify-between",
      "border-b bg-background/95 px-4",
      "backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "transition-all duration-300 ease-in-out"
    )}>
      <div className="flex items-center gap-3">
        <motion.div 
          initial={false}
          animate={{
            scale: isActive ? [1, 1.2, 1] : 1,
            opacity: isActive ? 1 : 0.5
          }}
          transition={{
            duration: 0.3,
            repeat: isActive ? Infinity : 0,
            repeatDelay: 2
          }}
          className={cn(
            "size-2.5 rounded-full ring-2 ring-offset-2",
            isActive 
              ? "bg-green-500 ring-green-500/20" 
              : "bg-muted-foreground/40 ring-transparent"
          )}
        />
        <span className={cn(
          "text-sm font-medium tracking-tight",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}>
          {isActive ? 'Research Active' : 'Research Inactive'}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {location === 'sidebar' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            className={cn(
              "size-8 rounded-full",
              "hover:bg-muted/80 focus-visible:ring-1 focus-visible:ring-ring",
              "transition-transform duration-200",
              isCollapsed && "rotate-180"
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onFullScreen}
          className={cn(
            "size-8 rounded-full",
            "hover:bg-muted/80 focus-visible:ring-1 focus-visible:ring-ring",
            "transition-transform duration-200",
            isFullScreen && "rotate-180"
          )}
        >
          {isFullScreen 
            ? <Minimize2 className="h-4 w-4" />
            : <Maximize2 className="h-4 w-4" />
          }
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClearAll}
          className={cn(
            "size-8 rounded-full text-muted-foreground",
            "hover:bg-destructive/10 hover:text-destructive",
            "focus-visible:ring-1 focus-visible:ring-ring"
          )}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {isActive && (
        <motion.div
          className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  )
} 