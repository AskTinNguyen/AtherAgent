'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface TimelinePoint {
  timestamp: number
  snapshot: string
  significance: number
  branchPoint?: boolean
}

interface ResearchTimelineProps {
  timelineData: TimelinePoint[]
}

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}

export function ResearchTimeline({ timelineData }: ResearchTimelineProps) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold mb-6">Research Timeline</h3>
      <div className="relative py-8">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div className="relative flex justify-between">
          {timelineData.map((point, index) => (
            <motion.div
              key={point.timestamp}
              className="relative flex flex-col items-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={cn(
                "w-4 h-4 rounded-full z-10",
                point.branchPoint 
                  ? "bg-yellow-400 ring-4 ring-yellow-100 dark:ring-yellow-900" 
                  : "bg-blue-400 ring-4 ring-blue-100 dark:ring-blue-900"
              )} />
              <div className="mt-4 text-sm text-center max-w-[120px]">
                <div className="font-medium">
                  {new Date(point.timestamp).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {point.snapshot}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
} 