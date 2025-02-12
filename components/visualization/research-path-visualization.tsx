'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { type ResearchActivity, type ResearchMemory, type ResearchSourceMetrics } from '../deep-research-provider'

interface ResearchPathVisualizationProps {
  activity: ResearchActivity[]
  currentDepth: number
  maxDepth: number
  researchMemory: ResearchMemory[]
  sourceMetrics: ResearchSourceMetrics[]
}

export function ResearchPathVisualization({
  activity,
  currentDepth,
  maxDepth,
  researchMemory,
  sourceMetrics
}: ResearchPathVisualizationProps) {
  const depthLevels = Array.from({ length: maxDepth }, (_, i) => i + 1)

  return (
    <div className="p-4 space-y-6">
      {/* Depth Progress */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Research Depth</h3>
        <div className="grid grid-cols-7 gap-2">
          {depthLevels.map(level => (
            <motion.div
              key={level}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                background: level <= currentDepth ? 'var(--primary)' : 'var(--muted)'
              }}
              className={cn(
                "h-1 rounded-full",
                level <= currentDepth ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Research Path */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Research Path</h3>
        <div className="space-y-2">
          {researchMemory.map((memory, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Depth {memory.depth}
                </div>
                {memory.sourceUrls.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {memory.sourceUrls.length} sources
                  </div>
                )}
              </div>
              <p className="text-sm">{memory.context}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Source Metrics */}
      {sourceMetrics.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Source Quality</h3>
          <div className="space-y-2">
            {sourceMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-lg border bg-card"
              >
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Relevance:</span>
                    <span className="ml-1 font-medium">
                      {Math.round(metric.relevanceScore * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quality:</span>
                    <span className="ml-1 font-medium">
                      {Math.round(metric.contentQuality * 100)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 