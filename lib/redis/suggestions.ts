// DEPRECATED: This file is no longer in use. Suggestions are now handled through Supabase.
// See lib/hooks/use-suggestions.ts for the current implementation.

import { type ResearchSuggestion } from '@/lib/types/research-enhanced'

// Keeping types for reference during migration
const REDIS_KEYS = {
  chatSuggestions: (chatId: string, userId: string) => `chat:${chatId}:user:${userId}:suggestions`,
  suggestionTTL: 60 * 60 * 24 // 24 hours
}

// For historical reference only - implementation moved to Supabase
export type { ResearchSuggestion }
