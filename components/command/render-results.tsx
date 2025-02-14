'use client'

import { KBarResults, useMatches } from 'kbar'

export function RenderResults() {
  const { results, rootActionId } = useMatches()

  // Separate AI commands and other results
  const aiCommands = results.filter(item => 
    typeof item !== 'string' && 
    (item.section === 'AI Commands' || item.id === 'ather-root')
  )
  
  const otherResults = results.filter(item => 
    typeof item === 'string' || 
    (item.section !== 'AI Commands' && item.id !== 'ather-root')
  )

  // Combine results with AI commands always at the top
  const combinedResults = [...aiCommands, ...otherResults]

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <KBarResults
        items={combinedResults}
        maxHeight={400}
        onRender={({ item, active }) => {
          if (typeof item === 'string') {
            return (
              <div className="px-4 py-2 text-xs text-muted-foreground uppercase">
                {item}
              </div>
            )
          }

          return (
            <div
              className={`
                flex items-center justify-between px-4 py-2 rounded-md
                ${active ? 'bg-accent text-accent-foreground' : 'transparent'}
              `}
            >
              <div className="flex items-center gap-2">
                {item.icon && <div className="w-4 h-4">{item.icon}</div>}
                <div>
                  <div>{item.name}</div>
                  {item.subtitle && (
                    <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                  )}
                </div>
              </div>
              {item.shortcut?.length ? (
                <div className="flex items-center gap-1">
                  {item.shortcut.map((shortcut: string) => (
                    <kbd
                      key={shortcut}
                      className="px-2 py-1 text-xs rounded bg-muted"
                    >
                      {shortcut === 'meta' ? '⌘' : 
                       shortcut === 'shift' ? '⇧' : 
                       shortcut.charAt(0).toUpperCase() + shortcut.slice(1)}
                    </kbd>
                  ))}
                </div>
              ) : null}
            </div>
          )
        }}
      />
    </div>
  )
} 