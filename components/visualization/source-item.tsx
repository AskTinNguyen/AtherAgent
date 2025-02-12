'use client'

import { type ResearchSource } from '../deep-research-provider'

interface SourceItemProps {
  source: ResearchSource
}

export function SourceItem({ source }: SourceItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium hover:underline break-words"
      >
        {source.title}
      </a>
      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground truncate">
          {new URL(source.url).hostname}
        </div>
        <div className="text-xs text-muted-foreground">
          Relevance: {Math.round(source.relevance * 100)}%
        </div>
      </div>
    </div>
  )
} 