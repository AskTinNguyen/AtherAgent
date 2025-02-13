'use client'

import { ErrorBoundary } from '@/components/shared/error-boundary'
import { useResearch } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Brain, Layers, Lightbulb, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface ResearchPathNode {
  depth: number
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  message: string
  timestamp: string
  status: 'pending' | 'complete' | 'error'
  metrics?: {
    relevance: number
    quality: number
    timeRelevance: number
  }
  memory?: {
    context: string
    sourceUrls: string[]
  }
  children?: ResearchPathNode[]
}

export function ResearchPathVisualization() {
  const { state } = useResearch()
  const { activity, sourceMetrics } = state

  // Build research tree with metrics and memory - improved synchronization
  const researchTree = useMemo(() => {
    const tree: ResearchPathNode[] = []
    const nodesByDepth = new Map<number, ResearchPathNode>()

    // First pass: Create nodes with basic info
    activity.forEach((item) => {
      const node: ResearchPathNode = {
        depth: item.depth || 1,
        type: item.type || 'search',
        message: item.message || '',
        timestamp: item.timestamp,
        status: item.status || 'pending',
        children: []
      }

      // Store node reference by depth for later enhancement
      if (!nodesByDepth.has(node.depth)) {
        nodesByDepth.set(node.depth, node)
        tree.push(node)
      } else {
        const parentNode = nodesByDepth.get(node.depth)
        if (parentNode && parentNode.children) {
          parentNode.children.push(node)
        }
      }
    })

    // Second pass: Enhance nodes with metrics
    sourceMetrics.forEach((metric) => {
      const node = nodesByDepth.get(metric.depthLevel)
      if (node) {
        node.metrics = {
          relevance: metric.relevanceScore,
          quality: metric.contentQuality,
          timeRelevance: metric.timeRelevance
        }
      }
    })

    return tree
  }, [activity, sourceMetrics])

  const renderNode = (node: ResearchPathNode, index: number) => {
    return (
      <motion.div
        key={`${node.depth}-${index}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative"
      >
        <Card className="mb-4">
          <div className="p-4">
            <div className="flex items-start gap-4">
              {/* Depth and Type Indicator */}
              <div className="flex flex-col items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-primary ml-1">
                          {node.depth}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Research Depth {node.depth}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {getActivityIcon(node.type)}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      'size-2 rounded-full',
                      node.status === 'pending' && 'bg-yellow-500',
                      node.status === 'complete' && 'bg-green-500',
                      node.status === 'error' && 'bg-red-500'
                    )}
                  />
                  <span className="text-xs font-medium capitalize">{node.type}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(node.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-sm break-words whitespace-pre-wrap mb-3">
                  {node.message}
                </p>

                {/* Metrics Display */}
                {node.metrics && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <MetricBadge
                      label="Relevance"
                      value={node.metrics.relevance}
                      variant="default"
                    />
                    <MetricBadge
                      label="Quality"
                      value={node.metrics.quality}
                      variant="secondary"
                    />
                    <MetricBadge
                      label="Time Relevance"
                      value={node.metrics.timeRelevance}
                      variant="outline"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {node.children && node.children.length > 0 && (
          <div className="ml-8 pl-4 border-l border-dashed border-accent">
            {node.children.map((child, childIndex) => renderNode(child, childIndex))}
          </div>
        )}
      </motion.div>
    )
  }

  if (activity.length === 0) {
    return null
  }

  return (
    <ErrorBoundary>
      <div className="relative">
        {/* Progress Bar */}
        <div className="sticky top-0 bg-background/95 backdrop-blur pt-2 pb-4 z-10">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Research Progress</span>
            <span>{state.depth.current} / {state.depth.max} Depth</span>
          </div>
          <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{
                width: `${(state.depth.current / state.depth.max) * 100}%`
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Research Path Tree */}
        <div className="mt-4 space-y-2">
          {researchTree.map((node, index) => renderNode(node, index))}
        </div>
      </div>
    </ErrorBoundary>
  )
}

function MetricBadge({ label, value, variant }: { label: string; value: number; variant: 'default' | 'secondary' | 'outline' }) {
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <span className="text-xs">{label}</span>
      <span className="text-xs font-medium">{Math.round(value * 100)}%</span>
    </Badge>
  )
}

function getActivityIcon(type: ResearchPathNode['type']) {
  switch (type) {
    case 'analyze':
    case 'reasoning':
      return <Brain className="h-4 w-4 text-blue-500" />
    case 'synthesis':
    case 'thought':
      return <Lightbulb className="h-4 w-4 text-yellow-500" />
    default:
      return <RefreshCw className="h-4 w-4 text-green-500" />
  }
} 