export interface SearchModeToggleProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
}

export interface SearchDepthToggleProps {
  enabled: boolean
  currentDepth: number
  maxDepth: number
  onDepthChange: (depth: number) => void
} 