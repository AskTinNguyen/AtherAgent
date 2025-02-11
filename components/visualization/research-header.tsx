'use client'

import { useDepth } from '@/lib/contexts/research-provider'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ResearchHeaderProps {
  activeMode: 'side-by-side' | 'overlay' | 'timeline'
  onModeChange: (mode: 'side-by-side' | 'overlay' | 'timeline') => void
}

export function ResearchHeader({ activeMode, onModeChange }: ResearchHeaderProps) {
  const { state: depthState } = useDepth()

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Research Progress</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Depth Level {depthState.currentDepth} of {depthState.maxDepth}
        </p>
      </div>
      <div className="flex gap-3">
        {['side-by-side', 'overlay', 'timeline'].map((mode) => (
          <motion.button
            key={mode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeMode === mode 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
            onClick={() => onModeChange(mode as any)}
          >
            {mode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </motion.button>
        ))}
      </div>
    </div>
  )
} 