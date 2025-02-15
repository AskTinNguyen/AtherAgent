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
  try {
    const redis = await getRedisClient()
    const folder = await redis.hgetall<Record<string, string>>(`${FOLDER_PREFIX}${id}`)
    
    if (!folder || Object.keys(folder).length === 0) {
      console.log(`[getFolder] Folder not found: ${id}`)
      return null
    }
    
    try {
      // Safely parse the chats array
      let parsedChats: string[] = []
      try {
        // Handle both string array and stringified array
        if (folder.chats) {
          if (Array.isArray(folder.chats)) {
            parsedChats = folder.chats
          } else {
            const parsed = JSON.parse(folder.chats)
            parsedChats = Array.isArray(parsed) ? parsed : []
          }
        }
      } catch (parseError) {
        console.warn(`[getFolder] Invalid chats array for folder ${id}, resetting to empty array`)
        // Reset the chats array in Redis
        await redis.hmset(`${FOLDER_PREFIX}${id}`, { chats: '[]' })
        parsedChats = []
      }

      // Convert string values back to their proper types with validation
      const parsedFolder: Folder = {
        id: folder.id || id,
        name: folder.name || 'Unnamed Folder',
        parentId: folder.parentId === 'null' ? undefined : folder.parentId,
        order: parseInt(folder.order) || Date.now(),
        createdAt: parseInt(folder.createdAt) || Date.now(),
        updatedAt: parseInt(folder.updatedAt) || Date.now(),
        chats: parsedChats
      }

      return parsedFolder
    } catch (parseError) {
      console.error(`[getFolder] Error parsing folder data for ${id}:`, {
        error: parseError,
        rawFolder: folder
      })
      
      // Return a sanitized version of the folder with defaults
      return {
        id: folder.id || id,
        name: folder.name || 'Unnamed Folder',
        parentId: folder.parentId === 'null' ? undefined : folder.parentId,
        order: parseInt(folder.order) || Date.now(),
        createdAt: parseInt(folder.createdAt) || Date.now(),
        updatedAt: parseInt(folder.updatedAt) || Date.now(),
        chats: []
      }
    }
  } catch (error) {
    console.error(`[getFolder] Redis error for folder ${id}:`, error)
    return null
  }
}

