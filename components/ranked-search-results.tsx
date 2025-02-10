'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { ResearchSourceMetrics } from '@/lib/types/research'
import { cn } from '@/lib/utils'
import { calculateCompositeScore, getMetricIcon, getScoreColor, getScoreLabel } from '@/lib/utils/result-ranking'
import { Eye, EyeOff, Star } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Progress } from './ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface RankedSearchResultsProps {
  results: Array<{
    url: string
    title: string
    content?: string
    metrics: ResearchSourceMetrics
    timestamp?: number
  }>
  currentDepth: number
  maxDepth: number
}

type RankedResult = RankedSearchResultsProps['results'][0] & {
  score: ReturnType<typeof calculateCompositeScore>
}

interface ResultsByCategory {
  excellent: RankedResult[]
  good: RankedResult[]
  fair: RankedResult[]
  basic: RankedResult[]
}

export function RankedSearchResults({ results, currentDepth, maxDepth }: RankedSearchResultsProps) {
  const [showMetrics, setShowMetrics] = useState(false)
  const [starredResults, setStarredResults] = useState<Set<string>>(new Set())
  
  const toggleStar = (url: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setStarredResults(prev => {
      const newSet = new Set(prev)
      if (newSet.has(url)) {
        newSet.delete(url)
      } else {
        newSet.add(url)
      }
      return newSet
    })
  }

  const rankedResults = results.map(result => ({
    ...result,
    score: calculateCompositeScore(result.metrics, currentDepth, maxDepth)
  }))

  // Group results by category
  const resultsByCategory = rankedResults.reduce<ResultsByCategory>(
    (acc, result) => {
      const score = result.score.total
      if (score >= 0.8) acc.excellent.push(result)
      else if (score >= 0.6) acc.good.push(result)
      else if (score >= 0.4) acc.fair.push(result)
      else acc.basic.push(result)
      return acc
    },
    { excellent: [], good: [], fair: [], basic: [] }
  )

  const displayUrlName = (url: string) => {
    const hostname = new URL(url).hostname
    const parts = hostname.split('.')
    return parts.length > 2 ? parts.slice(1, -1).join('.') : parts[0]
  }

  const ResultCard = ({ result, index }: { result: RankedResult; index: number }) => (
    <Card className={cn(
      "transition-all duration-200 group hover:shadow-md",
      index === 0 && "ring-2 ring-primary/20"
    )}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Title */}
            <Link 
              href={result.url}
              target="_blank"
              className="flex-1"
            >
              <h3 className="text-sm font-bold leading-tight line-clamp-2 hover:underline">
                {result.title}
              </h3>
            </Link>

            {/* Source Info */}
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-4 w-4">
                <AvatarImage
                  src={`https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}`}
                  alt={displayUrlName(result.url)}
                />
                <AvatarFallback>
                  {displayUrlName(result.url)[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {displayUrlName(result.url)}
              </span>
            </div>

            {/* Content Preview */}
            {result.content && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {result.content}
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 transition-opacity",
                !starredResults.has(result.url) && "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => toggleStar(result.url, e)}
            >
              <Star 
                className={cn(
                  "h-4 w-4",
                  starredResults.has(result.url) 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-muted-foreground"
                )}
              />
            </Button>
            {/* Score Badge */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className={cn(
                    "px-2 py-1 rounded-full text-sm font-medium",
                    getScoreColor(result.score.total)
                  )}>
                    {Math.round(result.score.total * 100)}%
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getScoreLabel(result.score.total)} Match</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Metrics Row */}
        {showMetrics && (
          <div className="flex items-center gap-4 pt-2 border-t">
            {Object.entries(result.score.breakdown).map(([metric, score]) => (
              <TooltipProvider key={metric}>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-2">
                    <span className="text-center">
                      {getMetricIcon(metric as keyof typeof result.score.breakdown)}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground capitalize">
                        {metric}
                      </span>
                      <Progress 
                        value={score * 100} 
                        className="w-16 h-1.5"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="capitalize">
                      {metric}: {Math.round(score * 100)}%
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="space-y-2">
        {Object.entries(resultsByCategory).map(([category, items]: [string, RankedResult[]]) => 
          items.length > 0 && (
            <AccordionItem 
              key={category} 
              value={category}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className={cn(
                "px-4 py-2 text-sm font-medium transition-colors hover:no-underline",
                "hover:bg-muted/50 data-[state=open]:bg-muted/50",
                category === 'excellent' && 'text-green-500',
                category === 'good' && 'text-blue-500',
                category === 'fair' && 'text-yellow-500',
                category === 'basic' && 'text-gray-500'
              )}>
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="capitalize">
                    {category} Results ({items.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMetrics(!showMetrics)
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showMetrics ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Metrics
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Metrics
                      </>
                    )}
                  </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 space-y-2">
                  {items.map((result, index) => (
                    <ResultCard 
                      key={result.url} 
                      result={result} 
                      index={index} 
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        )}
      </Accordion>
    </div>
  )
} 