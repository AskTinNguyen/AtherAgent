import { addChatToFolder, removeChatFromFolder } from '@/lib/redis/operations/folders'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const { chatId } = await request.json()
    const result = await addChatToFolder(params.folderId, chatId)
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to add chat to folder' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const { chatId } = await request.json()
    const result = await removeChatFromFolder(params.folderId, chatId)
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to remove chat from folder' },
      { status: 500 }
    )
  }
} 