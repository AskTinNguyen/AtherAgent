export interface Folder {
  id: string
  name: string
  parentId?: string
  order: number
  createdAt: number
  updatedAt: number
  chats: string[] // Array of chat IDs
}

export interface Chat {
  id: string
  title: string
  folderId?: string
  order: number
  createdAt: number
  updatedAt: number
  lastMessage?: string
  messageCount?: number
}

export interface FolderTree {
  [key: string]: {
    folder: Folder
    children: FolderTree
    chats: Chat[]
  }
}

export interface FolderOperationResult {
  success: boolean
  error?: string
  folder?: Folder
  chat?: Chat
}

// Type guards
export function isFolder(item: any): item is Folder {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.order === "number" &&
    typeof item.createdAt === "number" &&
    typeof item.updatedAt === "number" &&
    Array.isArray(item.chats)
  )
}

export function isChat(item: any): item is Chat {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.order === "number" &&
    typeof item.createdAt === "number" &&
    typeof item.updatedAt === "number"
  )
} 