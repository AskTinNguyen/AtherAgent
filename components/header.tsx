import ClientHeaderActions from '@/components/client-header-actions'
import { ResearchProvider } from '@/lib/contexts/research-context'
import { cn } from '@/lib/utils'
import HistoryContainer from './history-container'
import { ModeToggle } from './mode-toggle'
import { IconLogo } from './ui/icons'

export function Header() {
  return (
    <ResearchProvider>
      <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
        <div className="flex items-center">
          <a href="/">
            <IconLogo className={cn('w-5 h-5')} />
            <span className="sr-only">AtherAgent</span>
          </a>
        </div>
        <ClientHeaderActions />
        <ModeToggle />
        <HistoryContainer location="header" />
      </header>
    </ResearchProvider>
  )
}

export default Header
