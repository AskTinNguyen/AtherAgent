# Redis Schema Analysis and Recommendations

## Current Implementation Analysis

### Key Patterns
```
FOLDER_PREFIX = "folder:"
CHAT_PREFIX = "chat:"
```

### Current Schema

#### Folder Schema
**Key Pattern**: `folder:{folderId}`
**Data Structure**: Hash (HSET)
**Fields**:
- `id`: string
- `name`: string
- `parentId`: string | undefined
- `order`: number (stored as string)
- `createdAt`: number (stored as string)
- `updatedAt`: number (stored as string)
- `chats`: string[] (stored as JSON string)

#### Chat Schema
**Key Pattern**: `chat:{chatId}`
**Data Structure**: Hash (HSET)
**Fields**:
- `id`: string
- `folderId`: string (optional)
- `createdAt`: number (stored as string)
- `updatedAt`: number (stored as string)
- `order`: number (stored as string)
- (other chat fields not visible in provided code)

## Identified Issues

### 1. WRONGTYPE Operation Error
The error "WRONGTYPE Operation against a key holding the wrong kind of value" indicates:
- Attempting to use a Redis command on a key containing a different data type than expected
- Possible data corruption where a key has been set with the wrong type
- Potential race conditions in concurrent operations

### 2. Schema Validation Issues
- No strict schema validation when creating/updating records
- The `chats` array in folders is stored as JSON string but could be corrupted
- No type checking before Redis operations
- No data recovery mechanisms for corrupted data

### 3. Potential Root Causes
1. Key Type Mismatches:
   - A folder/chat key might have been set as a string instead of a hash
   - The `chats` array might have been set directly instead of as part of the hash
2. Race Conditions:
   - Concurrent operations might be corrupting the data
   - No transaction support for multi-key operations
3. Error Handling:
   - Insufficient error handling for Redis operations
   - No recovery mechanisms for corrupted data

## Solution Options

### Option 1: Enhanced Schema Validation

```typescript
interface FolderSchema {
  id: string
  name: string
  parentId?: string
  order: string // stored as string in Redis
  createdAt: string // stored as string in Redis
  updatedAt: string // stored as string in Redis
  chats: string // JSON string of chat IDs
}

interface ChatSchema {
  id: string
  folderId?: string
  order: string
  createdAt: string
  updatedAt: string
}

function validateFolderData(data: Record<string, string>): boolean {
  const requiredFields = ['id', 'name', 'order', 'createdAt', 'updatedAt', 'chats']
  return requiredFields.every(field => field in data)
}
```

### Option 2: Data Recovery Mechanisms

```typescript
async function repairFolderData(folderId: string): Promise<void> {
  const redis = await getRedisClient()
  const key = `${FOLDER_PREFIX}${folderId}`
  
  // Check key type
  const type = await redis.type(key)
  if (type !== 'hash') {
    // Backup corrupted data
    const corrupted = await redis.get(key)
    await redis.set(`${key}:corrupted`, corrupted)
    await redis.del(key)
    
    // Create new hash with default values
    await redis.hmset(key, {
      id: folderId,
      name: 'Recovered Folder',
      chats: '[]',
      order: Date.now().toString(),
      createdAt: Date.now().toString(),
      updatedAt: Date.now().toString()
    })
  }
}
```

### Option 3: Transaction Support

```typescript
export async function addChatToFolder(
  folderId: string,
  chatId: string
): Promise<FolderOperationResult> {
  const redis = await getRedisClient()
  
  try {
    // Start a Redis transaction
    const multi = redis.multi()
    
    // Validate types before transaction
    const [folderType, chatType] = await Promise.all([
      redis.type(`${FOLDER_PREFIX}${folderId}`),
      redis.type(`${CHAT_PREFIX}${chatId}`)
    ])
    
    if (folderType !== 'hash' || chatType !== 'hash') {
      return { success: false, error: "Invalid data types detected" }
    }
    
    // Perform updates in transaction
    multi.hmset(chatKey, chatToUpdate)
    multi.hmset(folderKey, folderUpdate)
    
    await multi.exec()
    
    return { success: true, folder: updatedFolder }
  } catch (error: any) {
    return { success: false, error: error?.message }
  }
}
```

### Option 4: Alternative Data Structure
Consider using Redis Sets for managing folder-chat relationships:

```typescript
// Instead of storing chats array in folder hash
SADD folder:{folderId}:chats {chatId}
SREM folder:{folderId}:chats {chatId}
SMEMBERS folder:{folderId}:chats
```

## Recommendations

### Short-term Fixes
1. Implement immediate type checking before operations
2. Add data recovery mechanisms for corrupted keys
3. Add detailed logging for Redis operations

### Medium-term Improvements
1. Implement transaction support for multi-key operations
2. Add schema validation layer
3. Consider implementing Option 4 (Alternative Data Structure)

### Long-term Solutions
1. Implement a complete Redis ORM layer
2. Add automated data integrity checks
3. Implement backup and recovery procedures

## Next Steps
1. Review and select preferred solution approach
2. Create implementation plan
3. Add monitoring and alerting for Redis operations
4. Implement automated testing for Redis operations

## Questions to Consider
1. Should we implement all solutions or prioritize specific ones?
2. Do we need to migrate existing data?
3. How do we handle backward compatibility?
4. What monitoring and alerting do we need? 