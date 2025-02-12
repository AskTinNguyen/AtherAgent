'use client'

import { cn } from '@/lib/utils'
import type { HighlightData } from '@/lib/utils/research-diff'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, ExternalLink } from 'lucide-react'
import * as React from 'react'

interface ResearchFindingsProps {
  findings: HighlightData[]
  type: 'new' | 'refined'
  onHighlightSelect?: (highlight: HighlightData) => void
}

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
}

export function ResearchFindings({ findings, type, onHighlightSelect }: ResearchFindingsProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  const bgColor = type === 'new' ? 'green' : 'blue'
  const title = type === 'new' ? 'New Findings' : 'Refined Understanding'

  return (
    <motion.div variants={cardVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", `bg-${bgColor}-500`)} />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {findings.map((finding, idx) => (
                <motion.div
                  key={idx}
                  className={cn(
                    "p-4 rounded-lg border",
                    type === 'new' 
                      ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800"
                  )}
                  variants={cardVariants}
                  whileHover="hover"
                  onClick={() => onHighlightSelect?.(finding)}
                >
                  <p className="text-gray-800 dark:text-gray-200">{finding.content}</p>
                  {finding.sourceUrl && (
                    <a
                      href={finding.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Source
                    </a>
                  )}
                  {finding.metadata?.tags && finding.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {finding.metadata.tags.map((tag, tagIdx) => (
                        <span
                          key={tagIdx}
                          className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            type === 'new'
                              ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
                              : "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 