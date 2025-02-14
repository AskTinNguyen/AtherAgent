import { getRedisClient } from '@/lib/redis/config'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const redis = await getRedisClient()
    const cleanupResults = {
      invalidChats: 0,
      orphanedMessages: 0,
      oldFormatChats: 0,
      errors: [] as string[]
    }

    // Get all chat-related keys
    const allChatKeys = await redis.keys('chat:*')
    
    // Separate old and new format keys
    const oldFormatKeys = allChatKeys.filter(key => key.split(':').length === 2)
    const newFormatKeys = allChatKeys.filter(key => key.split(':').length > 2)
    
    // Process old format chats
    for (const chatKey of oldFormatKeys) {
      try {
        const chat = await redis.hgetall(chatKey)
        
        // If chat is invalid
        if (!chat || !chat.id || chat.id === 'null' || chat.id === 'undefined') {
          await redis.del(chatKey)
          cleanupResults.invalidChats++
          continue
        }

        // If chat has messages field, it's in old format
        if (chat.messages) {
          cleanupResults.oldFormatChats++
          // We'll let the migration handle these
        }
      } catch (error) {
        console.error(`Error processing old format chat ${chatKey}:`, error)
        cleanupResults.errors.push(`Failed to process old chat ${chatKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Process new format chat info
    const chatInfoKeys = newFormatKeys.filter(key => key.endsWith(':info'))
    for (const infoKey of chatInfoKeys) {
      try {
        const chatInfo = await redis.hgetall(infoKey)
        const chatId = infoKey.split(':')[1]
        
        // If chat info is invalid
        if (!chatInfo || !chatInfo.id || chatInfo.id === 'null' || chatInfo.id === 'undefined') {
          // Delete all related keys
          const relatedKeys = await redis.keys(`chat:${chatId}:*`)
          await Promise.all(relatedKeys.map(key => redis.del(key)))
          
          // Delete associated messages
          const messageKeys = await redis.keys(`message:${chatId}:*`)
          await Promise.all(messageKeys.map(key => redis.del(key)))
          
          cleanupResults.invalidChats++
          cleanupResults.orphanedMessages += messageKeys.length
        }
      } catch (error) {
        console.error(`Error processing chat info ${infoKey}:`, error)
        cleanupResults.errors.push(`Failed to process chat info ${infoKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Process orphaned messages
    const messageKeys = await redis.keys('message:*')
    for (const messageKey of messageKeys) {
      try {
        const [_, chatId, messageId] = messageKey.split(':')
        
        // Check if parent chat info exists
        const chatInfoExists = await redis.hgetall(`chat:${chatId}:info`)
        
        if (!chatInfoExists || Object.keys(chatInfoExists).length === 0) {
          // Delete orphaned message
          await redis.del(messageKey)
          cleanupResults.orphanedMessages++
        }
      } catch (error) {
        console.error(`Error processing message ${messageKey}:`, error)
        cleanupResults.errors.push(`Failed to process message ${messageKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
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