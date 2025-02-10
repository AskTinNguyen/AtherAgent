export async function uploadFile(file: File, onProgress?: (progress: number) => void) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          onProgress(progress)
        }
      })
    }

    return new Promise((resolve, reject) => {
      xhr.open('POST', '/api/upload')
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            reject(new Error('Invalid response format'))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.error || 'Upload failed'))
          } catch {
            reject(new Error('Upload failed'))
          }
        }
      }

      xhr.onerror = () => {
        reject(new Error('Network error'))
      }

      xhr.send(formData)
    })
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Upload failed')
  }
}

export function getFileType(file: File): 'image' | 'document' | 'other' {
  if (file.type.startsWith('image/')) {
    return 'image'
  } else if (file.type === 'application/pdf') {
    return 'document'
  }
  return 'other'
}

export function validateFile(file: File) {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']

  if (file.size > maxSize) {
    throw new Error('File too large (max 5MB)')
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported')
  }
} 