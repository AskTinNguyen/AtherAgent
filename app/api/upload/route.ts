import { uploadChatImage } from '@/lib/utils/chat-image-upload'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const chatId = formData.get('chatId') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!chatId) {
      return NextResponse.json(
        { error: 'No chat ID provided' },
        { status: 400 }
      )
    }

    // Upload to Supabase
    const result = await uploadChatImage(file, chatId)

    // Return file info
    return NextResponse.json({
      id: result.id,
      filename: file.name,
      type: file.type,
      size: file.size,
      url: result.url,
      path: result.path
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
} 