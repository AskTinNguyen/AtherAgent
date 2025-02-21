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

// Constants
const STORAGE_KEY = 'research_depth_config'
const DEFAULT_MAX_DEPTH = 7
const DEFAULT_TARGET_DEPTH = 3

interface SearchDepthToggleProps {
  enabled?: boolean
}

export function SearchDepthToggle({ 
  enabled = true
}: SearchDepthToggleProps) {
  const { state, updateConfiguration } = useResearch()
  const [isOpen, setIsOpen] = useState(false)
  const [targetDepth, setTargetDepth] = useState(state.configuration.targetDepth)
  const maxAllowedDepth = state.configuration.maxAllowedDepth

  // Handle user input changes
  const handleDepthChange = (newDepth: number) => {
    const validDepth = Math.max(1, Math.min(newDepth, maxAllowedDepth))
    setTargetDepth(validDepth)
    
    // Update research configuration
    updateConfiguration({
      targetDepth: validDepth,
      maxAllowedDepth,
      timestamp: Date.now()
    })
  }

  const handleIncrement = () => {
    if (targetDepth < maxAllowedDepth) {
      handleDepthChange(targetDepth + 1)
    }
  }

  const handleDecrement = () => {
    if (targetDepth > 1) {
      handleDepthChange(targetDepth - 1)
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
              )}>{targetDepth}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{maxAllowedDepth}</span>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Configure Research Depth</h4>
            <p className="text-sm text-muted-foreground">
              Set how deep you want your next research to go
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxDepth">Target Depth</Label>
              <div className="col-span-2 flex items-center justify-between gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="size-8"
                  onClick={handleDecrement}
                  disabled={!enabled || targetDepth <= 1}
                >
                  -
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-primary">{targetDepth}</span>
                  <span className="text-sm text-muted-foreground">/</span>
                  <span className="w-4 text-center font-medium">{maxAllowedDepth}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="size-8"
                  onClick={handleIncrement}
                  disabled={!enabled || targetDepth >= maxAllowedDepth}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(targetDepth / maxAllowedDepth) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This setting will apply to your next research iteration
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 