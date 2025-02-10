import { mkdir, writeFile } from 'fs/promises'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      )
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      )
    }

    // Create unique filename
    const id = nanoid()
    const ext = file.name.split('.').pop()
    const filename = `${id}.${ext}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error
      }
    }

    // Write file
    await writeFile(join(uploadDir, filename), buffer)

    // Return file info
    return NextResponse.json({
      id,
      filename,
      type: file.type,
      size: file.size,
      url: `/uploads/${filename}`
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
} 