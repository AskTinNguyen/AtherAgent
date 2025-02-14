'use client'

import { CommandExample } from '@/components/command/command-example'
import { cn } from '@/lib/utils'
import { Action, KBarProvider, useKBar } from 'kbar'

export function CommandProviderWrapper({
  children
}: {
  children: React.ReactNode
}) {
  // Define base actions
  const baseActions: Action[] = [
    {
      id: "root",
      name: "SuperAgent Commands",
      shortcut: ["?"],
      keywords: "help",
      section: "Help"
    }
  ]

  return (
    <KBarProvider actions={baseActions}>
      {/* Register commands */}
      <CommandExample />
      
      {/* Main content */}
      {children}
      
      {/* Command bar trigger */}
      <CommandBarTrigger />
    </KBarProvider>
  )
}

function CommandBarTrigger() {
  const { query } = useKBar()
  
  return (
    <button
      className={cn(
        'fixed right-4 top-4 z-50',
        'inline-flex h-8 w-8 items-center justify-center',
        'rounded-md border bg-background',
        'text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50'
      )}
      onClick={query.toggle}
    >
      <span className="sr-only">Open Command Menu</span>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
} 