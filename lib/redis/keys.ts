export const REDIS_KEYS = {
  searchResults: (chatId: string, query: string) => 
    `search:${chatId}:results:${encodeURIComponent(query)}`,
  searchResultsTTL: 60 * 60 * 24 // 24 hours
} as const 