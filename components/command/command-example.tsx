'use client'

import { cn } from '@/lib/utils'
import {
    Action,
    KBarAnimator,
    KBarPortal,
    KBarPositioner,
    KBarSearch,
    useRegisterActions
} from 'kbar'
import {
    Download,
    FileSearch,
    Home,
    PanelLeftClose,
    Settings,
    Sun,
    Trash2
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RenderResults } from './render-results'

export function CommandExample() {
  const { setTheme } = useTheme()
  const router = useRouter()

  const actions: Action[] = [
    // System Commands
    {
      id: 'theme',
      name: 'Toggle Theme',
      shortcut: ['meta', 't'],
      keywords: 'dark light theme toggle mode switch appearance',
      perform: () => setTheme('dark'),
      icon: <Sun className="w-4 h-4" />,
      section: 'System',
    },

    // Navigation Commands
    {
      id: 'home',
      name: 'Go Home',
      shortcut: ['meta', 'h'],
      keywords: 'home navigate main dashboard start beginning',
      perform: () => router.push('/'),
      icon: <Home className="w-4 h-4" />,
      section: 'Navigation',
    },

    // Research Commands
    {
      id: 'new-research',
      name: 'New Research',
      shortcut: ['meta', 'n'],
      keywords: 'research new create start begin analysis',
      perform: () => router.push('/research/new'),
      icon: <FileSearch className="w-4 h-4" />,
      section: 'Research',
    },
    {
      id: 'toggle-research-panel',
      name: 'Toggle Research Panel',
      shortcut: ['meta', 'shift', 'r'],
      keywords: 'research panel toggle visualization show hide sidebar',
      perform: () => {
        document.dispatchEvent(new CustomEvent('toggle-research-panel'))
        toast.success('Research panel toggled')
      },
      icon: <PanelLeftClose className="w-4 h-4" />,
      section: 'Research',
    },

    // Chat Commands
    {
      id: 'clear-chat',
      name: 'Clear Chat',
      shortcut: ['meta', 'shift', 'c'],
      keywords: 'chat clear reset delete remove clean empty',
      perform: () => {
        document.dispatchEvent(new CustomEvent('clear-chat'))
        toast.success('Chat cleared')
      },
      icon: <Trash2 className="w-4 h-4" />,
      section: 'Chat',
    },
    {
      id: 'export-chat',
      name: 'Export Chat',
      shortcut: ['meta', 'shift', 'e'],
      keywords: 'chat export save download backup json',
      perform: () => {
        document.dispatchEvent(new CustomEvent('export-chat'))
        toast.success('Chat exported')
      },
      icon: <Download className="w-4 h-4" />,
      section: 'Chat',
    },
    {
      id: 'toggle-chat-mode',
      name: 'Toggle Chat Mode',
      shortcut: ['meta', 'shift', 'm'],
      keywords: 'chat mode toggle switch change settings',
      perform: () => {
        document.dispatchEvent(new CustomEvent('toggle-chat-mode'))
        toast.success('Chat mode toggled')
      },
      icon: <Settings className="w-4 h-4" />,
      section: 'Chat',
    },
  ]

  // Register actions with kbar
  useRegisterActions(actions)

  return (
    <KBarPortal>
      <KBarPositioner className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <KBarAnimator 
          className={cn(
            'w-full max-w-[600px]',
            'overflow-hidden rounded-lg',
            'border bg-popover shadow-md',
            'animate-in fade-in-0',
            'slide-in-from-top-20'
          )}
        >
          <KBarSearch 
            className={cn(
              'flex h-12 w-full',
              'border-b bg-transparent px-4',
              'text-sm placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-0',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            defaultPlaceholder="Type a command or search... (e.g., 'clear chat', 'toggle theme')"
          />
          <div className="max-h-[400px] overflow-y-auto p-2">
            <RenderResults />
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  )
} 