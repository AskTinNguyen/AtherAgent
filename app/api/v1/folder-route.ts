import { NextRequest } from 'next/server'
import { createFolderSchema, updateFolderSchema, validateRequest } from '@/lib/api/validation'
import { successResponse, handleAPIError, NotFoundError } from '@/lib/api/response'
import { prisma } from '@/lib/prisma'
import type { 
  FolderListResponse, 
  FolderResponse,
  FolderWithChatsResponse,
  Folder,
  FolderWithChats
} from '@/lib/types/api/responses'
import type {
  CreateFolderRequest,
  UpdateFolderRequest,
  AddChatToFolderRequest
} from '@/lib/types/api/requests'

export async function GET(): Promise<FolderListResponse> {
  try {
    const folders = await prisma.folder.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return successResponse<Folder[]>(folders)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(
  request: NextRequest
): Promise<FolderResponse> {
  try {
    const data = await validateRequest<CreateFolderRequest>(request, createFolderSchema)
    
    const folder = await prisma.folder.create({
      data: {
        name: data.name,
        parentId: data.parentId,
        metadata: data.metadata
      }
    })

    return successResponse<Folder>(folder)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function PUT(
  request: NextRequest
): Promise<FolderResponse> {
  try {
    const data = await validateRequest<UpdateFolderRequest>(request, updateFolderSchema)
    const { id, ...updates } = data
    
    const folder = await prisma.folder.findUnique({
      where: { id }
    })
    
    if (!folder) {
      throw new NotFoundError('Folder not found')
    }
    
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: updates
    })

    return successResponse<Folder>(updatedFolder)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function DELETE(
  request: NextRequest
): Promise<FolderResponse> {
  try {
    const { id } = await request.json()
    
    const folder = await prisma.folder.findUnique({
      where: { id }
    })
    
    if (!folder) {
      throw new NotFoundError('Folder not found')
    }
    
    // Delete the folder and all its chats
    const deletedFolder = await prisma.folder.delete({
      where: { id },
      include: {
        chats: true
      }
    })

    return successResponse<Folder>(deletedFolder)
  } catch (error) {
    return handleAPIError(error)
  }
}
