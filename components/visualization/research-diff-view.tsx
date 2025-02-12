'use client'

import { ErrorBoundary } from '@/components/shared/error-boundary'
import type { HighlightData, VisualizationData } from '@/lib/utils/research-diff'
import { motion } from 'framer-motion'
import * as React from 'react'
import { MetricsGrid } from './metrics-grid'
import { ResearchContent } from './research-content'
import { ResearchHeader } from './research-header'
import { ResearchTimeline } from './research-timeline'

export interface HighlightData {
  id: string
  content: string
  source: string
  confidence: number
  type: 'new' | 'refined' | 'validated'
}

interface ResearchDiffViewProps {
  visualization: VisualizationData
  onHighlightSelect?: (highlight: HighlightData) => void
  onModeChange?: (mode: 'side-by-side' | 'overlay' | 'timeline') => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

function ResearchDiffViewContent({
  visualization,
  onHighlightSelect,
  onModeChange
}: ResearchDiffViewProps) {
  const [activeMode, setActiveMode] = React.useState(visualization.interactionState.comparisonMode)

  const handleModeChange = (mode: 'side-by-side' | 'overlay' | 'timeline') => {
    setActiveMode(mode)
    onModeChange?.(mode)
  }

  return (
    <motion.div
      className="w-full max-w-7xl mx-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900 rounded-xl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <ResearchHeader 
        activeMode={activeMode}
        onModeChange={handleModeChange}
      />

      <MetricsGrid metrics={visualization.evolutionMetrics} />

      <ResearchContent 
        newFindings={visualization.diffHighlights.newFindings}
        refinements={visualization.diffHighlights.refinements}
        onHighlightSelect={onHighlightSelect}
      />

      {activeMode === 'timeline' && (
        <ResearchTimeline timelineData={visualization.visualEnhancements.timelineData} />
      )}
    </motion.div>
  )
}

export function ResearchDiffView(props: ResearchDiffViewProps) {
  return (
    <ErrorBoundary>
      <ResearchDiffViewContent {...props} />
    </ErrorBoundary>
  )
} 