import { UploadError } from '@/lib/types/index'

export interface ValidationOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
}

export interface UploadProgressOptions {
  xhr: XMLHttpRequest
  onProgress?: (progress: number) => void
}

export interface BaseUploadResult {
  id: string
  url: string
  path: string
  size: number
  contentType: string
}

// File validation utility
export function validateFile(file: File, options: ValidationOptions = {}) {
  const {
    maxSize = 20 * 1024 * 1024, // 20MB default (OpenAI's limit)
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = options

  if (file.size > maxSize) {
    throw new UploadError(`File too large (max ${maxSize / (1024 * 1024)}MB)`)
  }

  if (!allowedTypes.includes(file.type)) {
    throw new UploadError(`Unsupported file type. Allowed: ${allowedTypes.join(', ')}`)
  }
}

// Progress tracking utility
export function setupProgressTracking({ xhr, onProgress }: UploadProgressOptions) {
  if (!onProgress) return

  xhr.upload.addEventListener('progress', (event) => {
    if (event.lengthComputable) {
      const progress = (event.loaded / event.total) * 100
      onProgress(progress)
    }
  })
}

// Error handling utility
export function handleUploadError(error: unknown): never {
  if (error instanceof UploadError) {
    throw error
  }
  throw new UploadError(error instanceof Error ? error.message : 'Upload failed')
}

// File type detection utility
export function getFileType(file: File): 'image' | 'other' {
  if (file.type.startsWith('image/')) {
    return 'image'
  }
  return 'other'
} 