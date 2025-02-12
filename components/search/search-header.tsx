'use client'

import { ErrorBoundary } from '@/components/shared/error-boundary'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

interface SearchHeaderProps {
  showRankedAnalysis: boolean
  onToggleRankedAnalysis: () => void
  includeDomainsString?: string
}

function SearchHeaderContent({
  showRankedAnalysis,
  onToggleRankedAnalysis,
  includeDomainsString = ''
}: SearchHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          Search Results{includeDomainsString}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRankedAnalysis}
        >
          {showRankedAnalysis ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export function SearchHeader(props: SearchHeaderProps) {
  return (
    <ErrorBoundary>
      <SearchHeaderContent {...props} />
    </ErrorBoundary>
  )
} 