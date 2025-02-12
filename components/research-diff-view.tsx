'use client'

import { ErrorBoundary } from '@/components/shared/error-boundary'
import { useDepth } from '@/lib/contexts/research-provider'
import { cn } from '@/lib/utils'
import type { HighlightData, VisualizationData } from '@/lib/utils/research-diff'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Clock, ExternalLink, Search } from 'lucide-react'
import * as React from 'react'

interface ResearchDiffViewProps {
  visualization: VisualizationData
  onHighlightSelect?: (highlight: HighlightData) => void
  onModeChange?: (mode: 'side-by-side' | 'overlay' | 'timeline') => void
}

function ResearchDiffViewContent({
  visualization,
  onHighlightSelect,
  onModeChange
}: ResearchDiffViewProps) {
  const { state: depthState } = useDepth()
  const [activeMode, setActiveMode] = React.useState(visualization.interactionState.comparisonMode)
  const [expandedSections, setExpandedSections] = React.useState(new Set(visualization.interactionState.expandedSections))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    hover: {
      y: -4,
      scale: 1.02,
      transition: { type: "spring", stiffness: 400, damping: 10 }
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <motion.div
      className="w-full max-w-7xl mx-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900 rounded-xl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Research Progress</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Depth Level {depthState.currentDepth} of {depthState.maxDepth}
          </p>
        </div>
        <div className="flex gap-3">
          {['side-by-side', 'overlay', 'timeline'].map((mode) => (
            <motion.button
              key={mode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                activeMode === mode 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
              onClick={() => {
                setActiveMode(mode as any)
                onModeChange?.(mode as any)
              }}
            >
              {mode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(visualization.evolutionMetrics)
          .filter(([key]) => key !== 'animationState')
          .map(([key, value]) => (
            <motion.div
              key={key}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="flex items-center gap-2 mb-3">
                {key === 'depthProgress' && <Search className="w-5 h-5 text-blue-500" />}
                {key === 'qualityImprovement' && <ArrowRight className="w-5 h-5 text-green-500" />}
                {key === 'sourceReliability' && <Clock className="w-5 h-5 text-purple-500" />}
                <h3 className="text-lg font-semibold capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
              </div>
              <div className="relative pt-2">
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      key === 'depthProgress' ? 'bg-blue-500' :
                      key === 'qualityImprovement' ? 'bg-green-500' :
                      'bg-purple-500'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${(value as number) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="text-2xl font-bold mt-2">
                  {Math.round((value as number) * 100)}%
                </p>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Research Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Findings */}
        <motion.div variants={cardVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => toggleSection('newFindings')}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <h3 className="text-lg font-semibold">New Findings</h3>
            </div>
            <motion.div animate={{ rotate: expandedSections.has('newFindings') ? 90 : 0 }}>
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </div>
          <AnimatePresence>
            {expandedSections.has('newFindings') && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  {visualization.diffHighlights.newFindings.map((finding, idx) => (
                    <motion.div
                      key={idx}
                      className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800"
                      variants={cardVariants}
                      whileHover="hover"
                      onClick={() => onHighlightSelect?.(finding)}
                    >
                      <p className="text-gray-800 dark:text-gray-200">{finding.content}</p>
                      {finding.sourceUrl && (
                        <a
                          href={finding.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Source
                        </a>
                      )}
                      {finding.metadata?.tags && finding.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {finding.metadata.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Refinements */}
        <motion.div variants={cardVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => toggleSection('refinements')}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="text-lg font-semibold">Refined Understanding</h3>
            </div>
            <motion.div animate={{ rotate: expandedSections.has('refinements') ? 90 : 0 }}>
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </div>
          <AnimatePresence>
            {expandedSections.has('refinements') && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  {visualization.diffHighlights.refinements.map((refinement, idx) => (
                    <motion.div
                      key={idx}
                      className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
                      variants={cardVariants}
                      whileHover="hover"
                      onClick={() => onHighlightSelect?.(refinement)}
                    >
                      <p className="text-gray-800 dark:text-gray-200">{refinement.content}</p>
                      {refinement.sourceUrl && (
                        <a
                          href={refinement.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Source
                        </a>
                      )}
                      {refinement.metadata?.tags && refinement.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {refinement.metadata.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Timeline View */}
      {activeMode === 'timeline' && (
        <motion.div
          variants={cardVariants}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-6">Research Timeline</h3>
          <div className="relative py-8">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 dark:bg-gray-700" />
            <div className="relative flex justify-between">
              {visualization.visualEnhancements.timelineData.map((point, index) => (
                <motion.div
                  key={point.timestamp}
                  className="relative flex flex-col items-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full z-10",
                    point.branchPoint 
                      ? "bg-yellow-400 ring-4 ring-yellow-100 dark:ring-yellow-900" 
                      : "bg-blue-400 ring-4 ring-blue-100 dark:ring-blue-900"
                  )} />
                  <div className="mt-4 text-sm text-center max-w-[120px]">
                    <div className="font-medium">
                      {new Date(point.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {point.snapshot}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
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