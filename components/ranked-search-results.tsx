'use client'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from '@/lib/utils'
import { getScoreColor, getScoreLabel } from '@/lib/utils/result-ranking'
import { calculateContentQuality, calculateRelevanceScore, calculateSourceAuthority, calculateTimeRelevance } from '@/lib/utils/search'
import { type SearchResultItem } from '@/types/search'
import { motion } from 'framer-motion'
import { ArrowUpRight, Eye, EyeOff, FileText, Star } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Progress } from './ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface RankedSearchResultsProps {
  results: SearchResultItem[]
  query?: string
}

interface RankedResult extends SearchResultItem {
  metrics: {
    relevanceScore: number
    contentQuality: number
    timeRelevance: number
    sourceAuthority: number
  }
}

export function RankedSearchResults({ results, query }: RankedSearchResultsProps) {
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

  // Calculate metrics for each result
  const rankedResults: RankedResult[] = results.map(result => ({
    ...result,
    metrics: {
      relevanceScore: calculateRelevanceScore(result.content, query || ''),
      contentQuality: calculateContentQuality(result.content),
      timeRelevance: calculateTimeRelevance(result.publishedDate),
      sourceAuthority: calculateSourceAuthority(result.url)
    }
  }))

  // Sort by overall quality score
  const sortedResults = rankedResults.sort((a, b) => {
    const scoreA = calculateOverallScore(a.metrics)
    const scoreB = calculateOverallScore(b.metrics)
    return scoreB - scoreA
  })

  const displayUrlName = (url: string) => {
    const hostname = new URL(url).hostname
    const parts = hostname.split('.')
    return parts.length > 2 ? parts.slice(1, -1).join('.') : parts[0]
  }

  const ResultCard = ({ result, index }: { result: RankedResult; index: number }) => (
    <motion.div
      key={result.url}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
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
                      getScoreColor(calculateOverallScore(result.metrics))
                    )}>
                      {Math.round(calculateOverallScore(result.metrics) * 100)}%
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getScoreLabel(calculateOverallScore(result.metrics))}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Metrics Row */}
          {showMetrics && (
            <div className="flex items-center gap-4 pt-2 border-t">
              <MetricItem
                label="Relevance"
                value={result.metrics.relevanceScore}
                icon={<Star className="w-4 h-4" />}
              />
              <MetricItem
                label="Quality"
                value={result.metrics.contentQuality}
                icon={<FileText className="w-4 h-4" />}
              />
              <MetricItem
                label="Freshness"
                value={result.metrics.timeRelevance}
                icon={<ArrowUpRight className="w-4 h-4" />}
              />
              <MetricItem
                label="Authority"
                value={result.metrics.sourceAuthority}
                icon={<Star className="w-4 h-4" />}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="space-y-2">
        {sortedResults.map((result, index) => (
          <AccordionItem 
            key={result.url} 
            value={result.url}
            className="border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className={cn(
              "px-4 py-2 text-sm font-medium transition-colors hover:no-underline",
              "hover:bg-muted/50 data-[state=open]:bg-muted/50"
            )}>
              <div className="flex items-center justify-between w-full pr-4">
                <span className="capitalize">
                  {result.title}
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
                <ResultCard 
                  result={result} 
                  index={index} 
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
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

function calculateOverallScore(metrics: RankedResult['metrics']): number {
  return (
    metrics.relevanceScore * 0.4 +
    metrics.contentQuality * 0.3 +
    metrics.timeRelevance * 0.2 +
    metrics.sourceAuthority * 0.1
  )
} 