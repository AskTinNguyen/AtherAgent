'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSuggestions } from '@/lib/hooks/use-suggestions'
import { type ResearchSuggestion } from '@/lib/types/research-enhanced'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { AlertCircle, Lightbulb, Loader2, Star } from 'lucide-react'
import { ErrorBoundary } from './error-boundary'

interface ResearchSuggestionsProps {
  onSuggestionSelect?: (content: string) => void
  userId: string
  chatId: string
}

function SuggestionCard({ 
  suggestion, 
  onClick 
}: { 
  suggestion: ResearchSuggestion
  onClick: () => void 
}) {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-colors hover:bg-muted/50",
        "flex flex-col gap-2"
      )}
      onClick={onClick}
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
  )
}

function ResearchSuggestionsContent({ 
  onSuggestionSelect, 
  userId, 
  chatId 
}: ResearchSuggestionsProps) {
  const {
    isLoading,
    error,
    suggestions,
    generateSuggestions,
    handleSuggestionSelect
  } = useSuggestions({ chatId, userId })

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
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onClick={() => handleSuggestionSelect(suggestion, onSuggestionSelect)}
            />
          ))}
        </motion.div>
      )}
      
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={generateSuggestions}
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