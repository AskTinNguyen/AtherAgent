import type { ChartType } from 'chart.js'
import type { ResearchActivity } from './types.research'

// Core Visualization Types
export interface VisualizationNode {
  id: string
  label: string
  type: string
}

export interface VisualizationEdge {
  source: string
  target: string
}

// Highlight and Diff Types
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

// Metrics and Progress Types
export interface EvolutionMetrics {
  depthProgress: number
  qualityImprovement: number
  sourceReliability: number
}

// UI State Types
export interface InteractionState {
  selectedHighlight: string | null
  expandedSections: string[]
  comparisonMode: 'overlay' | 'side-by-side' | 'timeline'
  visualMode: 'compact' | 'detailed' | 'presentation'
}

// Visual Enhancement Types
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

// Combined Visualization Data Types
export interface VisualizationData {
  type: 'path' | 'depth' | 'suggestion' | 'analysis'
  nodes: VisualizationNode[]
  edges: VisualizationEdge[]
  diffHighlights: DiffHighlights
  evolutionMetrics: EvolutionMetrics
  interactionState: InteractionState
  visualEnhancements: VisualEnhancements
  depthLevel?: number
  pathProgress?: number
  relatedActivities?: string[]
  displayTimestamp?: string
  displayDuration?: number
  interactionType?: 'auto' | 'user_triggered'
}

// Component Props Types
export interface ResearchDiffViewProps {
  visualization: VisualizationData
}

// Chart Types
export interface ChatChartData {
  type: ChartType
  title?: string
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    borderWidth?: number
  }>
}

export interface ChatChartMessage {
  type: 'chart'
  role: 'assistant'
  content: string
  data: ChatChartData
}

export interface DatasetToValidate {
  label: string
  data: unknown[]
}

// Research Path Visualization Types
export interface ResearchPathNode {
  id: string
  activity: ResearchActivity
  children: ResearchPathNode[]
  depth: number
  pathType: string
  branchingFactor?: number
}

// View and State Types
export type ViewType = 'grid' | 'ranked' | 'images' | 'diff'

export interface ResearchVisualizationState {
  currentView: ViewType
  selectedNode?: string
  expandedNodes: string[]
  metrics: EvolutionMetrics
  timeline: Array<{
    id: number
    timestamp: number
    type: string
    message: string
    depth: number
    snapshot: string
    significance: number
  }>
  interactionHistory: Array<{
    timestamp: number
    action: string
    nodeId?: string
  }>
} 