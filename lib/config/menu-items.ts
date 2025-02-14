import { Folder, MessageSquare } from 'lucide-react'

export interface MenuItem {
  id: string
  name: string
  icon?: any // Using any for Lucide icons
  items?: {
    id: string
    name: string
    icon?: any
    path?: string
  }[]
}

export const menuItems: MenuItem[] = [
  {
    id: 'work',
    name: 'Work Projects',
    icon: Folder,
    items: [
      {
        id: 'project-a',
        name: 'Project A',
        icon: MessageSquare,
        path: '/chat/project-a'
      },
      {
        id: 'project-b',
        name: 'Project B',
        icon: MessageSquare,
        path: '/chat/project-b'
      }
    ]
  },
  {
    id: 'personal',
    name: 'Personal',
    icon: Folder,
    items: [
      {
        id: 'notes',
        name: 'Notes',
        icon: MessageSquare,
        path: '/chat/notes'
      },
      {
        id: 'ideas',
        name: 'Ideas',
        icon: MessageSquare,
        path: '/chat/ideas'
      }
    ]
  }
] 