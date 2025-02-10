'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AISuggestion, TopicAnalysis } from '@/lib/ai/research-processor'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { AlertCircle, Lightbulb, Loader2, Star, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useDeepResearch } from './deep-research-provider'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface ResearchSuggestion {
  type: 'path' | 'source' | 'depth' | 'refinement' | 'related' | 'cross_reference'
  content: string
  confidence: number
  metadata: {
    sourceUrl?: string
    depthLevel: number
    category: string
    relevanceScore: number
    timestamp: number
    sourceContext?: string
    relatedTopics?: string[]
    previousQueries?: string[]
  }
  context?: {
    previousContent?: string
    nextSteps?: string[]
    rationale?: string
  }
}

interface BookmarkedSuggestion extends Omit<ResearchSuggestion, 'metadata'> {
  id: string
  userId: string
  metadata: ResearchSuggestion['metadata']
  createdAt: string
}

interface ResearchSuggestionsProps {
  onSuggestionSelect?: (content: string) => void
  userId?: string
  chatId: string
}

// Helper function to clean search query
function cleanSearchQuery(query: string): string {
  // Remove depth prefix pattern
  const cleanedQuery = query.replace(/^Depth \d+: Found \d+ results for: /, '')
  return cleanedQuery
}

// Helper function to extract key topics from a search query
function extractKeyTopics(query: string): string[] {
  const cleaned = cleanSearchQuery(query)
  return cleaned
    .split(' ')
    .filter(word => 
      word.length > 3 && 
      !['for', 'and', 'the', 'with', 'from', 'found', 'results'].includes(word.toLowerCase())
    )
    .slice(0, 5) // Take top 5 keywords
}

// Helper function to generate human-friendly suggestion content
function generateSuggestionContent(type: ResearchSuggestion['type'], context: {
  query1?: string
  query2?: string
  depth?: number
  currentDepth?: number
}): { content: string; rationale: string } {
  const { query1, query2, depth, currentDepth } = context

  switch (type) {
    case 'cross_reference': {
      if (!query1 || !query2) return {
        content: 'Explore connections between recent searches',
        rationale: 'Looking for patterns across your research'
      }

      const topics1 = extractKeyTopics(query1)
      const topics2 = extractKeyTopics(query2)
      
      // Find common topics
      const commonTopics = topics1.filter(t => topics2.includes(t))
      
      if (commonTopics.length > 0) {
        return {
          content: `Analyze how ${commonTopics.join(', ')} relates across your recent searches`,
          rationale: 'Found overlapping themes in your research path'
        }
      }
      
      // If no common topics, suggest comparing different aspects
      return {
        content: `Compare findings about ${topics1.slice(0, 2).join(', ')} with ${topics2.slice(0, 2).join(', ')}`,
        rationale: 'Exploring potential connections between different research areas'
      }
    }

    case 'depth':
      return {
        content: `Deepen your research with more specific details and examples`,
        rationale: `Moving from overview (depth ${currentDepth}) to detailed analysis (depth ${depth})`
      }

    case 'refinement':
      return {
        content: 'Synthesize your findings and identify key patterns',
        rationale: 'Your research has reached a depth where consolidating insights would be valuable'
      }

    case 'path': {
      if (!query1) return {
        content: 'Explore related topics',
        rationale: 'Broadening research scope'
      }

      const topics = extractKeyTopics(query1)
      return {
        content: `Investigate specific aspects of ${topics.slice(0, 2).join(' and ')}`,
        rationale: 'Focusing on key topics from your research'
      }
    }

    default:
      return {
        content: 'Explore this research direction',
        rationale: 'Suggested based on your research pattern'
      }
  }
}

// Export the type for use in other files
export type { ResearchSuggestion }

