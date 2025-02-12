'use client'

import { useResearchContext } from '@/lib/contexts/research-activity-context'
import { motion } from 'framer-motion'

export function ResearchHistoryTimeline() {
  const { activity } = useResearchContext()

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium">Research Timeline</h3>
      <div className="relative pl-4">
        {activity.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pb-4 last:pb-0"
          >
            {/* Timeline line */}
            {index !== activity.length - 1 && (
              <div className="absolute left-0 top-2 bottom-0 w-px bg-border" />
            )}
            {/* Timeline dot */}
            <div className="absolute left-0 top-2 w-2 h-2 -translate-x-[3px] rounded-full bg-primary" />
            
            <div className="pl-4">
              <p className="text-sm">{item.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(item.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
} 