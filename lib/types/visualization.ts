export interface VisualizationNode {
  id: string
  label: string
  type: string
}

export interface VisualizationEdge {
  source: string
  target: string
}

export interface HighlightData {
  id: string
  content: string
  source: string
  confidence: number
  type: string
}

export interface DiffHighlights {
  newFindings: HighlightData[]
  refinements: HighlightData[]
  validations: HighlightData[]
}

export interface EvolutionMetrics {
  depthProgress: number
  qualityImprovement: number
  sourceReliability: number
}

export interface InteractionState {
  selectedHighlight: string | null
  expandedSections: string[]
  comparisonMode: 'overlay' | 'side-by-side' | 'timeline'
  visualMode: 'compact' | 'detailed' | 'presentation'
}

export interface VisualEnhancements {
  depthLevels: Array<{
    level: number
    nodes: string[]
    connections: Array<{ from: string; to: string }>
  }>
  insightClusters: Array<{
    id: string
    relatedFindings: string[]
    clusterStrength: number
    visualPosition: { x: number; y: number }
  }>
}

export interface VisualizationData {
  nodes: VisualizationNode[]
  edges: VisualizationEdge[]
  diffHighlights: DiffHighlights
  evolutionMetrics: EvolutionMetrics
  interactionState: InteractionState
  visualEnhancements: VisualEnhancements
}

export interface ResearchDiffViewProps {
  visualization: VisualizationData
} 