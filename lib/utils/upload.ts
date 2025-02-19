import { UploadError } from '@/lib/types/index'
import { BaseUploadResult, getFileType, handleUploadError, setupProgressTracking, validateFile } from './upload-utils'

export async function uploadFile(file: File, onProgress?: (progress: number) => void): Promise<BaseUploadResult> {
  try {
    // Validate file
    validateFile(file)

    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    setupProgressTracking({ xhr, onProgress })

    return new Promise((resolve, reject) => {
      xhr.open('POST', '/api/upload')
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            reject(new UploadError('Invalid response format'))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new UploadError(error.error || 'Upload failed'))
          } catch {
            reject(new UploadError('Upload failed'))
          }
        }
      }

      xhr.onerror = () => {
        reject(new UploadError('Network error'))
      }

      xhr.send(formData)
    })
  } catch (error) {
    throw handleUploadError(error)
  }
}

// Re-export utility functions
export { getFileType, validateFile }
