'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface HistoryProps {
  location: 'sidebar' | 'dropdown'
}

export function History({ location }: HistoryProps) {
  return (
    <ScrollArea className={cn(
      'flex-1',
      location === 'dropdown' && 'h-[300px]'
    )}>
      <div className="p-2">
        {/* History items will be added here */}
        <div className="text-sm text-muted-foreground">No history yet</div>
      </div>
    </ScrollArea>
  )
}
