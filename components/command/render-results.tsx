'use client'

import { cn } from '@/lib/utils'
import { KBarResults, useMatches } from 'kbar'

export function RenderResults() {
  const { results } = useMatches()

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === 'string' ? (
          // Render section header
          <div className="px-4 py-2 text-xs text-muted-foreground uppercase">
            {item}
          </div>
        ) : (
          // Render command item
          <div
            className={cn(
              'flex items-center justify-between px-4 py-2',
              'rounded-md cursor-pointer',
              'text-sm transition-colors',
              active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
            )}
          >
            <div className="flex items-center gap-2">
              {item.icon && <span>{item.icon}</span>}
              <span>{item.name}</span>
            </div>
            {item.shortcut?.length ? (
              <div className="flex items-center gap-1">
                {item.shortcut.map((sc) => (
                  <kbd
                    key={sc}
                    className={cn(
                      'pointer-events-none inline-flex h-5 select-none items-center gap-1',
                      'rounded border bg-muted px-1.5',
                      'font-mono text-[10px] font-medium'
                    )}
                  >
                    {sc === 'meta' ? '⌘' : 
                     sc === 'shift' ? '⇧' : 
                     sc.charAt(0).toUpperCase() + sc.slice(1)}
                  </kbd>
                ))}
              </div>
            ) : null}
          </div>
        )
      }
    />
  )
} 