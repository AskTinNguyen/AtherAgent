'use client'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Clock, Download } from 'lucide-react'
import { useState } from 'react'
import { useDeepResearch } from './deep-research-provider'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface TimelineEvent {
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  message: string
  timestamp: string
  depth?: number
  status: 'pending' | 'complete' | 'error'
}

interface TimelineGroup {
  date: string
  events: TimelineEvent[]
}

export function ResearchHistoryTimeline() {
  const { state } = useDeepResearch()
  const { activity } = state
  const [filter, setFilter] = useState<string>('all')

  // Group events by date
  const groupedEvents = activity.reduce<TimelineGroup[]>((groups, event) => {
    const date = new Date(event.timestamp).toLocaleDateString()
    const existingGroup = groups.find(g => g.date === date)
    
    if (existingGroup) {
      existingGroup.events.push(event)
    } else {
      groups.push({ date, events: [event] })
    }
    
    return groups
  }, [])

  // Filter events based on selected type
  const filteredGroups = groupedEvents.map(group => ({
    ...group,
    events: group.events.filter(event => 
      filter === 'all' || event.type === filter
    )
  })).filter(group => group.events.length > 0)

  const handleExport = () => {
    const exportData = {
      researchHistory: groupedEvents,
      metadata: {
        exportDate: new Date().toISOString(),
        totalEvents: activity.length
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-history-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Research History</h3>
        <p className="text-sm text-muted-foreground">
          Your research history will appear here once you start exploring.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur p-2 z-10">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="search">Search</SelectItem>
              <SelectItem value="extract">Extract</SelectItem>
              <SelectItem value="analyze">Analyze</SelectItem>
              <SelectItem value="reasoning">Reasoning</SelectItem>
              <SelectItem value="synthesis">Synthesis</SelectItem>
              <SelectItem value="thought">Thought</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          Export History
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {filteredGroups.map((group, groupIndex) => (
          <motion.div
            key={group.date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <div className="sticky top-16 bg-background/95 backdrop-blur py-2 z-[5]">
              <h3 className="text-sm font-medium">{group.date}</h3>
            </div>

            <div className="space-y-4 mt-4">
              {group.events.map((event, eventIndex) => (
                <motion.div
                  key={`${event.timestamp}-${eventIndex}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: eventIndex * 0.05 }}
                  className="relative pl-6 before:absolute before:left-2 before:top-2 before:size-2 before:rounded-full before:bg-primary"
                >
                  <Card className="p-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm whitespace-pre-wrap">{event.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground capitalize">
                              {event.type}
                            </span>
                            {event.depth !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                Depth: {event.depth}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div
                        className={cn(
                          'h-1 w-full rounded-full',
                          event.status === 'pending' && 'bg-yellow-500/20',
                          event.status === 'complete' && 'bg-green-500/20',
                          event.status === 'error' && 'bg-red-500/20'
                        )}
                      >
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            event.status === 'pending' && 'bg-yellow-500 w-1/2',
                            event.status === 'complete' && 'bg-green-500 w-full',
                            event.status === 'error' && 'bg-red-500 w-full'
                          )}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
} 