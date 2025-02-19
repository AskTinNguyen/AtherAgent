'use client'

import { type SearchModeToggleProps } from '@/lib/types/search-toggles'
import { cn } from '@/lib/utils'
import { Globe } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Toggle } from './ui/toggle'

export function SearchModeToggle({ enabled, onEnabledChange }: SearchModeToggleProps) {
  const [shortcutKey, setShortcutKey] = useState('Ctrl')

  useEffect(() => {
    setShortcutKey(navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl')
  }, [])

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        onEnabledChange(!enabled)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onEnabledChange])

  // Handle toggle
  const handleToggle = useCallback(() => {
    onEnabledChange(!enabled)
    
    // Update the cookie
    document.cookie = `search-mode=${!enabled}; path=/; max-age=31536000`
    
    console.log('Search mode toggled:', !enabled)
  }, [enabled, onEnabledChange])

  return (
    <Toggle
      aria-label="Toggle search mode"
      pressed={enabled}
      onPressedChange={handleToggle}
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
        {shortcutKey} + .
      </kbd>
    </Toggle>
  )
}
