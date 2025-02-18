'use client'

import { useResearch } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
import { Globe } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Toggle } from './ui/toggle'

export function SearchModeToggle() {
  const { state, toggleSearch } = useResearch()
  const [shortcutKey, setShortcutKey] = useState('Ctrl')

  useEffect(() => {
    setShortcutKey(navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl')
  }, [])

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        toggleSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSearch])

  // Handle toggle
  const handleToggle = useCallback(() => {
    toggleSearch()
    
    // Update the cookie
    document.cookie = `search-mode=${!state.searchEnabled}; path=/; max-age=31536000`
    
    console.log('Search mode toggled:', !state.searchEnabled)
  }, [toggleSearch, state.searchEnabled])

  return (
    <Toggle
      aria-label="Toggle search mode"
      pressed={state.searchEnabled}
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
