import { useSupabase } from '@/components/providers/supabase-provider'
import { useResearch } from '@/lib/contexts/research-context'
import { SuggestionService } from '@/lib/services/suggestions/client'
import { type ResearchActivity, type ResearchSuggestion } from '@/lib/types/research-enhanced'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  content: string | null
  role: 'user' | 'assistant' | 'system' | 'data'
  user_id: string
  created_at: string
  research_session_id: string
  depth_level: number
  metadata: Record<string, unknown>
  is_visible: boolean
  sequence_number?: number
  message_type?: string
  annotations?: Record<string, unknown>
}

interface UseSuggestionsOptions {
  chatId: string
  userId: string
}

interface SuggestionCache {
  suggestions: ResearchSuggestion[]
  timestamp: number
}

interface MessageCache {
  messages: ChatMessage[]
  timestamp: number
}

export function useSuggestions({ chatId, userId: providedUserId }: UseSuggestionsOptions) {
  const { state, addActivity } = useResearch()
  const { activity, messages } = state
  const currentDepth = state.depth?.current ?? 1
  const maxDepth = state.depth?.max ?? 7
  const supabase = useSupabase()
  
  // Get current user from Supabase session
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        const userId = session?.user?.id
        if (userId) {
          setCurrentUserId(userId)
        } else {
          console.error('No user found in session')
          toast.error('Authentication error. Please try logging in again.')
        }
      } catch (error) {
        console.error('Error getting user session:', error)
        toast.error('Failed to verify authentication')
      }
    }

    getCurrentUser()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Use provided userId if available, otherwise use currentUserId from session
  const effectiveUserId = providedUserId || currentUserId

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<ResearchSuggestion[]>([])
  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false)
  const [isActivityUpdate, setIsActivityUpdate] = useState(false)

  const generateTimeoutRef = useRef<NodeJS.Timeout>()
  const lastGeneratedRef = useRef<string>('')
  const lastMessageUpdate = useRef<number>(0)
  const MESSAGE_COOLDOWN = 5000 // 5 seconds

  // Cache key generators with validation
  const getSuggestionsCacheKey = useCallback(() => {
    return chatId && chatId !== 'undefined' ? `suggestions:${chatId}` : null
  }, [chatId])

  const getMessagesCacheKey = useCallback(() => {
    return chatId && chatId !== 'undefined' ? `chat_messages:${chatId}` : null
  }, [chatId])

  // Enhanced message fetching with multi-layer caching
  const fetchMessages = useCallback(async () => {
    // Validate IDs first
    if (!chatId || chatId === 'undefined' || !effectiveUserId) {
      console.warn('Invalid chat ID or user ID:', { chatId, userId: effectiveUserId })
      return null
    }

    // 1. Check context first (fastest)
    if (messages?.length) {
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString()
      }))
      return formattedMessages
    }

    // 2. Try Redis cache
    try {
      const cacheKey = getMessagesCacheKey()
      if (!cacheKey) {
        console.warn('Invalid cache key generated')
        return null
      }

      const cachedData = await fetch(`/api/cache/get?key=${cacheKey}`).then(res => res.json())
      if (cachedData?.messages?.length) {
        return cachedData.messages.map((msg: ChatMessage) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at
        }))
      }
    } catch (error) {
      console.warn('Cache fetch failed:', error)
    }

    // 3. Fallback to Supabase
    try {
      // Validate UUIDs before querying
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(chatId) || !uuidRegex.test(effectiveUserId)) {
        console.error('Invalid UUID format:', { chatId, userId: effectiveUserId })
        return null
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('research_session_id', chatId)
        .eq('user_id', effectiveUserId)
        .eq('is_visible', true)
        .order('sequence_number', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Supabase query error:', error)
        throw error
      }

      if (data?.length) {
        const formattedMessages = data
          .filter(msg => msg.content !== null && 
            (msg.role === 'user' || msg.role === 'assistant'))
          .map(msg => ({
            role: msg.role,
            content: msg.content as string,
            timestamp: msg.created_at,
            metadata: {
              depth_level: msg.depth_level,
              message_type: msg.message_type
            }
          }))

        // Only proceed if we have at least one valid message
        if (formattedMessages.length > 0) {
          // Update cache in background
          const cacheKey = getMessagesCacheKey()
          if (cacheKey) {
            fetch('/api/cache/set', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: cacheKey,
                value: { messages: data, timestamp: Date.now() }
              })
            }).catch(console.error)
          }

          return formattedMessages
        }
      }
    } catch (error) {
      console.error('Error fetching messages from Supabase:', error)
      toast.error('Failed to fetch messages. Please try again.')
    }

    return null
  }, [chatId, effectiveUserId, messages, supabase, getMessagesCacheKey])

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

  // Enhanced suggestion generation with optimistic updates
  const generateSuggestions = useCallback(async (retryCount = 0, forceRefresh = false) => {
    console.log('Generating suggestions:', {
      isLoading,
      suggestionsCount: suggestions.length,
      forceRefresh,
      chatId,
      effectiveUserId,
      currentDepth
    })

    if (isLoading) {
      console.log('Already generating suggestions')
      return
    }

    setIsLoading(true)
    setError(null)
    lastMessageUpdate.current = Date.now()

    try {
      console.log('Fetching messages for suggestion generation')
      // Get messages with new retrieval flow
      const currentMessages = await fetchMessages()
      if (!currentMessages?.length) {
        console.log('No messages available for suggestion generation')
        setSuggestions([])
        return
      }

      console.log(`Found ${currentMessages.length} messages for analysis`)

      // Get recent search queries
      const recentSearchQueries = activity
        ?.filter((item: ResearchActivity) => 
          item.type === 'search' && item.message?.trim()
        )
        ?.slice(-5)
        ?.map((item: ResearchActivity) => item.message.trim())
        ?? []

      console.log(`Using ${recentSearchQueries.length} recent search queries`)

      // Extract main topic from the most recent message
      const latestMessage = currentMessages[currentMessages.length - 1]
      const mainTopic = latestMessage.content.split('\n')[0] || 'Research Topic'

      // Optimistically update UI with loading state
      setSuggestions(prev => prev.map(s => ({
        ...s,
        status: 'refreshing'
      })))

      console.log('Calling SuggestionService.generateSuggestions')
      // Generate new suggestions
      const newSuggestions = await SuggestionService.generateSuggestions({
        messages: currentMessages,
        chatId,
        recentSearchQueries,
        currentDepth,
        maxDepth,
        context: {
          main_topic: mainTopic,
          session_id: chatId,
          id: crypto.randomUUID(),
          related_topics: recentSearchQueries,
          depth_level: currentDepth,
          message_count: currentMessages.length,
          last_message_timestamp: latestMessage.timestamp
        }
      })

      console.log(`Generated ${newSuggestions.length} new suggestions`)

      // Update state
      setSuggestions(newSuggestions)
      
      // Add activities with flag to prevent cycles
      setIsActivityUpdate(true)
      const activities = convertSuggestionsToActivities(newSuggestions)
      activities.forEach(addActivity)
      setIsActivityUpdate(false)

      // Background sync
      const cacheKey = getSuggestionsCacheKey()
      if (cacheKey) {
        console.log('Updating Redis cache with new suggestions')
        fetch('/api/cache/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: cacheKey,
            value: {
              suggestions: newSuggestions,
              timestamp: Date.now()
            }
          })
        }).catch(error => {
          console.error('Failed to update Redis cache:', error)
        })
      }

    } catch (error) {
      console.error('Error generating suggestions:', error)
      
      if (retryCount < 3) {
        console.log(`Retrying suggestion generation (attempt ${retryCount + 1}/3)`)
        const backoffTime = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, backoffTime))
        return generateSuggestions(retryCount + 1)
      }
      
      setError(error instanceof Error ? error.message : 'Failed to generate suggestions')
      toast.error('Failed to generate suggestions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [
    activity,
    chatId,
    currentDepth,
    maxDepth,
    isLoading,
    suggestions,
    addActivity,
    convertSuggestionsToActivities,
    fetchMessages,
    getSuggestionsCacheKey,
    effectiveUserId
  ])

  // Handle suggestion selection with optimistic updates
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

    // Optimistic update
    const now = new Date().toISOString()
    setSuggestions(prevSuggestions => 
      prevSuggestions.map(s => 
        s.id === suggestion.id 
          ? { ...s, used_at: now }
          : s
      )
    )

    // Update Redis cache optimistically
    const cacheKey = getSuggestionsCacheKey()
    const updatedCache: SuggestionCache = {
      suggestions: suggestions.map(s => 
        s.id === suggestion.id 
          ? { ...s, used_at: now }
          : s
      ),
      timestamp: Date.now()
    }
    
    try {
      // Background sync
      await Promise.all([
        // Update Supabase
        supabase
          .from('research_suggestions')
          .update({ used_at: now })
          .eq('id', suggestion.id),
        
        // Update Redis cache
        fetch('/api/cache/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: cacheKey,
            value: updatedCache
          })
        })
      ])
    } catch (error) {
      // Revert optimistic updates on failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error updating suggestion:', {
        suggestionId: suggestion.id,
        error: errorMessage
      })
      
      // Revert UI state
      setSuggestions(prevSuggestions => 
        prevSuggestions.map(s => 
          s.id === suggestion.id 
            ? { ...s, used_at: undefined }
            : s
        )
      )
      
      // Revert Redis cache
      try {
        await fetch('/api/cache/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: cacheKey,
            value: {
              suggestions: suggestions,
              timestamp: Date.now()
            }
          })
        })
      } catch (cacheError) {
        console.error('Error reverting cache:', cacheError)
      }
      
      setError(`Failed to update suggestion: ${errorMessage}`)
      toast.error('Failed to update suggestion')
    }
  }, [suggestions, getSuggestionsCacheKey, supabase])

  // Cache invalidation on message changes
  useEffect(() => {
    const invalidateCache = async () => {
      if (messages?.length) {
        await fetch('/api/cache/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: getMessagesCacheKey(),
            value: { messages, timestamp: Date.now() }
          })
        }).catch(console.error)
      }
    }

    invalidateCache()
  }, [messages, getMessagesCacheKey])

  // Initial load - only fetch stored suggestions
  useEffect(() => {
    if (!chatId || isActivityUpdate) return
    
    if (!hasAttemptedInitialLoad) {
      const loadInitialSuggestions = async () => {
        try {
          // Try cache first
          const response = await fetch(`/api/cache/get?key=${getSuggestionsCacheKey()}`)
          const data = await response.json()
          
          if (data?.suggestions) {
            setSuggestions(data.suggestions)
          } else {
            // Fallback to Supabase
            const storedSuggestions = await SuggestionService.getStoredSuggestions(chatId)
            if (storedSuggestions.length) {
              setSuggestions(storedSuggestions)
              // Update cache
              await fetch('/api/cache/set', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  key: getSuggestionsCacheKey(),
                  value: {
                    suggestions: storedSuggestions,
                    timestamp: Date.now()
                  }
                })
              })
            }
          }
        } catch (error) {
          console.error('Error loading initial suggestions:', error)
        }
        setHasAttemptedInitialLoad(true)
      }

      loadInitialSuggestions()
    }
  }, [chatId, hasAttemptedInitialLoad, getSuggestionsCacheKey, isActivityUpdate])

  return {
    isLoading,
    error,
    suggestions,
    generateSuggestions: () => generateSuggestions(0, true),
    handleSuggestionSelect
  }
} 