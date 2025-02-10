'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { useDeepResearch } from './deep-research-provider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface ResearchPathNode {
  depth: number
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  message: string
  timestamp: string
  status: 'pending' | 'complete' | 'error'
  children?: ResearchPathNode[]
}

export function ResearchPathVisualization() {
  const { state } = useDeepResearch()
  const { activity, currentDepth, maxDepth } = state

  // Build tree structure from activity
  const buildResearchTree = (activities: typeof activity): ResearchPathNode[] => {
    const tree: ResearchPathNode[] = []
    const depthMap = new Map<number, ResearchPathNode[]>()

    activities.forEach(item => {
      const node: ResearchPathNode = {
        depth: item.depth || 0,
        type: item.type,
        message: item.message,
        timestamp: item.timestamp,
        status: item.status,
        children: []
      }

      if (!depthMap.has(node.depth)) {
        depthMap.set(node.depth, [])
      }
      depthMap.get(node.depth)?.push(node)

      if (node.depth === 0) {
        tree.push(node)
      } else {
        const parentNodes = depthMap.get(node.depth - 1) || []
        const parent = parentNodes[parentNodes.length - 1]
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(node)
        }
      }
    })

    return tree
  }

  const researchTree = buildResearchTree(activity)

  const renderNode = (node: ResearchPathNode, index: number) => {
    return (
      <motion.div
        key={`${node.depth}-${index}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative"
      >
        <div className="flex items-start gap-2 mb-4">
          <div className="flex items-center gap-1 mt-1">
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
          </div>
          
          <div className="flex-1 bg-accent/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn(
                  'size-2 rounded-full',
                  node.status === 'pending' && 'bg-yellow-500',
                  node.status === 'complete' && 'bg-green-500',
                  node.status === 'error' && 'bg-red-500'
                )}
              />
              <span className="text-xs font-medium capitalize">{node.type}</span>
            </div>
            <p className="text-sm break-words whitespace-pre-wrap">
              {node.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(node.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>

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
    <div className="relative">
      {/* Progress Bar */}
      <div className="sticky top-0 bg-background/95 backdrop-blur pt-2 pb-4 z-10">
        <div className="flex items-center justify-between text-sm mb-2">
          <span>Research Progress</span>
          <span>{currentDepth} / {maxDepth} Depth</span>
        </div>
        <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${(currentDepth / maxDepth) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Research Path Tree */}
      <div className="mt-4 space-y-2">
        {researchTree.map((node, index) => renderNode(node, index))}
      </div>
    </div>
  )
} 