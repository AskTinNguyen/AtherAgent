'use client'

import { useResearch } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
import { Globe } from 'lucide-react'
import { Toggle } from './ui/toggle'

export function SearchModeToggle() {
  const { state, toggleSearch } = useResearch()

  return (
    <Toggle
      aria-label="Toggle search mode"
      pressed={state.searchEnabled}
      onPressedChange={toggleSearch}
      variant="outline"
      className={cn(
        'gap-1 px-3 border border-input text-muted-foreground bg-background',
        'data-[state=on]:bg-accent-blue',
        'data-[state=on]:text-accent-blue-foreground',
        'data-[state=on]:border-accent-blue-border',
        'hover:bg-accent hover:text-accent-foreground rounded-full'
      )}
    >
      <Globe className="size-4" />
      <span className="text-xs">Search</span>
      <kbd className="ml-2 text-[10px] text-muted-foreground">
        {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'} + .
      </kbd>
    </Toggle>
  )
}
