import { cn } from '@/lib/utils'
import { Layers } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDeepResearch } from './deep-research-provider'
import { Button } from './ui/button'
import { Label } from './ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './ui/popover'

interface SearchDepthToggleProps {
  enabled: boolean
  currentDepth: number
  maxDepth: number
  onDepthChange: (depth: number) => void
}

export function SearchDepthToggle({
  enabled,
  currentDepth,
  maxDepth,
  onDepthChange
}: SearchDepthToggleProps) {
  const { state, setDepth } = useDeepResearch()
  const { currentDepth: researchCurrentDepth, maxDepth: researchMaxDepth } = state
  const [isOpen, setIsOpen] = useState(false)
  const [localMaxDepth, setLocalMaxDepth] = useState(maxDepth)

  // Update local state when props change
  useEffect(() => {
    setLocalMaxDepth(maxDepth)
  }, [maxDepth])

  const handleMaxDepthChange = (value: number) => {
    const newMaxDepth = Math.max(Math.max(1, value), currentDepth)
    setLocalMaxDepth(newMaxDepth)
    setDepth(currentDepth, newMaxDepth)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "relative h-8 w-[80px] justify-start rounded-full bg-background",
            "hover:bg-accent hover:text-accent-foreground",
            enabled && "bg-primary/10 text-primary hover:bg-primary/20",
            !enabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={!enabled}
        >
          <div className="flex items-center gap-1.5 px-2">
            <Layers className="size-4 shrink-0" />
            <div className="flex items-center gap-0.5 text-xs font-medium">
              <span className={cn(
                "text-foreground",
                enabled && "text-primary"
              )}>{currentDepth}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{localMaxDepth}</span>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Search Depth</h4>
            <p className="text-sm text-muted-foreground">
              Configure the maximum depth for search results. The research will automatically progress through depths based on result quality.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxDepth">Max Depth</Label>
              <div className="col-span-2 flex items-center justify-between gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="size-8"
                  onClick={() => onDepthChange(Math.max(1, currentDepth - 1))}
                  disabled={currentDepth <= 1}
                >
                  -
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-primary">{currentDepth}</span>
                  <span className="text-sm text-muted-foreground">/</span>
                  <span className="w-4 text-center font-medium">{localMaxDepth}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="size-8"
                  onClick={() => onDepthChange(Math.min(maxDepth, currentDepth + 1))}
                  disabled={currentDepth >= maxDepth}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(currentDepth / localMaxDepth) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Research will progress through depths automatically based on result quality and relevance.
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 