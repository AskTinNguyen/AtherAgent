'use client'

import { Button } from '@/components/ui/button'
import { useResearchContext } from '@/lib/contexts/research-activity-context'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Maximize2, Minimize2, Trash2 } from 'lucide-react'

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
  const { state, activity } = useResearchContext()
  const currentActivity = activity[activity.length - 1]

  const glowVariants = {
    initial: { opacity: 0.5 },
    pulse: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden',
        'flex items-center justify-between p-4 border-b'
      )}
    >
      {/* Top Border Glow */}
      <motion.div
        variants={glowVariants}
        initial="initial"
        animate="pulse"
        className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0"
      />

      <div className="flex items-center gap-2">
        <div className={cn(
          'size-2 rounded-full',
          isActive ? 'bg-green-500' : 'bg-gray-400'
        )} />
        <span className="text-sm font-medium">
          {isActive ? 'Research Active' : 'Research Inactive'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onFullScreen}
          className="size-8"
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
          className="size-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Bottom Border Glow */}
      <motion.div
        variants={glowVariants}
        initial="initial"
        animate="pulse"
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0"
      />
    </motion.div>
  )
} 