import { config } from 'dotenv'
import { resolve } from 'path'
import { getRedisClient } from '../lib/redis/config'
import { ChatMigration } from '../lib/redis/migrations/chat-structure'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
  console.log('Starting Redis chat data migration...')
  console.log('----------------------------------------')
  
  try {
    // Verify Redis connection
    const redis = await getRedisClient()
    console.log('Redis client connected and ready')

    // Run migration
    const results = await ChatMigration.migrate()
    
    console.log('\nMigration Results:')
    console.log('----------------------------------------')
    console.log(`Total chats found: ${results.total}`)
    console.log(`Successfully migrated: ${results.success}`)
    console.log(`Failed migrations: ${results.failed}`)
    console.log(`Skipped (invalid/deleted): ${results.skipped}`)
    console.log('----------------------------------------')
    
    const hasIssues = results.failed > 0 || results.skipped > 0
    if (hasIssues) {
      console.warn('\nWarning: Some chats were not migrated successfully.')
      console.warn('Check the logs above for details on specific failures.')
      process.exit(1)
    } else {
      console.log('\nMigration completed successfully!')
      process.exit(0)
    }
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main() 