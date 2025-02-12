import { generateId } from 'ai'
import { type ExtendedMessage } from '../types/messages'
import { type ImageResults, type SearchProps, type SearchResults } from '../types/research-command-center'
import { type HighlightData, type ResearchDiffViewProps } from '../types/visualization'

export function createMockSearchProps(
  isSearchOpen: boolean,
  setIsSearchOpen: (isOpen: boolean) => void,
  messages: ExtendedMessage[],
  setMessages: (messages: ExtendedMessage[]) => void
): SearchProps {
  return {
    tool: {
      id: 'search',
      name: 'Research Search',
      description: 'Search through research data',
      state: 'idle'
    },
    isOpen: isSearchOpen,
    onOpenChange: setIsSearchOpen,
    messages,
    setMessages,
    chatId: generateId(),
    onSubmit: async () => {},
    onClear: () => {}
  }
}

export function createMockResults(activity: any[]): SearchResults {
  return {
    results: activity.map((item, index) => ({
      id: String(index),
      title: item.message,
      url: '#',
      snippet: item.message,
      score: 1.0 - (index * 0.1),
      content: item.message
    }))
  }
}

export function createMockImages(activity: any[]): ImageResults {
  return {
    images: activity.map((item, index) => ({
      id: String(index),
      url: '/placeholder-image.jpg',
      title: item.message,
      description: item.message
    }))
  }
}

export function createMockVisualization(activity: any[], state: any, metrics: any): ResearchDiffViewProps {
  const createHighlight = (id: string, content: string, type: string): HighlightData => ({
    id,
    content,
    source: 'research',
    confidence: 0.8,
    type
  })

  return {
    visualization: {
      nodes: activity.map((item, index) => ({
        id: String(index),
        label: item.message,
        type: item.type
      })),
      edges: activity.slice(1).map((_, index) => ({
        source: String(index),
        target: String(index + 1)
      })),
      diffHighlights: {
        newFindings: activity.map((item, index) => 
          createHighlight(`new-${index}`, item.message, 'new')
        ),
        refinements: activity.slice(0, 2).map((item, index) =>
          createHighlight(`refined-${index}`, item.message, 'refined')
        ),
        validations: activity.slice(0, 1).map((item, index) =>
          createHighlight(`validated-${index}`, item.message, 'validated')
        )
      },
      evolutionMetrics: {
        depthProgress: Math.min(Math.max((state.currentDepth / state.maxDepth * 100), 0), 100),
        qualityImprovement: metrics.qualityScore,
        sourceReliability: metrics.relevanceScore
      },
      interactionState: {
        selectedHighlight: null,
        expandedSections: [],
        comparisonMode: 'side-by-side',
        visualMode: 'detailed'
      },
      visualEnhancements: {
        depthLevels: activity.map((_, index) => ({
          level: index + 1,
          nodes: [`node-${index}`],
          connections: index > 0 ? [{ from: `node-${index-1}`, to: `node-${index}` }] : []
        })),
        insightClusters: activity.map((item, index) => ({
          id: `cluster-${index}`,
          relatedFindings: [`finding-${index}`],
          clusterStrength: 0.8,
          visualPosition: { x: index * 100, y: index * 100 }
        }))
      }
    }
  }
} 