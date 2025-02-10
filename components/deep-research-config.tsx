'use client'

import { cn } from '@/lib/utils'
import { Settings2 } from 'lucide-react'
import * as React from 'react'
import { useDeepResearch } from './deep-research-provider'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import { Slider } from './ui/slider'

interface DeepResearchConfigProps {
  className?: string
}

export function DeepResearchConfig({ className }: DeepResearchConfigProps) {
  const { state, setDepth } = useDeepResearch()
  const [isOpen, setIsOpen] = React.useState(false)
  const [localMaxDepth, setLocalMaxDepth] = React.useState(state.maxDepth)

  // Update local state when context state changes
  React.useEffect(() => {
    setLocalMaxDepth(state.maxDepth)
  }, [state.maxDepth])

  const handleDepthChange = React.useCallback((value: number[]) => {
    const newDepth = value[0]
    setLocalMaxDepth(newDepth)
    setDepth(state.currentDepth, newDepth)
  }, [setDepth, state.currentDepth])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3',
            className
          )}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Depth: {state.maxDepth}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Research Depth</h4>
            <p className="text-sm text-muted-foreground">
              Configure how deep the research should go. Higher values mean more thorough but longer research.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <label htmlFor="maxDepth" className="text-sm font-medium leading-none col-span-3">
                Maximum Depth: {localMaxDepth}
              </label>
              <div className="col-span-3">
                <Slider
                  id="maxDepth"
                  max={10}
                  min={1}
                  step={1}
                  value={[localMaxDepth]}
                  onValueChange={handleDepthChange}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current depth: {state.currentDepth} / {state.maxDepth}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 