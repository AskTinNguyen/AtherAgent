'use client'

import { Command } from 'cmdk'
import { useEffect, useRef, useState } from 'react'

import {
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { AutocompleteSuggestion } from './types'

interface AutoCompleteProps {
  suggestions: AutocompleteSuggestion[]
  onSelect: (suggestion: AutocompleteSuggestion) => void
  onDismiss: () => void
  inputValue: string
  position: { top: number; left: number }
}

export function AutoComplete({
  suggestions,
  onSelect,
  onDismiss,
  inputValue,
  position
}: AutoCompleteProps) {
  const [open, setOpen] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
        onDismiss()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onDismiss])

  if (!open || suggestions.length === 0) return null

  return (
    <div
      ref={ref}
      className="fixed z-50"
      style={{
        top: position.top + 24,
        left: position.left
      }}
    >
      <Command className="w-64 rounded-lg border bg-background shadow-md">
        <CommandList>
          <CommandGroup heading="Suggestions">
            {suggestions.map((suggestion) => (
              <CommandItem
                key={suggestion.id}
                onSelect={() => {
                  onSelect(suggestion)
                  setOpen(false)
                }}
                className="flex items-center justify-between"
              >
                <span className="truncate">{suggestion.text}</span>
                {suggestion.confidence > 0.8 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
} 