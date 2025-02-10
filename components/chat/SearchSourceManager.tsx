'use client'

import { SearchSource } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Message } from 'ai'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '../ui/button'

interface SearchSourceManagerProps {
  messages: Message[]
  onSourceSelect: (source: SearchSource) => void
  inputValue: string
  position: {
    top: number
    left: number
  }
  isVisible: boolean
  onClose: () => void
}

export function SearchSourceManager({
  messages,
  onSourceSelect,
  inputValue,
  position,
  isVisible,
  onClose
}: SearchSourceManagerProps) {
  const [sources, setSources] = useState<SearchSource[]>([])
  const [filteredSources, setFilteredSources] = useState<SearchSource[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Extract sources from messages
  useEffect(() => {
    const extractedSources = messages
      .flatMap(msg => (msg as any).searchSources || [])
      .filter((source): source is SearchSource => !!source)
    setSources(extractedSources)
  }, [messages])

  // Filter sources based on input
  useEffect(() => {
    // If no @ symbol in input at all, close the manager
    if (!inputValue.includes('@')) {
      onClose()
      return
    }

    // If no input or just @, show all sources
    if (!inputValue.trim() || inputValue.trim() === '@') {
      setFilteredSources(sources)
      return
    }

    // Get the text after the last @ symbol
    const lastAtIndex = inputValue.lastIndexOf('@')
    const searchText = lastAtIndex >= 0 ? 
      inputValue.slice(lastAtIndex + 1).trim() : 
      inputValue.trim()

    const filtered = sources.filter(source => 
      !searchText ||
      source.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      source.url.toLowerCase().includes(searchText.toLowerCase()) ||
      source.snippet?.toLowerCase().includes(searchText.toLowerCase())
    )
    setFilteredSources(filtered)
    setSelectedIndex(0)
  }, [sources, inputValue])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredSources.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredSources[selectedIndex]) {
          onSourceSelect(filteredSources[selectedIndex])
          onClose()
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [isVisible, filteredSources, selectedIndex, onSourceSelect, onClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isVisible) return null

  return (
    <div
      className="absolute z-50 w-96 max-h-80 overflow-y-auto rounded-lg border bg-background shadow-lg"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      <div className="p-2 space-y-1">
        {filteredSources.length > 0 ? (
          filteredSources.map((source, index) => (
            <Button
              key={`${source.messageId}-${source.url}`}
              variant="ghost"
              className={cn(
                'w-full justify-start text-left font-normal',
                index === selectedIndex && 'bg-accent'
              )}
              onClick={() => {
                onSourceSelect(source)
                onClose()
              }}
            >
              <div className="truncate">
                <div className="font-medium">{source.title || source.url}</div>
                {source.snippet && (
                  <div className="text-xs text-muted-foreground truncate">
                    {source.snippet}
                  </div>
                )}
              </div>
            </Button>
          ))
        ) : (
          <div className="p-2 text-sm text-muted-foreground">
            No sources found
          </div>
        )}
      </div>
    </div>
  )
} 