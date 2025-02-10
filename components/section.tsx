'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  title?: string
  className?: string
}

export function Section({ children, title, className }: SectionProps) {
  return (
    <div className={cn('space-y-1 pt-1', className)}>
      {title && (
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium px-3 py-1 bg-muted rounded-md">
            {title}
          </div>
        </div>
      )}
      {children}
    </div>
  )
}

interface ToolArgsSectionProps {
  children: ReactNode
  tool: string
  number?: number
}

export function ToolArgsSection({ children, tool, number }: ToolArgsSectionProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm font-medium px-2.5 py-1 bg-muted rounded-md">
        {tool}
        {typeof number === 'number' && ` (${number})`}
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}
