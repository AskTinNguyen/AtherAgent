'use client'

import type { HighlightData } from '@/lib/utils/research-diff'
import { ResearchFindings } from './research-findings'

interface ResearchContentProps {
  newFindings: HighlightData[]
  refinements: HighlightData[]
  onHighlightSelect?: (highlight: HighlightData) => void
}

export function ResearchContent({ newFindings, refinements, onHighlightSelect }: ResearchContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ResearchFindings 
        findings={newFindings}
        type="new"
        onHighlightSelect={onHighlightSelect}
      />
      <ResearchFindings 
        findings={refinements}
        type="refined"
        onHighlightSelect={onHighlightSelect}
      />
    </div>
  )
} 