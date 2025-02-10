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
  enabled?: boolean
}

export function SearchDepthToggle({
  enabled = false
}: SearchDepthToggleProps) {
  const { state, setDepth } = useDeepResearch()
  const { currentDepth, maxDepth } = state
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
          size="icon"
          className={cn(
            "shrink-0 rounded-full group relative",
            enabled && "bg-primary/10"
          )}
          disabled={!enabled}
        >
          <Layers className="size-4 group-hover:text-primary transition-colors" />
          <div className="absolute -top-1 -right-1 flex items-center gap-1">
            <span className="size-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {currentDepth}
            </span>
            <span className="text-[10px] text-muted-foreground">/{localMaxDepth}</span>
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
                  onClick={() => handleMaxDepthChange(localMaxDepth - 1)}
                  disabled={localMaxDepth <= currentDepth}
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
                  onClick={() => handleMaxDepthChange(localMaxDepth + 1)}
                  disabled={localMaxDepth >= 10}
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