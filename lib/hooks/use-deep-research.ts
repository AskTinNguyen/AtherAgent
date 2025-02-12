import { useCallback, useEffect, useState } from 'react'

interface DeepResearchProgress {
  shouldContinueResearch: boolean
  nextDepth: number
  maxDepth: number
}

export function useDeepResearchProgress(
  currentDepth: number,
  maxAllowedDepth: number,
  chatId: string
): DeepResearchProgress {
  const [shouldContinue, setShouldContinue] = useState(false)
  const [nextDepth, setNextDepth] = useState(currentDepth)

  useEffect(() => {
    // Reset state when chat changes
    if (chatId) {
      setShouldContinue(false)
      setNextDepth(currentDepth)
    }
  }, [chatId, currentDepth])

  const checkProgress = useCallback(() => {
    if (currentDepth < maxAllowedDepth) {
      setShouldContinue(true)
      setNextDepth(currentDepth + 1)
    } else {
      setShouldContinue(false)
      setNextDepth(currentDepth)
    }
  }, [currentDepth, maxAllowedDepth])

  useEffect(() => {
    checkProgress()
  }, [checkProgress])

  return {
    shouldContinueResearch: shouldContinue,
    nextDepth,
    maxDepth: maxAllowedDepth
  }
} 