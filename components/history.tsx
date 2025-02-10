'use client'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ChevronLeft, History as HistoryIcon, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Suspense, useTransition } from 'react'
import { HistorySkeleton } from './history-skeleton'

type HistoryProps = {
  location: 'sidebar' | 'header'
  children?: React.ReactNode
}

export function History({ location, children }: HistoryProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const onOpenChange = (open: boolean) => {
    if (open) {
      startTransition(() => {
        router.refresh()
      })
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange}>
      <style jsx global>{`
        @keyframes glow {
          0%, 100% { 
            opacity: 0.3;
            filter: brightness(1);
          }
          50% { 
            opacity: 1;
            filter: brightness(1.5) drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
          }
        }
        .glow-effect {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn({
            'rounded-full text-foreground/30': location === 'sidebar'
          })}
        >
          {location === 'header' ? (
            <Menu />
          ) : (
            <ChevronLeft 
              size={32} 
              className="glow-effect"
            />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-64 rounded-tl-xl rounded-bl-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-1 text-sm font-normal mb-2">
            <HistoryIcon size={14} />
            History
          </SheetTitle>
        </SheetHeader>
        <div className="my-2 h-full pb-12 md:pb-10">
          <Suspense fallback={<HistorySkeleton />}>{children}</Suspense>
        </div>
      </SheetContent>
    </Sheet>
  )
}
