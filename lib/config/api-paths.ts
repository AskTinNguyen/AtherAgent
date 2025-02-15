/**
 * Centralized configuration for API endpoints
 */
const API_VERSION = 'v1'
const BASE_PATH = `/api/${API_VERSION}`

export const API_PATHS = {
  // Chat endpoints
  chat: {
    base: `${BASE_PATH}/chat`,
    byId: (id: string) => `${BASE_PATH}/chat/${id}`,
    validate: (id: string) => `${BASE_PATH}/chat/${id}/validate`,
    stream: (id: string) => `${BASE_PATH}/chat/${id}/stream`
  },

  // Folder endpoints
  folder: {
    base: `${BASE_PATH}/folder`,
    byId: (id: string) => `${BASE_PATH}/folder/${id}`,
    addChat: (id: string) => `${BASE_PATH}/folder/${id}/chat`,
    tree: `${BASE_PATH}/folder/tree`
  },

  // Bookmark endpoints
  bookmark: {
    base: `${BASE_PATH}/bookmark`,
    byId: (id: string) => `${BASE_PATH}/bookmark/${id}`,
    check: (url: string) => `${BASE_PATH}/bookmark/check?url=${encodeURIComponent(url)}`,
    tags: `${BASE_PATH}/bookmark/tags`
  },

  // Research endpoints
  research: {
    base: `${BASE_PATH}/research`,
    byChat: (chatId: string) => `${BASE_PATH}/research/${chatId}`,
    suggestions: (chatId: string) => `${BASE_PATH}/research/${chatId}/suggestions`,
    state: (chatId: string) => `${BASE_PATH}/research/${chatId}/state`,
    depth: (chatId: string) => `${BASE_PATH}/research/${chatId}/depth`
  },

  // Search endpoints
  search: {
    base: `${BASE_PATH}/search`,
    advanced: `${BASE_PATH}/search/advanced`,
    suggest: `${BASE_PATH}/search/suggest`
  },

  // Upload endpoints
  upload: {
    base: `${BASE_PATH}/upload`,
    file: `${BASE_PATH}/upload/file`,
    image: `${BASE_PATH}/upload/image`
  },

  // Usage endpoints
  usage: {
    base: `${BASE_PATH}/usage`,
    stats: `${BASE_PATH}/usage/stats`,
    limits: `${BASE_PATH}/usage/limits`
  }
} as const

// Type for API paths to ensure type safety when using paths
export type ApiPaths = typeof API_PATHS

// Helper function to get a typed API path
export function getApiPath<T extends keyof ApiPaths>(
  pathKey: T
): typeof API_PATHS[T] {
  return API_PATHS[pathKey]
}

// Helper function to ensure URL parameters are properly encoded
export function createApiUrl(path: string, params?: Record<string, string>): string {
  if (!params) return path
  
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value)
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
}
