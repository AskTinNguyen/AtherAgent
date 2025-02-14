import { nanoid } from "nanoid"
import { getRedisClient } from '../config'
import { Chat, Folder, FolderOperationResult, FolderTree } from "../types/folders"

const FOLDER_PREFIX = "folder:"
const CHAT_PREFIX = "chat:"

export async function createFolder(
  name: string,
  parentId?: string
): Promise<FolderOperationResult> {
  try {
    const redis = await getRedisClient()
    const id = nanoid()
    const now = Date.now()
    
    const folder: Folder = {
      id,
      name,
      parentId,
      order: now,
      createdAt: now,
      updatedAt: now,
      chats: []
    }

    const result = await redis.hmset(
      `${FOLDER_PREFIX}${id}`,
      folder as unknown as Record<string, string>
    )

    if (!result) {
      throw new Error('Failed to create folder')
    }

    return { success: true, folder }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create folder" }
  }
}

export async function getFolder(id: string): Promise<Folder | null> {
  const redis = await getRedisClient()
  const folder = await redis.hgetall<Record<string, string>>(`${FOLDER_PREFIX}${id}`)
  if (!folder || Object.keys(folder).length === 0) return null
  
  // Convert string values back to their proper types
  return {
    ...folder,
    order: parseInt(folder.order),
    createdAt: parseInt(folder.createdAt),
    updatedAt: parseInt(folder.updatedAt),
    chats: JSON.parse(folder.chats || '[]')
  } as Folder
}

export async function updateFolder(
  id: string,
  updates: Partial<Folder>
): Promise<FolderOperationResult> {
  try {
    const redis = await getRedisClient()
    const folder = await getFolder(id)
    if (!folder) return { success: false, error: "Folder not found" }

    const updatedFolder = {
      ...folder,
      ...updates,
      updatedAt: Date.now()
    }

    const result = await redis.hmset(
      `${FOLDER_PREFIX}${id}`,
      {
        ...updatedFolder,
        chats: JSON.stringify(updatedFolder.chats)
      } as unknown as Record<string, string>
    )

    if (!result) {
      throw new Error('Failed to update folder')
    }

    return { success: true, folder: updatedFolder }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update folder" }
  }
}

export async function deleteFolder(id: string): Promise<FolderOperationResult> {
  try {
    const redis = await getRedisClient()
    const folder = await getFolder(id)
    if (!folder) return { success: false, error: "Folder not found" }

    const result = await redis.del(`${FOLDER_PREFIX}${id}`)
    if (!result) {
      throw new Error('Failed to delete folder')
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete folder" }
  }
}

export async function addChatToFolder(
  folderId: string,
  chatId: string
): Promise<FolderOperationResult> {
  try {
    const redis = await getRedisClient()
    const folder = await getFolder(folderId)
    if (!folder) return { success: false, error: "Folder not found" }

    if (!folder.chats.includes(chatId)) {
      folder.chats.push(chatId)
      folder.updatedAt = Date.now()
      
      const result = await redis.hmset(
        `${FOLDER_PREFIX}${folderId}`,
        {
          ...folder,
          chats: JSON.stringify(folder.chats)
        } as unknown as Record<string, string>
      )

      if (!result) {
        throw new Error('Failed to update folder')
      }
    }

    // Update chat's folderId
    const chat = await redis.hgetall<Record<string, string>>(`${CHAT_PREFIX}${chatId}`)
    if (chat) {
      chat.folderId = folderId
      const chatResult = await redis.hmset(`${CHAT_PREFIX}${chatId}`, chat)
      if (!chatResult) {
        throw new Error('Failed to update chat')
      }
    }

    return { success: true, folder }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to add chat to folder" }
  }
}

export async function removeChatFromFolder(
  folderId: string,
  chatId: string
): Promise<FolderOperationResult> {
  try {
    const redis = await getRedisClient()
    const folder = await getFolder(folderId)
    if (!folder) return { success: false, error: "Folder not found" }

    folder.chats = folder.chats.filter(id => id !== chatId)
    folder.updatedAt = Date.now()

    const result = await redis.hmset(
      `${FOLDER_PREFIX}${folderId}`,
      {
        ...folder,
        chats: JSON.stringify(folder.chats)
      } as unknown as Record<string, string>
    )

    if (!result) {
      throw new Error('Failed to update folder')
    }

    // Remove folderId from chat
    const chat = await redis.hgetall<Record<string, string>>(`${CHAT_PREFIX}${chatId}`)
    if (chat && chat.folderId === folderId) {
      delete chat.folderId
      const chatResult = await redis.hmset(`${CHAT_PREFIX}${chatId}`, chat)
      if (!chatResult) {
        throw new Error('Failed to update chat')
      }
    }

    return { success: true, folder }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to remove chat from folder" }
  }
}

export async function getFolderTree(): Promise<FolderTree> {
  const redis = await getRedisClient()
  const tree: FolderTree = {}
  const folderKeys = await redis.keys(`${FOLDER_PREFIX}*`)
  
  // First pass: create folder nodes
  for (const key of folderKeys) {
    const folder = await getFolder(key.replace(FOLDER_PREFIX, ''))
    if (folder) {
      tree[folder.id] = {
        folder,
        children: {},
        chats: []
      }
    }
  }

  // Second pass: build hierarchy and load chats
  for (const id in tree) {
    const node = tree[id]
    const folder = node.folder

    // Build folder hierarchy
    if (folder.parentId && tree[folder.parentId]) {
      tree[folder.parentId].children[id] = tree[id]
      delete tree[id]
    }

    // Load chats
    const chatPromises = folder.chats.map(async chatId => {
      const chat = await redis.hgetall<Record<string, string>>(`${CHAT_PREFIX}${chatId}`)
      if (!chat || Object.keys(chat).length === 0) return null
      return {
        ...chat,
        order: parseInt(chat.order),
        createdAt: parseInt(chat.createdAt),
        updatedAt: parseInt(chat.updatedAt)
      } as Chat
    })
    
    const chats = await Promise.all(chatPromises)
    node.chats = chats.filter((chat): chat is Chat => chat !== null)
  }

  return tree
} 