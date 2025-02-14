import { addChatToFolder, createFolder, getFolder, removeChatFromFolder } from '@/lib/redis/operations/folders'
import { NextRequest, NextResponse } from 'next/server'

// Default folders configuration with type safety
const DEFAULT_FOLDERS: Record<string, string> = {
  'personal': 'Personal',
  'work-projects': 'Work Projects'
} as const

export async function POST(
  request: NextRequest,
  context: { params: { folderId: string } }
) {
  try {
    const { folderId } = context.params
    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    if (!body?.chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    // Check if this is a default folder that needs to be created
    const normalizedFolderId = folderId.toLowerCase()
    
    // First try to find an existing folder with this name
    const existingFolders = await getFolder(normalizedFolderId)
    let folder = existingFolders
    
    if (!folder && normalizedFolderId in DEFAULT_FOLDERS) {
      console.log(`Creating default folder: ${DEFAULT_FOLDERS[normalizedFolderId]}`)
      const createResult = await createFolder(DEFAULT_FOLDERS[normalizedFolderId])
      if (!createResult.success || !createResult.folder) {
        return NextResponse.json(
          { error: 'Failed to create default folder' },
          { status: 500 }
        )
      }
      folder = createResult.folder
    }

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found and not a default folder' },
        { status: 404 }
      )
    }

    // Now try to add the chat to the folder
    const result = await addChatToFolder(folder.id, body.chatId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in POST /api/folders/[folderId]/chats:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to add chat to folder' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { folderId: string } }
) {
  try {
    const { folderId } = context.params
    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    if (!body?.chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    const result = await removeChatFromFolder(folderId, body.chatId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in DELETE /api/folders/[folderId]/chats:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to remove chat from folder' },
      { status: 500 }
    )
  }
} 