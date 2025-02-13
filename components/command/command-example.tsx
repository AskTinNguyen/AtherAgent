'use client'

import { MessageType } from '@/lib/types/chat'
import { cn } from '@/lib/utils'
import {
    Action,
    KBarAnimator,
    KBarPortal,
    KBarPositioner,
    KBarSearch,
    useKBar,
    useRegisterActions
} from 'kbar'
import {
    BookOpen,
    Brain,
    Code,
    Download,
    FileSearch,
    Home,
    PanelLeftClose,
    Search,
    Settings,
    Sun,
    Trash2
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RenderResults } from './render-results'

// Define the type for system prompts
type SystemPrompts = {
  [key: string]: string
}

// Simplified saved prompts for quick access
const ATHER_SYSTEM_PROMPTS: SystemPrompts = {
  understand: `I want you to analyze and summarize the following text, focusing on key points and main ideas while maintaining context:`,

  research: `I want you to act as a research assistant and provide comprehensive information about the following topic:`,

  code: `I want you to act as an expert software developer. Please help me with the following code-related request:`,

  explain: `I want you to explain the following concept in clear, simple terms with examples:`
}

// Add this helper function to create chat messages
function createChatMessage(content: string, role: 'user' | 'assistant' | 'system' = 'user') {
  return {
    id: crypto.randomUUID(),
    role,
    type: MessageType.TEXT,
    content,
    timestamp: Date.now()
  }
}

// Simplified helper to dispatch chat messages
function dispatchChatMessage(systemPrompt: string, userContent: string) {
  // Create a new conversation with the system prompt and user content
  document.dispatchEvent(new CustomEvent('chat-message', {
    detail: createChatMessage(systemPrompt, 'system')
  }))

  document.dispatchEvent(new CustomEvent('chat-message', {
    detail: createChatMessage(userContent, 'user')
  }))

  // Trigger send
  document.dispatchEvent(new CustomEvent('chat-send'))
}

// Add this helper function at the top level
function isAtherCommand(query: string) {
  return query.toLowerCase().trim().startsWith('ather')
}

// Add root action for AI Commands
const AI_ROOT_ACTION: Action = {
  id: 'ather-root',
  name: 'Quick Prompts',
  keywords: '',
  section: 'AI',
  subtitle: 'Launch saved prompts'
}

export function CommandExample() {
  const { setTheme } = useTheme()
  const router = useRouter()
  const { query } = useKBar()

  // Simplified Ather AI actions
  const atherActions: Action[] = [
    {
      id: 'ather-understand',
      name: 'Analyze Text',
      shortcut: ['meta', 'shift', 't'],
      keywords: 'analyze summarize understand text',
      subtitle: 'Analyze or summarize text',
      parent: 'ather-root',
      icon: <Brain className="w-4 h-4" />,
      perform: () => {
        const input = document.querySelector<HTMLInputElement>('input.kbar-input')
        const userInput = input?.value || ''
        if (!userInput.trim()) return
        
        dispatchChatMessage(ATHER_SYSTEM_PROMPTS.understand, userInput)
        query.toggle()
      }
    },
    {
      id: 'ather-research',
      name: 'Research Topic',
      shortcut: ['meta', 'shift', 'r'],
      keywords: 'research investigate study topic',
      subtitle: 'Research any topic',
      parent: 'ather-root',
      icon: <Search className="w-4 h-4" />,
      perform: () => {
        const input = document.querySelector<HTMLInputElement>('input.kbar-input')
        const userInput = input?.value || ''
        if (!userInput.trim()) return
        
        dispatchChatMessage(ATHER_SYSTEM_PROMPTS.research, userInput)
        query.toggle()
      }
    },
    {
      id: 'ather-code',
      name: 'Code Help',
      shortcut: ['meta', 'shift', 'c'],
      keywords: 'code program develop explain',
      subtitle: 'Get coding assistance',
      parent: 'ather-root',
      icon: <Code className="w-4 h-4" />,
      perform: () => {
        const input = document.querySelector<HTMLInputElement>('input.kbar-input')
        const userInput = input?.value || ''
        if (!userInput.trim()) return
        
        dispatchChatMessage(ATHER_SYSTEM_PROMPTS.code, userInput)
        query.toggle()
      }
    },
    {
      id: 'ather-explain',
      name: 'Explain Concept',
      shortcut: ['meta', 'shift', 'k'],
      keywords: 'explain understand learn concept',
      subtitle: 'Get concept explanations',
      parent: 'ather-root',
      icon: <BookOpen className="w-4 h-4" />,
      perform: () => {
        const input = document.querySelector<HTMLInputElement>('input.kbar-input')
        const userInput = input?.value || ''
        if (!userInput.trim()) return
        
        dispatchChatMessage(ATHER_SYSTEM_PROMPTS.explain, userInput)
        query.toggle()
      }
    }
  ]

  // Register both root and AI actions together first
  useRegisterActions([AI_ROOT_ACTION, ...atherActions])

  // Register regular commands
  const regularActions: Action[] = [
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

  useRegisterActions(regularActions)

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
              'flex h-12 w-full kbar-input',
              'border-b bg-transparent px-4',
              'text-sm placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-0',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            defaultPlaceholder="Type your text, then select an AI command..."
          />
          <div className="max-h-[400px] overflow-y-auto p-2">
            <RenderResults />
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  )
} 