export function ResearchSuggestions({ onSuggestionSelect, userId = 'anonymous', chatId }: ResearchSuggestionsProps) {
  const { state, setSuggestions } = useDeepResearch()
  const { activity, currentDepth, maxDepth, suggestions } = state
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({})
  const [bookmarkedSuggestions, setBookmarkedSuggestions] = useState<Record<string, BookmarkedSuggestion>>({})
  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false)

  // Load cached suggestions on mount
  useEffect(() => {
    const loadCachedSuggestions = async () => {
      if (!chatId || hasAttemptedInitialLoad) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/research/suggestions/cache?userId=${userId}&chatId=${chatId}`)
        if (!response.ok) {
          // If no cache exists, generate new suggestions
          await generateSuggestions(0, true)
          return
        }
        
        const cachedSuggestions = await response.json()
        if (cachedSuggestions && cachedSuggestions.length > 0) {
          setSuggestions(cachedSuggestions)
        } else {
          // If cache is empty, generate new suggestions
          await generateSuggestions(0, true)
        }
      } catch (error) {
        console.error('Failed to load cached suggestions:', error)
        setError('Failed to load suggestions. Please try refreshing.')
      } finally {
        setIsLoading(false)
        setHasAttemptedInitialLoad(true)
      }
    }
    loadCachedSuggestions()
  }, [chatId, userId, setSuggestions, hasAttemptedInitialLoad])

  // Monitor activity changes to trigger suggestion updates
  useEffect(() => {
    if (activity.length > 0 && !isLoading && !isStreaming) {
      generateSuggestions(0, true)
    }
  }, [activity.length])

  // Function to generate suggestions based on current research state
  const generateSuggestions = useCallback(async (retryCount = 0, forceRefresh = false) => {
    // Skip if already loading or streaming
    if (isLoading || isStreaming) return
    
    // Skip if we have suggestions and this is not a forced refresh
    if (suggestions.length > 0 && !forceRefresh) return
    
    setIsLoading(true)
    setIsStreaming(true)
    setError(null)
    
    try {
      const newSuggestions: ResearchSuggestion[] = []
      const now = Date.now()

      // Track unique topics to avoid duplicates
      const suggestedTopics = new Set<string>()

      // Depth-based suggestions
      if (currentDepth < maxDepth) {
        const context = {
          currentQuery: 'depth_exploration',
          previousQueries: [],
          currentDepth,
          maxDepth,
          recentFindings: []
        }

        const aiSuggestion = await fetch('/api/research/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context })
        }).then(res => res.json()) as AISuggestion

        newSuggestions.push({
          type: 'depth',
          content: aiSuggestion.content,
          confidence: aiSuggestion.confidence,
          metadata: {
            depthLevel: currentDepth + 1,
            category: 'depth_exploration',
            relevanceScore: aiSuggestion.confidence,
            timestamp: now,
            relatedTopics: aiSuggestion.relatedTopics
          },
          context: {
            rationale: aiSuggestion.rationale,
            nextSteps: aiSuggestion.nextSteps
          }
        })
      }

      // Analyze recent activity for patterns and relationships
      const recentActivities = activity.slice(-5)
      const searchQueries = recentActivities
        .filter(item => item.type === 'search')
        .map(item => item.message)

      // Generate cross-reference suggestions
      if (searchQueries.length >= 2) {
        const latestQueries = searchQueries.slice(-2)
        
        // Get topic analysis for both queries
        const [topic1Analysis, topic2Analysis] = await Promise.all([
          fetch(`/api/research/suggestions?topic=${encodeURIComponent(latestQueries[0])}`)
            .then(res => res.json()) as Promise<TopicAnalysis>,
          fetch(`/api/research/suggestions?topic=${encodeURIComponent(latestQueries[1])}`)
            .then(res => res.json()) as Promise<TopicAnalysis>
        ])

        const context = {
          currentQuery: latestQueries[1],
          previousQueries: [latestQueries[0]],
          currentDepth,
          maxDepth,
          recentFindings: [
            ...topic1Analysis.mainTopics,
            ...topic2Analysis.mainTopics
          ]
        }

        const aiSuggestion = await fetch('/api/research/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context })
        }).then(res => res.json()) as AISuggestion

        newSuggestions.push({
          type: 'cross_reference',
          content: aiSuggestion.content,
          confidence: aiSuggestion.confidence,
          metadata: {
            depthLevel: currentDepth,
            category: 'cross_reference',
            relevanceScore: aiSuggestion.confidence,
            timestamp: now,
            relatedTopics: aiSuggestion.relatedTopics,
            previousQueries: searchQueries
          },
          context: {
            rationale: aiSuggestion.rationale,
            nextSteps: aiSuggestion.nextSteps
          }
        })
      }

      // Generate refinement suggestions based on depth
      if (currentDepth >= 3) {
        const context = {
          currentQuery: 'synthesis',
          previousQueries: searchQueries,
          currentDepth,
          maxDepth,
          recentFindings: searchQueries
        }

        const aiSuggestion = await fetch('/api/research/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context })
        }).then(res => res.json()) as AISuggestion

        newSuggestions.push({
          type: 'refinement',
          content: aiSuggestion.content,
          confidence: aiSuggestion.confidence,
          metadata: {
            depthLevel: currentDepth,
            category: 'synthesis',
            relevanceScore: aiSuggestion.confidence,
            timestamp: now,
            previousQueries: searchQueries,
            relatedTopics: aiSuggestion.relatedTopics
          },
          context: {
            rationale: aiSuggestion.rationale,
            nextSteps: aiSuggestion.nextSteps
          }
        })
      }

      // Enhanced keyword-based suggestions
      for (const item of recentActivities) {
        if (item.type === 'search') {
          const topicAnalysis = await fetch(`/api/research/suggestions?topic=${encodeURIComponent(item.message)}`)
            .then(res => res.json()) as TopicAnalysis

          const context = {
            currentQuery: item.message,
            previousQueries: [],
            currentDepth,
            maxDepth,
            recentFindings: topicAnalysis.mainTopics
          }

          const aiSuggestion = await fetch('/api/research/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context })
          }).then(res => res.json()) as AISuggestion

          if (!suggestedTopics.has(aiSuggestion.content)) {
            suggestedTopics.add(aiSuggestion.content)
            newSuggestions.push({
              type: 'path',
              content: aiSuggestion.content,
              confidence: aiSuggestion.confidence,
              metadata: {
                depthLevel: currentDepth,
                category: 'keyword_exploration',
                relevanceScore: aiSuggestion.confidence,
                timestamp: now,
                relatedTopics: aiSuggestion.relatedTopics,
                previousQueries: [item.message]
              },
              context: {
                rationale: aiSuggestion.rationale,
                nextSteps: aiSuggestion.nextSteps
              }
            })
          }
        }
      }

      // Sort suggestions by confidence and relevance
      const sortedSuggestions = newSuggestions.sort((a, b) => {
        const scoreA = (a.confidence + a.metadata.relevanceScore) / 2
        const scoreB = (b.confidence + b.metadata.relevanceScore) / 2
        return scoreB - scoreA
      })

      setSuggestions(sortedSuggestions)

      // Cache the new suggestions with chatId
      await fetch('/api/research/suggestions/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          chatId,
          suggestions: sortedSuggestions
        })
      })

    } catch (error) {
      console.error('Error generating AI suggestions:', error)
      
      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const backoffTime = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, backoffTime))
        return generateSuggestions(retryCount + 1)
      }
      
      setError('Failed to generate suggestions. Please try again.')
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [activity, currentDepth, maxDepth, isLoading, isStreaming, suggestions.length, userId, chatId, setSuggestions])

  const handleRetry = useCallback(() => {
    generateSuggestions(0, true)
  }, [generateSuggestions])

  const handleRefresh = useCallback(() => {
    generateSuggestions(0, true)
  }, [generateSuggestions])

  const handleFeedback = (suggestionContent: string, isPositive: boolean) => {
    setFeedbackGiven(prev => ({
      ...prev,
      [suggestionContent]: true
    }))
    // Here you would typically send feedback to your backend
    console.log('Suggestion feedback:', { suggestionContent, isPositive })
  }

  const handleBookmark = async (suggestion: ResearchSuggestion) => {
    try {
      if (bookmarkedSuggestions[suggestion.content]) {
        // Remove bookmark
        const bookmarkId = bookmarkedSuggestions[suggestion.content].id
        const response = await fetch(`/api/bookmarks?userId=${userId}&bookmarkId=${bookmarkId}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) throw new Error('Failed to remove bookmark')
        
        setBookmarkedSuggestions(prev => {
          const next = { ...prev }
          delete next[suggestion.content]
          return next
        })
        toast.success('Suggestion removed from bookmarks')
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            type: 'research_suggestion',
            content: suggestion.content,
            metadata: {
              type: 'research_suggestion',
              data: {
                sourceContext: suggestion.context?.rationale || '',
                tags: suggestion.metadata.relatedTopics || [],
                relatedTopics: suggestion.metadata.relatedTopics || [],
                previousQueries: suggestion.metadata.previousQueries || []
              }
            }
          })
        })
        
        if (!response.ok) throw new Error('Failed to add bookmark')
        
        const bookmark: BookmarkedSuggestion = await response.json()
        setBookmarkedSuggestions(prev => ({
          ...prev,
          [suggestion.content]: bookmark
        }))
        toast.success('Suggestion added to bookmarks')
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      toast.error('Failed to update bookmark')
    }
  }

  if (suggestions.length === 0 && !isLoading && !error) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-medium">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <span>Research Suggestions</span>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating suggestions...</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateSuggestions(0, true)}
            disabled={isLoading || isStreaming}
            className="ml-2"
          >
            {isLoading ? 'Generating...' : 'Generate Suggestions'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isLoading}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {suggestions.length === 0 && !isLoading && !error ? (
        <div className="text-center text-muted-foreground py-4">
          No suggestions available. Click &quot;Generate Suggestions&quot; to start.
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={`${suggestion.type}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="p-3 hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => onSuggestionSelect?.(suggestion.content)}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm">{suggestion.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-accent rounded-full">
                          {suggestion.type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </span>
                        {suggestion.metadata.category && (
                          <span className="text-xs text-muted-foreground">
                            {suggestion.metadata.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6 transition-opacity",
                          !bookmarkedSuggestions[suggestion.content] && "opacity-0 group-hover:opacity-100"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleBookmark(suggestion)
                        }}
                      >
                        <Star 
                          className={cn(
                            "h-4 w-4",
                            bookmarkedSuggestions[suggestion.content]
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-muted-foreground"
                          )}
                        />
                      </Button>

                      {!feedbackGiven[suggestion.content] ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFeedback(suggestion.content, true)
                            }}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFeedback(suggestion.content, false)
                            }}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Thanks for feedback
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Additional Context Section */}
                  {suggestion.context && (
                    <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                      {suggestion.context.rationale && (
                        <p className="mb-1">{suggestion.context.rationale}</p>
                      )}
                      {suggestion.context.nextSteps && suggestion.context.nextSteps.length > 0 && (
                        <div className="mt-1">
                          <p className="font-medium mb-1">Next Steps:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {suggestion.context.nextSteps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Related Topics */}
                  {suggestion.metadata.relatedTopics && suggestion.metadata.relatedTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {suggestion.metadata.relatedTopics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-accent/50 px-2 py-0.5 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSuggestionSelect?.(`Explore ${topic}`)
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
} 