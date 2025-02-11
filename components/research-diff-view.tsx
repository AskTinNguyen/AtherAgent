'use client'

import { cn } from '@/lib/utils'
import { type DiffResult, type VisualizationData } from '@/lib/utils/research-diff'
import { motion } from 'framer-motion'
import { ArrowUpRight, FileText, Star } from 'lucide-react'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Progress } from './ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface ResearchDiffViewProps {
  diffResult: DiffResult
  visualization: VisualizationData
  className?: string
}

export function ResearchDiffView({ diffResult, visualization, className }: ResearchDiffViewProps) {
  const { diffHighlights, evolutionMetrics } = visualization

  return (
    <div className={cn('space-y-6', className)}>
      {/* Evolution Metrics */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Research Evolution</h3>
        <div className="grid grid-cols-3 gap-4">
          <MetricItem
            label="Depth Progress"
            value={evolutionMetrics.depthProgress}
            icon={<ArrowUpRight className="w-4 h-4" />}
          />
          <MetricItem
            label="Quality Improvement"
            value={evolutionMetrics.qualityImprovement}
            icon={<Star className="w-4 h-4" />}
          />
          <MetricItem
            label="Source Reliability"
            value={evolutionMetrics.sourceReliability}
            icon={<FileText className="w-4 h-4" />}
          />
        </div>
      </Card>

      {/* New Findings */}
      {diffHighlights.newFindings.length > 0 && (
        <section>
          <h4 className="text-md font-medium mb-3">New Insights</h4>
          <div className="space-y-3">
            {diffHighlights.newFindings.map((finding, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{finding.content}</p>
                      {finding.sourceUrl && (
                        <a
                          href={finding.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                        >
                          View Source
                        </a>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {Math.round(finding.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Refinements */}
      {diffHighlights.refinements.length > 0 && (
        <section>
          <h4 className="text-md font-medium mb-3">Refined Understanding</h4>
          <div className="space-y-3">
            {diffHighlights.refinements.map((refinement, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{refinement.content}</p>
                      {refinement.sourceUrl && (
                        <a
                          href={refinement.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                        >
                          View Source
                        </a>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {Math.round(refinement.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Validations */}
      {diffHighlights.validations.length > 0 && (
        <section>
          <h4 className="text-md font-medium mb-3">Cross-Validated Findings</h4>
          <div className="space-y-3">
            {diffHighlights.validations.map((validation, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{validation.content}</p>
                      {validation.sourceUrl && (
                        <a
                          href={validation.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                        >
                          View Source
                        </a>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2">
                      Validated
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function MetricItem({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const percentage = Math.round(value * 100)
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {icon}
              <span className="text-sm font-medium">{label}</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <span className="text-xs text-gray-500">{percentage}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {percentage}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 