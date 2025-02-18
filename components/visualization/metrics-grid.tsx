'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
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
      icon: Search,
      iconClassName: "text-blue-500",
      value: (currentDepth / maxDepth) * 100,
      detail: `Level ${currentDepth}/${maxDepth}`,
      progressClassName: "bg-blue-500"
    },
    {
      title: 'Research Progress',
      icon: ArrowRight,
      iconClassName: "text-green-500",
      value: (completedSteps / totalExpectedSteps) * 100,
      detail: `${completedSteps}/${totalExpectedSteps} Steps`,
      progressClassName: "bg-green-500"
    },
    {
      title: 'Time Elapsed',
      icon: Clock,
      iconClassName: "text-purple-500",
      value: completedSteps > 0 ? Math.min((completedSteps / totalExpectedSteps) * 100, 100) : 0,
      detail: 'In Progress',
      progressClassName: "bg-purple-500"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        
        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.2,
              ease: "easeOut"
            }}
          >
            <Card className="overflow-hidden">
              <div className="p-4 space-y-2">
                {/* <div className="flex items-center justify-between space-x-0"> */}
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className={cn(
                      "p-2 rounded-md shrink-0",
                      metric.value >= 100 ? "bg-muted" : "bg-primary/10"
                    )}>
                      <Icon className={cn("h-4 w-4", metric.iconClassName)} />
                    </div>
                    <h3 className="text-xs font-medium tracking-tight">
                      {metric.title}
                    </h3>
                  </div>
                  <span className="text-sm font-medium tabular-nums truncate">
                    {Math.round(metric.value)}%
                  </span>
                {/* </div> */}
                
                <div className="space-y-2">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        "h-full w-full rounded-full transition-all duration-300",
                        metric.progressClassName
                      )}
                      style={{
                        width: `${Math.min(Math.max(metric.value, 0), 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium truncate">
                    {metric.detail}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
} 