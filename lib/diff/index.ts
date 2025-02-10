import { SearchResult } from '@/lib/types'
import { DiffResult, DiffType, ResultDiff } from './types'

const RELEVANCE_THRESHOLD = 0.2
const REFINEMENT_THRESHOLD = 0.1

export function compareSearchResults(
  previousResults: SearchResult[],
  currentResults: SearchResult[]
): DiffResult {
  const diffResult: DiffResult = {
    additions: [],
    refinements: [],
    removals: [],
    unchanged: [],
    metrics: {
      totalChanges: 0,
      newInsights: 0,
      refinements: 0,
      relevanceImprovement: 0,
      depthProgress: 0
    }
  }

  // Track processed results to identify removals
  const processedUrls = new Set<string>()

  // First pass: Find additions, refinements, and unchanged
  currentResults.forEach(currentResult => {
    const previousResult = previousResults.find(p => p.url === currentResult.url)
    processedUrls.add(currentResult.url)

    if (!previousResult) {
      // New result
      diffResult.additions.push(createDiff('added', currentResult))
      diffResult.metrics.newInsights++
    } else {
      // Compare for refinements
      const changes = compareResults(previousResult, currentResult)
      if (changes.hasChanges) {
        diffResult.refinements.push({
          type: 'refined',
          result: currentResult,
          changes: changes.details,
          metadata: {
            previousRelevance: previousResult.relevance,
            previousDepth: previousResult.depth,
            refinementReason: changes.reason
          }
        })
        diffResult.metrics.refinements++
      } else {
        diffResult.unchanged.push(createDiff('unchanged', currentResult))
      }
    }
  })

  // Second pass: Find removals
  previousResults.forEach(previousResult => {
    if (!processedUrls.has(previousResult.url)) {
      diffResult.removals.push(createDiff('removed', previousResult))
    }
  })

  // Calculate metrics
  diffResult.metrics.totalChanges = 
    diffResult.additions.length + 
    diffResult.refinements.length + 
    diffResult.removals.length

  diffResult.metrics.relevanceImprovement = calculateRelevanceImprovement(
    previousResults,
    currentResults
  )

  diffResult.metrics.depthProgress = calculateDepthProgress(
    previousResults,
    currentResults
  )

  return diffResult
}

function compareResults(
  previous: SearchResult,
  current: SearchResult
): {
  hasChanges: boolean
  details: NonNullable<ResultDiff['changes']>
  reason: string
} {
  const changes: NonNullable<ResultDiff['changes']> = {}
  const reasons: string[] = []

  // Check title changes
  if (previous.title !== current.title) {
    changes.title = true
    reasons.push('title updated')
  }

  // Check content changes
  if (previous.content !== current.content) {
    changes.content = true
    reasons.push('content updated')
  }

  // Check relevance improvement
  if (current.relevance - previous.relevance > RELEVANCE_THRESHOLD) {
    changes.relevance = current.relevance - previous.relevance
    reasons.push(`relevance improved by ${(changes.relevance * 100).toFixed(1)}%`)
  }

  // Check depth progress
  if (current.depth > previous.depth) {
    changes.depth = current.depth - previous.depth
    reasons.push(`depth increased by ${changes.depth} levels`)
  }

  return {
    hasChanges: Object.keys(changes).length > 0,
    details: changes,
    reason: reasons.join(', ')
  }
}

function createDiff(type: DiffType, result: SearchResult): ResultDiff {
  return { type, result }
}

function calculateRelevanceImprovement(
  previous: SearchResult[],
  current: SearchResult[]
): number {
  const prevAvg = average(previous.map(r => r.relevance))
  const currAvg = average(current.map(r => r.relevance))
  return currAvg - prevAvg
}

function calculateDepthProgress(
  previous: SearchResult[],
  current: SearchResult[]
): number {
  const prevMaxDepth = Math.max(...previous.map(r => r.depth))
  const currMaxDepth = Math.max(...current.map(r => r.depth))
  return currMaxDepth - prevMaxDepth
}

function average(numbers: number[]): number {
  return numbers.length > 0
    ? numbers.reduce((a, b) => a + b, 0) / numbers.length
    : 0
} 