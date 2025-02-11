'use client'

import { useResearchContext } from '@/lib/contexts/research-activity-context'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ChevronRight, Database, GitBranch, Search } from 'lucide-react'

interface ResearchHeaderProps {
  className?: string
}

export function ResearchHeader({ className }: ResearchHeaderProps) {
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
        className
      )}
    >
      {/* Top Border Glow */}
      <motion.div
        variants={glowVariants}
        initial="initial"
        animate="pulse"
        className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0"
      />

      <div className="flex items-center justify-between p-4">
        {/* Left Section - Research Status */}
        <div className="flex items-center space-x-4">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              transition: { duration: 2, repeat: Infinity }
            }}
            className="p-2 rounded-full bg-cyan-500/10"
          >
            <Search className="w-6 h-6 text-cyan-400" />
          </motion.div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Research Command Center
            </h2>
            <div className="flex items-center text-sm text-gray-400">
              <Database className="w-4 h-4 mr-1" />
              <span>{state.sources.length} Sources</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <GitBranch className="w-4 h-4 mr-1" />
              <span>Depth {state.currentDepth}</span>
            </div>
          </div>
        </div>

        {/* Right Section - Current Activity */}
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-sm text-gray-400">Current Operation</div>
            <div className="font-mono text-cyan-400">
              {currentActivity?.operation || 'Initializing...'}
            </div>
          </div>
          <motion.div
            animate={{
              borderColor: ['rgba(6, 182, 212, 0.2)', 'rgba(6, 182, 212, 0.8)', 'rgba(6, 182, 212, 0.2)']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="h-12 w-12 rounded-full border-2 border-cyan-500/20 flex items-center justify-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="h-8 w-8 rounded-full bg-cyan-500/20"
            />
          </motion.div>
        </div>
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