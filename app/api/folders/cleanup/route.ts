import { getRedisClient } from '@/lib/redis/config'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    const redis = await getRedisClient()
    const cleanupResults = {
      duplicateFolders: 0,
      errors: [] as string[]
    }

    // Get all folder keys
    const folderKeys = await redis.keys('folder:*')
    const folderMap = new Map<string, Array<{id: string, order: number}>>() // Map of folder name to folder IDs with order

    // Group folders by name
    for (const key of folderKeys) {
      try {
        const folder = await redis.hgetall(key)
        if (!folder || !folder.name) continue

        const name = folder.name.toLowerCase()
        const existingFolders = folderMap.get(name) || []
        existingFolders.push({
          id: key,
          order: parseInt(folder.order) || 0
        })
        folderMap.set(name, existingFolders)
      } catch (error) {
        console.error(`Error processing folder ${key}:`, error)
        cleanupResults.errors.push(`Failed to process folder ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // For each set of duplicate folders, keep the oldest one (lowest order) and delete the rest
    for (const [name, folders] of folderMap.entries()) {
      if (folders.length > 1) {
        // Sort by order (ascending) to keep the oldest folder
        folders.sort((a, b) => a.order - b.order)
        const [keepFolder, ...duplicateFolders] = folders
        
        for (const folder of duplicateFolders) {
          try {
            // Delete the folder
            await redis.del(folder.id)
            cleanupResults.duplicateFolders++
          } catch (error) {
            console.error(`Error deleting duplicate folder ${folder.id}:`, error)
            cleanupResults.errors.push(`Failed to delete duplicate folder ${folder.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...cleanupResults
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
} 