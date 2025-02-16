import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { Button } from '../ui/button'

interface PanelControlsProps {
  isActive: boolean
  isCollapsed: boolean
  onToggle: () => void
}

export function PanelControls({
  isActive,
  isCollapsed,
  onToggle
}: PanelControlsProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={cn(
        "fixed left-2 top-[calc(50vh-2rem)] rounded-full text-foreground/30 z-50",
        "hidden lg:block", // Only visible on desktop
        "hover:text-foreground/70 hover:bg-background/80",
        "glow-effect",
        "transition-all duration-300",
        isCollapsed && "rotate-180"
      )}
      aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
    >
      <ChevronLeft 
       size={32} 
       className={cn(
       )}
      />
    </Button>
  )
} 


// <Button
// variant="ghost"
// size="icon"
// onClick={toggleCollapse}
// className={cn(
//   "fixed left-2 top-[calc(50vh-2rem)] rounded-full text-foreground/30 z-50",
// )}
// >
// <ChevronLeft 
//   size={32} 
//   className={cn(
//     state.isActive && "text-primary"
//   )}
// />
// </Button>