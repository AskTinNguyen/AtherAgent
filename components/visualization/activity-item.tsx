'use client'

import { cn } from '@/lib/utils'
import { Layers } from 'lucide-react'
import { type ResearchActivity } from '../deep-research-provider'

interface ActivityItemProps {
  activity: ResearchActivity
}

export function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3">
      {activity.type === 'search' ? (
        <div className="flex items-center gap-1 shrink-0 mt-1">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">{activity.depth}</span>
        </div>
      ) : (
        <div
          className={cn(
            'size-2 rounded-full shrink-0 mt-1.5',
            activity.status === 'pending' && 'bg-yellow-500',
            activity.status === 'complete' && 'bg-green-500',
            activity.status === 'error' && 'bg-red-500',
          )}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground break-words whitespace-pre-wrap">
          {activity.type === 'search' 
            ? activity.message.replace(/^Depth \d+: /, '')
            : activity.message
          }
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(activity.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
} 