'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { useResearch } from '@/lib/contexts/research-context'
import { analyzeMessageContext } from '@/lib/services/context-analyzer'
import { generateResearchSuggestions } from '@/lib/services/suggestion-generator'
import { type ResearchActivity, type ResearchState, type ResearchSuggestion } from '@/lib/types/research-enhanced'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { AlertCircle, Lightbulb, Loader2, Star } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from './error-boundary'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface ResearchSuggestionsProps {
  onSuggestionSelect?: (content: string) => void
  userId: string
  chatId: string
}

function ResearchSuggestionsContent({ 
  onSuggestionSelect, 
  userId = 'anonymous', 
  chatId
}: ResearchSuggestionsProps) {
  const { state, addActivity } = useResearch()
  const { activity, messages } = state as ResearchState
  const currentDepth = state.depth?.current ?? 1
  const maxDepth = state.depth?.max ?? 7
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<ResearchSuggestion[]>([])
  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false)

  // Add debounce ref
  const generateTimeoutRef = useRef<NodeJS.Timeout>()
  const lastGeneratedRef = useRef<string>('')

  // Debug logging for research state
  useEffect(() => {
    console.log('Research state:', {
      messagesCount: messages?.length,
      activityCount: activity?.length,
      currentDepth,
      maxDepth,
      chatId
    })
  }, [messages, activity, currentDepth, maxDepth, chatId])

  // Convert suggestions to activities
  const convertSuggestionsToActivities = (suggestions: ResearchSuggestion[]) => {
    return suggestions.map(suggestion => ({
      type: 'thought' as const,
      status: 'complete' as const,
      message: suggestion.content,
      timestamp: new Date().toISOString(),
      depth: suggestion.metadata.depth_level,
      completedSteps: state.completedSteps + 1,
      totalSteps: state.totalExpectedSteps
    }))
  }

  // Generate suggestions based on current context
  const generateSuggestions = useCallback(async (retryCount = 0, forceRefresh = false) => {
    if (isLoading) return
    if (suggestions.length > 0 && !forceRefresh) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Debug log the current state
      console.log('Generating suggestions with:', {
        messagesAvailable: !!messages?.length,
        messageCount: messages?.length,
        activityCount: activity?.length,
        chatId,
        currentDepth,
        maxDepth
      })

      // Validate messages
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        console.warn('No messages available for analysis:', { messages })
        setError('No messages available for analysis. Please start a conversation first.')
        setIsLoading(false)
        return
      }

      // Get recent search queries from activity
      const recentSearchQueries = activity
        ?.filter((item: ResearchActivity) => 
          item.type === 'search' && item.message && item.message.trim().length > 0
        )
        ?.slice(-5)
        ?.map((item: ResearchActivity) => item.message.trim())
        ?? []

      // Format messages properly
      const formattedMessages = messages
        .filter(msg => msg && typeof msg === 'object')
        .map(msg => ({
          role: msg.role || 'user',
          content: msg.content?.trim() ?? '',
          timestamp: msg.timestamp ?? new Date().toISOString()
        }))
        .filter(msg => msg.content.length > 0)

      if (formattedMessages.length === 0) {
        console.warn('No valid messages found after formatting:', { originalMessages: messages })
        setError('No valid messages found for analysis. Please start a conversation first.')
        setIsLoading(false)
        return
      }

      // Debug log the formatted data
      console.log('Sending to analyze:', {
        formattedMessagesCount: formattedMessages.length,
        recentSearchQueriesCount: recentSearchQueries.length
      })

      // Analyze current context
      const context = await analyzeMessageContext({
        messages: formattedMessages,
        sessionId: chatId,
        recentSearchQueries
      })
      
      // Generate suggestions based on context
      const newSuggestions = await generateResearchSuggestions({
        context,
        currentDepth,
        maxDepth
      })

      if (!Array.isArray(newSuggestions)) {
        throw new Error('Invalid suggestions response')
      }

      // Update suggestions state
      setSuggestions(newSuggestions)
      
      // Convert to activities and add them
      const activities = convertSuggestionsToActivities(newSuggestions)
      activities.forEach(activity => addActivity(activity))
      
    } catch (error) {
      console.error('Error generating suggestions:', error)
      
      if (retryCount < 3) {
        const backoffTime = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, backoffTime))
        return generateSuggestions(retryCount + 1)
      }
      
      setError(error instanceof Error ? error.message : 'Failed to generate suggestions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [activity, messages, chatId, currentDepth, maxDepth, isLoading, suggestions.length, addActivity, state.completedSteps, state.totalExpectedSteps])

  // Debounced generate function
  const debouncedGenerate = useCallback((force = false) => {
    // Clear any existing timeout
    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current)
    }

    // Set new timeout
    generateTimeoutRef.current = setTimeout(() => {
      const contextKey = `${messages?.length}-${activity?.length}-${currentDepth}`
      if (!force && contextKey === lastGeneratedRef.current) {
        console.log('Skipping generation - context unchanged:', contextKey)
        return
      }
      
      lastGeneratedRef.current = contextKey
      generateSuggestions(0, force)
    }, 1000) // 1 second debounce
  }, [generateSuggestions, messages, activity, currentDepth])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (generateTimeoutRef.current) {
        clearTimeout(generateTimeoutRef.current)
      }
    }
  }, [])

  // Combine both effects into one
  useEffect(() => {
    if (!chatId) return
    
    // Only generate on initial load or when activity changes significantly
    if (!hasAttemptedInitialLoad || (activity.length > 0 && suggestions.length === 0)) {
      debouncedGenerate(!hasAttemptedInitialLoad)
      setHasAttemptedInitialLoad(true)
    }
  }, [chatId, hasAttemptedInitialLoad, activity.length, suggestions.length, debouncedGenerate])

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: ResearchSuggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion.content)
    }
    
    // Mark suggestion as used
    fetch(`/api/research/suggestions/${suggestion.id}/use`, {
      method: 'POST'
    }).catch(console.error)
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 md:grid-cols-2"
        >
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.id}
              className={cn(
                "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                "flex flex-col gap-2"
              )}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium capitalize">
                    {suggestion.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
              </div>
              
              <p className="text-sm">{suggestion.content}</p>
              
              {suggestion.metadata.related_topics && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {suggestion.metadata.related_topics.map((topic: string) => (
                    <span
                      key={topic}
                      className="px-2 py-1 text-xs bg-muted rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </motion.div>
      )}
      
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateSuggestions(0, true)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="h-4 w-4" />
          )}
          <span className="ml-2">
            {isLoading ? 'Generating...' : 'Generate New Suggestions'}
          </span>
        </Button>
      </div>
    </div>
  )
}

// Wrap with error boundary
export function ResearchSuggestions(props: ResearchSuggestionsProps) {
  return (
    <ErrorBoundary>
      <ResearchSuggestionsContent {...props} />
    </ErrorBoundary>
  )
} 