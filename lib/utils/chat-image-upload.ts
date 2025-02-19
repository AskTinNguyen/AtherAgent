import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { BaseUploadResult, handleUploadError, validateFile } from './upload-utils'

export interface ChatImageUploadResult extends BaseUploadResult {
  tempPath?: string  // Path in temp storage
}

// Upload to temporary storage first
export async function uploadChatImageTemp(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ChatImageUploadResult> {
  const supabase = createClient()

  try {
    // Validate file with specific options for chat images
    validateFile(file, {
      maxSize: 20 * 1024 * 1024, // 20MB - OpenAI limit
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    })

    // Generate unique file path for temp storage
    const ext = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${ext}`
    const tempPath = `temp/${fileName}`

    // Upload to temporary storage bucket
    const { data, error } = await supabase.storage
      .from('chat_images_temp')
      .upload(tempPath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL for temporary file
    const { data: { publicUrl } } = supabase.storage
      .from('chat_images_temp')
      .getPublicUrl(tempPath)

    return {
      id: fileName,
      url: publicUrl,
      path: tempPath,
      size: file.size,
      contentType: file.type,
      tempPath
    }
  } catch (error) {
    throw handleUploadError(error)
  }
}

// Move from temp to permanent storage after successful AI processing
export async function persistChatImage(
  tempResult: ChatImageUploadResult,
  chatId: string
): Promise<ChatImageUploadResult> {
  const supabase = createClient()

  try {
    // Download from temp storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('chat_images_temp')
      .download(tempResult.tempPath!)

    if (downloadError) throw downloadError

    // Generate permanent path
    const permanentPath = `${chatId}/${tempResult.id}`

    // Upload to permanent storage
    const { error: uploadError } = await supabase.storage
      .from('chat_images')
      .upload(permanentPath, fileData, {
        contentType: tempResult.contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get permanent URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat_images')
      .getPublicUrl(permanentPath)

    // Store metadata only after successful AI processing
    const { error: dbError } = await supabase
      .from('chat_images')
      .insert({
        chat_id: chatId,
        file_path: permanentPath,
        file_name: tempResult.id,
        content_type: tempResult.contentType,
        size: tempResult.size,
        metadata: {
          original_name: tempResult.id.split('/').pop()
        }
      })

    if (dbError) throw dbError

    // Clean up temp storage
    await supabase.storage
      .from('chat_images_temp')
      .remove([tempResult.tempPath!])

    return {
      ...tempResult,
      url: publicUrl,
      path: permanentPath
    }
  } catch (error) {
    throw handleUploadError(error)
  }
}

// Clean up temporary images that weren't used
export async function cleanupTempImage(tempPath: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.storage
      .from('chat_images_temp')
      .remove([tempPath])

    if (error) throw error
  } catch (error) {
    console.error('Cleanup error:', error)
    // Don't throw - this is a cleanup operation
  }
}

export async function getChatImages(chatId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('chat_images')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function deleteChatImage(filePath: string) {
  const supabase = createClient()

  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('chat_images')
      .remove([filePath])

    if (storageError) throw storageError

    // Delete metadata
    const { error: dbError } = await supabase
      .from('chat_images')
      .delete()
      .eq('file_path', filePath)

    if (dbError) throw dbError
  } catch (error) {
    throw handleUploadError(error)
  }
} 