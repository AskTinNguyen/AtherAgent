'use client'

import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Search } from 'lucide-react'

interface MetricsGridProps {
  currentDepth: number
  maxDepth: number
  completedSteps: number
  totalExpectedSteps: number
}

export function MetricsGrid({ 
  currentDepth,
  maxDepth,
  completedSteps,
  totalExpectedSteps
}: MetricsGridProps) {
  const metrics = [
    {
      title: 'Depth Progress',
      icon: <Search className="h-4 w-4 text-primary" />,
      value: (currentDepth / maxDepth) * 100,
      detail: `Level ${currentDepth}/${maxDepth}`
    },
    {
      title: 'Research Progress',
      icon: <ArrowRight className="h-4 w-4 text-green-500" />,
      value: (completedSteps / totalExpectedSteps) * 100,
      detail: `${completedSteps}/${totalExpectedSteps} Steps`
    },
    {
      title: 'Time Elapsed',
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      value: completedSteps > 0 ? Math.min((completedSteps / totalExpectedSteps) * 100, 100) : 0,
      detail: 'In Progress'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            {metric.icon}
            <h3 className="text-sm font-medium">{metric.title}</h3>
          </div>
          
          <Progress value={metric.value} className="h-2" />
          
          <p className="text-xs text-muted-foreground mt-2">
            {metric.detail}
          </p>
        </motion.div>
      ))}
    </div>
  )
} 