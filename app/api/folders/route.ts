import {
  createFolder,
  deleteFolder,
  getFolderTree,
  updateFolder
} from '@/lib/redis/operations/folders'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const folderTree = await getFolderTree()
    return NextResponse.json(folderTree)
  } catch (error: any) {
    console.error('Error in GET /api/folders:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, parentId } = await request.json()
    const result = await createFolder(name, parentId)
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create folder' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, updates } = await request.json()
    const result = await updateFolder(id, updates)
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update folder' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    const result = await deleteFolder(id)
    
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete folder' },
      { status: 500 }
    )
  }
} 