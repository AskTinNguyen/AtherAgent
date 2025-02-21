import ClientHeaderActions from '@/components/client-header-actions'
import { ResearchProvider } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
import HistoryContainer from './history-container'
import { ModeToggle } from './mode-toggle'
import { IconLogo } from './ui/icons'

export function Header() {
  return (
    <ResearchProvider>
      <header className="sticky top-0 z-50 flex items-center w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/100 via-background/80 to-background/50 backdrop-blur-xl">
        {/* Left section - Logo */}
        <div className="flex-none">
          <a href="/" className="flex items-center">
            <IconLogo className={cn('w-5 h-5')} />
            <span className="sr-only">AtherAgent</span>
          </a>
        </div>

        {/* Center section - Actions */}
        <div className="flex-1 flex justify-center">
          <ClientHeaderActions />
        </div>

        {/* Right section - Mode Toggle & History */}
        <div className="flex-none flex items-center gap-2">
          <ModeToggle />
          <HistoryContainer location="header" />
        </div>
      </header>
    </ResearchProvider>
  )
}

export default Header
