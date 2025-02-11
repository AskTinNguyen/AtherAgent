'use client'

import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useResearchContext } from '@/lib/contexts/research-activity-context'
import { createMockImages, createMockResults, createMockSearchProps, createMockVisualization } from '@/lib/mocks/research-command-center'
import { type SearchSource } from '@/lib/types'
import { type ResearchCommandCenterProps, type ViewType } from '@/lib/types/research-command-center'
import { type Message } from 'ai'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftRight, ChartBar, Image, Layers, LayoutGrid, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { RankedSearchResults } from '../ranked-search-results'
import { SearchResultsImageSection } from '../search-results-image'
import { SearchSection } from '../search-section'
import { SearchResultsGrid } from '../search/search-results-grid'
import { ResearchDiffView } from './research-diff-view'
import { ResearchHeader } from './research-header'

interface ExtendedMessage extends Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: Record<string, any>
  searchSources?: SearchSource[]
}

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  },
  element: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  },
  hover: {
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
}

export function ResearchCommandCenter({ className }: ResearchCommandCenterProps) {
  const { state, metrics, activity } = useResearchContext()
  const [view, setView] = useState<ViewType>('grid')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [messages, setMessages] = useState<ExtendedMessage[]>([])

  const searchProps = createMockSearchProps(isSearchOpen, setIsSearchOpen, messages, setMessages)
  const searchResults = createMockResults(activity)
  const imageResults = createMockImages(activity)
  const mockVisualization = createMockVisualization(activity, state, metrics)
  
  const visualizationData = {
    ...mockVisualization,
    diffHighlights: {
      newFindings: activity.map((item, index) => ({
        id: `new-${index}`,
        content: item.message,
        source: 'research',
        confidence: 0.8,
        type: 'new' as const,
        visualState: {
          isHighlighted: false,
          isExpanded: false,
          relationStrength: 1
        },
        metadata: {
          category: 'research',
          tags: ['insight'],
          importance: 0.8,
          lastModified: Date.now(),
          relatedHighlights: []
        }
      })),
      refinements: activity.map((item, index) => ({
        id: `refined-${index}`,
        content: item.message,
        source: 'research',
        confidence: 0.7,
        type: 'refined' as const,
        visualState: {
          isHighlighted: false,
          isExpanded: false,
          relationStrength: 0.7
        },
        metadata: {
          category: 'research',
          tags: ['refinement'],
          importance: 0.7,
          lastModified: Date.now(),
          relatedHighlights: []
        }
      })),
      validations: activity.map((item, index) => ({
        id: `validated-${index}`,
        content: item.message,
        source: 'research',
        confidence: 0.9,
        type: 'validated' as const,
        visualState: {
          isHighlighted: false,
          isExpanded: false,
          relationStrength: 0.9
        },
        metadata: {
          category: 'research',
          tags: ['validation'],
          importance: 0.9,
          lastModified: Date.now(),
          relatedHighlights: []
        }
      }))
    }
  }

  const metricsData = {
    depthProgress: Math.min(Math.max((state.currentDepth / state.maxDepth), 0), 1),
    qualityImprovement: metrics.qualityScore / 100,
    sourceReliability: metrics.relevanceScore / 100
  }

  const timelineData = activity.map((item, index) => ({
    id: index,
    timestamp: new Date(item.timestamp).getTime(),
    type: item.type,
    message: item.message,
    depth: item.depth || 0,
    snapshot: `Snapshot ${index}`,
    significance: 1.0 - (index * 0.1)
  }))

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Background with Gradient Overlay */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 backdrop-blur-sm" />
        </div>

        {/* Header Section */}
        <motion.div
          variants={ANIMATION_VARIANTS.element}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className="glass-morphism p-6 rounded-xl border border-white/10 shadow-lg shadow-cyan-500/20 backdrop-blur-md bg-white/5"
        >
          <ResearchHeader />
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            variants={ANIMATION_VARIANTS.element}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className="glass-morphism p-6 rounded-xl border border-white/10 shadow-lg shadow-purple-500/20 backdrop-blur-md bg-white/5"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/20">
                  <Search className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium">Depth Progress</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Current Level</span>
                  <span className="font-medium">{state.currentDepth} / {state.maxDepth}</span>
                </div>
                <Progress 
                  value={metricsData.depthProgress} 
                  className="h-2.5 bg-white/10"
                />
                <div className="flex justify-between items-center text-xs text-white/40">
                  <span>Initial</span>
                  <span>Advanced</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={ANIMATION_VARIANTS.element}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className="glass-morphism p-6 rounded-xl border border-white/10 shadow-lg shadow-emerald-500/20 backdrop-blur-md bg-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Quality Score</h3>
                <div className="mt-2 space-y-2">
                  <Progress value={metricsData.qualityImprovement} className="h-2 bg-white/10" />
                  <p className="text-sm text-white/60">{metrics.qualityScore}% Quality Rating</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={ANIMATION_VARIANTS.element}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className="glass-morphism p-6 rounded-xl border border-white/10 shadow-lg shadow-blue-500/20 backdrop-blur-md bg-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Layers className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Source Analysis</h3>
                <div className="mt-2 space-y-2">
                  <Progress value={metricsData.sourceReliability} className="h-2 bg-white/10" />
                  <p className="text-sm text-white/60">{metrics.sourcesAnalyzed} Sources Analyzed</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search Section */}
        <motion.div
          variants={ANIMATION_VARIANTS.element}
          initial="hidden"
          animate="visible"
          className="glass-morphism p-6 rounded-xl border border-white/10 shadow-lg shadow-purple-500/20 backdrop-blur-md bg-white/5"
        >
          <SearchSection {...searchProps} />
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Right Column - Main Content */}
            <div className="glass-morphism p-6 rounded-xl border border-white/10 shadow-lg shadow-emerald-500/20 backdrop-blur-md bg-white/5 col-span-4">
              <Tabs value={view} onValueChange={(v: string) => setView(v as ViewType)} className="w-full">
                <TabsList className="grid grid-cols-4 bg-white/5 mb-4">
                  <TabsTrigger value="grid" className="data-[state=active]:bg-cyan-500/20">
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Grid View
                  </TabsTrigger>
                  <TabsTrigger value="ranked" className="data-[state=active]:bg-cyan-500/20">
                    <ChartBar className="w-4 h-4 mr-2" />
                    Ranked View
                  </TabsTrigger>
                  <TabsTrigger value="images" className="data-[state=active]:bg-cyan-500/20">
                    <Image className="w-4 h-4 mr-2" />
                    Image View
                  </TabsTrigger>
                  <TabsTrigger value="diff" className="data-[state=active]:bg-cyan-500/20">
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Diff View
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TabsContent value="grid" className="mt-0">
                      <SearchResultsGrid {...searchResults} />
                    </TabsContent>

                    <TabsContent value="ranked" className="mt-0">
                      <RankedSearchResults {...searchResults} />
                    </TabsContent>

                    <TabsContent value="images" className="mt-0">
                      <SearchResultsImageSection {...imageResults} />
                    </TabsContent>

                    <TabsContent value="diff" className="mt-0">
                      <ResearchDiffView visualization={visualizationData} />
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
  )
} 