export async function updateFolder(
  id: string,
  updates: Partial<Folder>
): Promise<FolderOperationResult> {
  try {
    console.log(`[updateFolder] Starting update for folder ${id}`, { updates })
    
    const redis = await getRedisClient()
    const folder = await getFolder(id)
    if (!folder) {
      console.log(`[updateFolder] Folder not found: ${id}`)
      return { success: false, error: "Folder not found" }
    }

    // Ensure chats array is valid if it's being updated
    if (updates.chats !== undefined) {
      if (!Array.isArray(updates.chats)) {
        console.warn(`[updateFolder] Invalid chats array in updates, using empty array`)
        updates.chats = []
      }
    }

    const updatedFolder = {
      ...folder,
      ...updates,
      updatedAt: Date.now()
    }

    // Ensure all values are properly stringified for Redis
    const stringifiedFolder = Object.entries(updatedFolder).reduce((acc, [key, value]) => {
      let stringValue: string
      try {
        stringValue = typeof value === 'string' 
          ? value 
          : Array.isArray(value) 
            ? JSON.stringify(value)
            : typeof value === 'number'
              ? value.toString()
              : JSON.stringify(value)
      } catch (error) {
        console.error(`[updateFolder] Error stringifying value for key ${key}:`, error)
        // Provide safe fallback values based on key
        switch (key) {
          case 'chats':
            stringValue = '[]'
            break
          case 'order':
          case 'createdAt':
          case 'updatedAt':
            stringValue = Date.now().toString()
            break
          default:
            stringValue = typeof value === 'string' ? value : ''
        }
      }
      return { ...acc, [key]: stringValue }
    }, {} as Record<string, string>)

    console.log(`[updateFolder] Attempting to save folder:`, {
      id,
      folderKeys: Object.keys(stringifiedFolder),
      chatsLength: updatedFolder.chats.length
    })

    const result = await redis.hmset(`${FOLDER_PREFIX}${id}`, stringifiedFolder)

    if (!result) {
      console.error(`[updateFolder] Redis hmset returned falsy result for folder ${id}`)
      throw new Error('Failed to update folder')
    }

    console.log(`[updateFolder] Successfully updated folder ${id}`)
    return { success: true, folder: updatedFolder }
  } catch (error: any) {
    console.error(`[updateFolder] Error updating folder ${id}:`, {
      error: error?.message,
      stack: error?.stack,
      folderId: id
    })
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

async function syncFolderChats(folderId: string): Promise<string[]> {
  const redis = await getRedisClient()
  const chatKeys = await redis.keys(`${CHAT_PREFIX}*`)
  const chats: string[] = []

  for (const key of chatKeys) {
    const chat = await redis.hgetall<Record<string, string>>(key)
    if (chat && chat.folderId === folderId) {
      chats.push(key.replace(CHAT_PREFIX, ''))
    }
  }

  // Update the folder's chats array
  const folderKey = `${FOLDER_PREFIX}${folderId}`
  const folder = await redis.hgetall<Record<string, string>>(folderKey)
  
  if (folder) {
    await redis.hmset(folderKey, {
      ...folder,
      chats: JSON.stringify(chats),
      updatedAt: Date.now().toString()
    })
  }

  return chats
}

export async function addChatToFolder(
  folderId: string,
  chatId: string
): Promise<FolderOperationResult> {
  try {
    const redis = await getRedisClient()
    
    console.log(`[addChatToFolder] ====== Starting Operation ======`)
    console.log(`[addChatToFolder] Params:`, { chatId, folderId })
    
    // Check if folder exists
    const folderKey = `${FOLDER_PREFIX}${folderId}`
    const folder = await getFolder(folderId)
    console.log(`[addChatToFolder] Folder lookup result:`, {
      found: !!folder,
      name: folder?.name,
      currentChats: folder?.chats?.length || 0
    })

    if (!folder) {
      console.log(`[addChatToFolder] Folder not found: ${folderId}`)
      return { success: false, error: "Folder not found" }
    }

    // Check if chat exists and get its current state
    const chatKey = `${CHAT_PREFIX}${chatId}`
    const chat = await redis.hgetall<Record<string, string>>(chatKey)
    console.log(`[addChatToFolder] Chat lookup result:`, {
      found: !!chat && Object.keys(chat).length > 0,
      currentFolder: chat?.folderId || 'none'
    })

    if (!chat || Object.keys(chat).length === 0) {
      console.log(`[addChatToFolder] Chat not found: ${chatId}`)
      return { success: false, error: "Chat not found" }
    }

    // If chat is already in this folder, sync the folder's chats and return
    if (chat.folderId === folderId) {
      const syncedChats = await syncFolderChats(folderId)
      return { 
        success: true, 
        folder: {
          ...folder,
          chats: syncedChats
        }
      }
    }

    // Remove chat from its current folder if it has one
    if (chat.folderId) {
      const currentFolderChats = await syncFolderChats(chat.folderId)
      console.log(`[addChatToFolder] Removed chat from current folder:`, {
        folderId: chat.folderId,
        remainingChats: currentFolderChats
      })
    }

    // Prepare chat data for update
    const chatToUpdate = {
      ...chat,
      folderId,
      updatedAt: Date.now().toString(),
      createdAt: chat.createdAt.includes('T') 
        ? new Date(chat.createdAt).getTime().toString()
        : chat.createdAt
    }

    // Update the chat in Redis
    const chatUpdateResult = await redis.hmset(chatKey, chatToUpdate)
    if (!chatUpdateResult) {
      throw new Error('Failed to update chat')
    }

    // Update folder's chats array
    const updatedChats = [...folder.chats]
    if (!updatedChats.includes(chatId)) {
      updatedChats.push(chatId)
    }

    // Update the folder in Redis
    const folderUpdateResult = await redis.hmset(folderKey, {
      ...folder,
      chats: JSON.stringify(updatedChats),
      updatedAt: Date.now().toString()
    })

    if (!folderUpdateResult) {
      throw new Error('Failed to update folder')
    }

    const updatedFolder = {
      ...folder,
      chats: updatedChats,
      updatedAt: Date.now()
    }

    console.log(`[addChatToFolder] ====== Operation Successful ======`)
    return { success: true, folder: updatedFolder }
  } catch (error: any) {
    console.error(`[addChatToFolder] ====== Operation Failed ======`, {
      error: error?.message,
      stack: error?.stack,
      context: {
        folderId,
        chatId,
        timestamp: new Date().toISOString()
      }
    })
    return { 
      success: false, 
      error: error?.message || "Failed to add chat to folder" 
    }
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