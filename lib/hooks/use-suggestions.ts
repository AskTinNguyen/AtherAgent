import { useResearch } from '@/lib/contexts/research-context'
import { SuggestionService } from '@/lib/services/suggestions/client'
import { type ResearchActivity, type ResearchSuggestion } from '@/lib/types/research-enhanced'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseSuggestionsOptions {
  chatId: string
  userId: string
}

export function useSuggestions({ chatId, userId }: UseSuggestionsOptions) {
  const { state, addActivity } = useResearch()
  const { activity, messages } = state
  const currentDepth = state.depth?.current ?? 1
  const maxDepth = state.depth?.max ?? 7

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<ResearchSuggestion[]>([])
  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false)
  const [isActivityUpdate, setIsActivityUpdate] = useState(false)

  const generateTimeoutRef = useRef<NodeJS.Timeout>()
  const lastGeneratedRef = useRef<string>('')
  const lastMessageUpdate = useRef<number>(0)
  const MESSAGE_COOLDOWN = 5000 // 5 seconds

  // Convert suggestions to activities
  const convertSuggestionsToActivities = useCallback((suggestions: ResearchSuggestion[]) => {
    return suggestions.map(suggestion => ({
      type: 'thought' as const,
      status: 'complete' as const,
      message: suggestion.content,
      timestamp: new Date().toISOString(),
      depth: suggestion.metadata.depth_level,
      completedSteps: state.completedSteps + 1,
      totalSteps: state.totalExpectedSteps
    }))
  }, [state.completedSteps, state.totalExpectedSteps])

  // Fetch stored suggestions
  const fetchStoredSuggestions = useCallback(async () => {
    if (!chatId) return
    
    setIsLoading(true)
    setError(null)

    try {
      const storedSuggestions = await SuggestionService.getStoredSuggestions(chatId)
      if (storedSuggestions.length > 0) {
        setSuggestions(storedSuggestions)
        setIsActivityUpdate(true)
        const activities = convertSuggestionsToActivities(storedSuggestions)
        activities.forEach(addActivity)
        setIsActivityUpdate(false)
      }
      return storedSuggestions.length > 0
    } catch (error) {
      console.error('Error fetching stored suggestions:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch stored suggestions')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [chatId, convertSuggestionsToActivities, addActivity])

  // Generate suggestions
  const generateSuggestions = useCallback(async (retryCount = 0, forceRefresh = false) => {
    const now = Date.now()
    if (!forceRefresh && now - lastMessageUpdate.current < MESSAGE_COOLDOWN) {
      console.log('Skipping suggestion generation - cooldown period active')
      return
    }

    if (isLoading) return
    if (suggestions.length > 0 && !forceRefresh) return

    // First try to fetch stored suggestions if not forcing refresh
    if (!forceRefresh) {
      const hasStoredSuggestions = await fetchStoredSuggestions()
      if (hasStoredSuggestions) return
    }

    setIsLoading(true)
    setError(null)
    lastMessageUpdate.current = now

    try {
      // Validate messages
      if (!messages?.length) {
        throw new Error('No messages available for analysis. Please start a conversation first.')
      }

      // Get recent search queries
      const recentSearchQueries = activity
        ?.filter((item: ResearchActivity) => 
          item.type === 'search' && item.message?.trim()
        )
        ?.slice(-5)
        ?.map((item: ResearchActivity) => item.message.trim())
        ?? []

      // Format messages
      const formattedMessages = messages
        .filter(msg => msg && typeof msg === 'object')
        .map(msg => ({
          role: msg.role || 'user',
          content: msg.content?.trim() ?? '',
          timestamp: msg.timestamp ?? new Date().toISOString()
        }))
        .filter(msg => msg.content.length > 0)

      if (!formattedMessages.length) {
        throw new Error('No valid messages found for analysis')
      }

      // Generate new suggestions
      const newSuggestions = await SuggestionService.generateSuggestions({
        messages: formattedMessages,
        chatId,
        recentSearchQueries,
        currentDepth,
        maxDepth
      })

      // Update state
      setSuggestions(newSuggestions)
      
      // Add activities with flag to prevent cycles
      setIsActivityUpdate(true)
      const activities = convertSuggestionsToActivities(newSuggestions)
      activities.forEach(addActivity)
      setIsActivityUpdate(false)

    } catch (error) {
      console.error('Error generating suggestions:', error)
      
      if (retryCount < 3) {
        const backoffTime = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, backoffTime))
        return generateSuggestions(retryCount + 1)
      }
      
      setError(error instanceof Error ? error.message : 'Failed to generate suggestions')
    } finally {
      setIsLoading(false)
    }
  }, [
    activity,
    messages,
    chatId,
    currentDepth,
    maxDepth,
    isLoading,
    suggestions.length,
    addActivity,
    convertSuggestionsToActivities,
    fetchStoredSuggestions
  ])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (
    suggestion: ResearchSuggestion,
    onSelect?: (content: string) => void
  ) => {
    if (!suggestion?.id) {
      console.error('Invalid suggestion:', suggestion)
      setError('Invalid suggestion data')
      return
    }

    if (onSelect) {
      onSelect(suggestion.content)
    }
    
    try {
      const { updated_at } = await SuggestionService.markSuggestionAsUsed(suggestion.id)
      
      // Update local state
      setSuggestions(prevSuggestions => 
        prevSuggestions.map(s => 
          s.id === suggestion.id 
            ? { ...s, used_at: updated_at }
            : s
        )
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error marking suggestion as used:', {
        suggestionId: suggestion.id,
        error: errorMessage
      })
      setError(`Failed to mark suggestion as used: ${errorMessage}`)
    }
  }, [])

  // Debounced generate function
  const debouncedGenerate = useCallback((force = false) => {
    if (generateTimeoutRef.current) {
      clearTimeout(generateTimeoutRef.current)
    }

    generateTimeoutRef.current = setTimeout(() => {
      const contextKey = `${messages?.length}-${activity?.length}-${currentDepth}`
      if (!force && contextKey === lastGeneratedRef.current) {
        return
      }
      
      lastGeneratedRef.current = contextKey
      generateSuggestions(0, force)
    }, 1000)
  }, [generateSuggestions, messages, activity, currentDepth])

  // Cleanup
  useEffect(() => {
    return () => {
      if (generateTimeoutRef.current) {
        clearTimeout(generateTimeoutRef.current)
      }
    }
  }, [])

  // Initial load - only fetch stored suggestions
  useEffect(() => {
    if (!chatId) return
    
    if (isActivityUpdate) return
    
    if (!hasAttemptedInitialLoad) {
      fetchStoredSuggestions()
      setHasAttemptedInitialLoad(true)
    }
  }, [chatId, hasAttemptedInitialLoad, fetchStoredSuggestions, isActivityUpdate])

  return {
    isLoading,
    error,
    suggestions,
    generateSuggestions: () => generateSuggestions(0, true),
    handleSuggestionSelect
  }
} 