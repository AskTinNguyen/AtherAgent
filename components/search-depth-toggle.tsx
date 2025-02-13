import { useResearch } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
import { Layers } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './ui/popover'

export function SearchDepthToggle() {
  const { state, setDepth } = useResearch()
  const [isOpen, setIsOpen] = useState(false)

  // Handle depth changes
  const handleDepthChange = (newDepth: number) => {
    const validDepth = Math.max(1, Math.min(newDepth, state.depth.max))
    setDepth(validDepth, state.depth.max)
  }

  // Handle increment/decrement
  const handleIncrement = () => {
    if (state.depth.current < state.depth.max) {
      handleDepthChange(state.depth.current + 1)
    }
  }

  const handleDecrement = () => {
    if (state.depth.current > 1) {
      handleDepthChange(state.depth.current - 1)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "relative h-8 w-[80px] justify-start rounded-full bg-background",
            "hover:bg-accent hover:text-accent-foreground",
            state.searchEnabled && "bg-primary/10 text-primary hover:bg-primary/20",
            !state.searchEnabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={!state.searchEnabled}
        >
          <div className="flex items-center gap-1.5 px-2">
            <Layers className="size-4 shrink-0" />
            <div className="flex items-center gap-0.5 text-xs font-medium">
              <span className={cn(
                "text-foreground",
                state.searchEnabled && "text-primary"
              )}>{state.depth.current}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{state.depth.max}</span>
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
                  onClick={handleDecrement}
                  disabled={!state.searchEnabled || state.depth.current <= 1}
                >
                  -
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-primary">{state.depth.current}</span>
                  <span className="text-sm text-muted-foreground">/</span>
                  <span className="w-4 text-center font-medium">{state.depth.max}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="size-8"
                  onClick={handleIncrement}
                  disabled={!state.searchEnabled || state.depth.current >= state.depth.max}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(state.depth.current / state.depth.max) * 100}%` }}
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