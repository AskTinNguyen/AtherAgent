import { NextRequest } from 'next/server'
import { successResponse, handleAPIError } from '@/lib/api/response'
import type { UploadResponse, UploadResult } from '@/lib/types/api/responses'
import { uploadToStorage } from '@/lib/storage'

export async function POST(
  request: NextRequest
): Promise<UploadResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      throw new Error('No file provided')
    }
    
    // Validate file size
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit')
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported')
    }
    
    // Upload file to storage
    const result = await uploadToStorage(file)
    
    return successResponse<UploadResult>({
      url: result.url,
      filename: file.name,
      size: file.size,
      mimeType: file.type
    })
  } catch (error) {
    return handleAPIError(error)
  }
}
