'use client'

import { DiffResult, DiffType, DiffViewConfig } from '@/lib/diff/types'
import { cn } from '@/lib/utils'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Progress } from './ui/progress'

interface DiffViewProps {
  diffResult: DiffResult
  config?: Partial<DiffViewConfig>
  className?: string
}

const defaultConfig: DiffViewConfig = {
  showInlineChanges: true,
  showMetrics: true,
  groupByChangeType: true,
  sortByRelevance: true,
  highlightThreshold: 0.2
}

export function DiffView({
  diffResult,
  config = {},
  className
}: DiffViewProps) {
  const finalConfig = { ...defaultConfig, ...config }
  const { metrics } = diffResult

  return (
    <div className={cn('space-y-4', className)}>
      {finalConfig.showMetrics && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Research Progress</span>
              <span className="text-sm text-muted-foreground">
                {metrics.totalChanges} changes
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MetricItem
                label="New Insights"
                value={metrics.newInsights}
                total={metrics.totalChanges}
              />
              <MetricItem
                label="Refinements"
                value={metrics.refinements}
                total={metrics.totalChanges}
              />
              <MetricItem
                label="Relevance Improvement"
                value={metrics.relevanceImprovement}
                format="percentage"
              />
              <MetricItem
                label="Depth Progress"
                value={metrics.depthProgress}
                format="levels"
              />
            </div>
          </div>
        </Card>
      )}

      {finalConfig.groupByChangeType ? (
        <>
          <DiffGroup
            title="New Findings"
            items={diffResult.additions}
            type="added"
          />
          <DiffGroup
            title="Refined Results"
            items={diffResult.refinements}
            type="refined"
          />
          <DiffGroup
            title="Removed Results"
            items={diffResult.removals}
            type="removed"
          />
        </>
      ) : (
        <div className="space-y-2">
          {[...diffResult.additions, ...diffResult.refinements].map((diff, i) => (
            <DiffItem key={i} diff={diff} showInlineChanges={finalConfig.showInlineChanges} />
          ))}
        </div>
      )}
    </div>
  )
}

function DiffGroup({
  title,
  items,
  type
}: {
  title: string
  items: any[]
  type: DiffType
}) {
  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="outline">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((diff, i) => (
          <DiffItem key={i} diff={diff} type={type} />
        ))}
      </div>
    </div>
  )
}

function DiffItem({
  diff,
  type,
  showInlineChanges = true
}: {
  diff: any
  type?: DiffType
  showInlineChanges?: boolean
}) {
  const { result, changes, metadata } = diff

  return (
    <Card className={cn(
      'p-3 transition-colors',
      type === 'added' && 'bg-green-50 dark:bg-green-950',
      type === 'refined' && 'bg-blue-50 dark:bg-blue-950',
      type === 'removed' && 'bg-red-50 dark:bg-red-950'
    )}>
      <div className="space-y-1">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="font-medium leading-none">{result.title}</h4>
            <p className="text-sm text-muted-foreground">{result.content}</p>
          </div>
          {changes && (
            <Badge variant={type === 'refined' ? 'secondary' : 'outline'}>
              {metadata?.refinementReason || type}
            </Badge>
          )}
        </div>
        {showInlineChanges && changes && (
          <div className="mt-2 text-xs text-muted-foreground">
            {changes.relevance && (
              <span className="mr-2">
                Relevance: +{(changes.relevance * 100).toFixed(1)}%
              </span>
            )}
            {changes.depth && (
              <span>Depth: +{changes.depth} levels</span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

function MetricItem({
  label,
  value,
  total,
  format
}: {
  label: string
  value: number
  total?: number
  format?: 'percentage' | 'levels'
}) {
  const progress = total ? (value / total) * 100 : value * 100

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span>
          {format === 'percentage' && `${(value * 100).toFixed(1)}%`}
          {format === 'levels' && `+${value} levels`}
          {!format && value}
        </span>
      </div>
      <Progress value={progress} className="h-1" />
    </div>
  )
} 