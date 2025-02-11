'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Search } from 'lucide-react'

interface MetricsGridProps {
  metrics: {
    depthProgress: number
    qualityImprovement: number
    sourceReliability: number
  }
}

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.entries(metrics)
        .filter(([key]) => key !== 'animationState')
        .map(([key, value]) => (
          <motion.div
            key={key}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="flex items-center gap-2 mb-3">
              {key === 'depthProgress' && <Search className="w-5 h-5 text-blue-500" />}
              {key === 'qualityImprovement' && <ArrowRight className="w-5 h-5 text-green-500" />}
              {key === 'sourceReliability' && <Clock className="w-5 h-5 text-purple-500" />}
              <h3 className="text-lg font-semibold capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
            </div>
            <div className="relative pt-2">
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    key === 'depthProgress' ? 'bg-blue-500' :
                    key === 'qualityImprovement' ? 'bg-green-500' :
                    'bg-purple-500'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${(value as number) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-2xl font-bold mt-2">
                {Math.round((value as number) * 100)}%
              </p>
            </div>
          </motion.div>
        ))}
    </div>
  )
} 