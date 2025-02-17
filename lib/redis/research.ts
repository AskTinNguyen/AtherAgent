import { nanoid } from 'nanoid'
import { getRedisClient } from './config'

// Define types to match the deep research context
interface ResearchActivity {
  id: string
  chatId: string
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought'
  status: 'pending' | 'complete' | 'error'
  message: string
  timestamp: string
  depth?: number
  createdAt: string
}

interface ResearchSource {
  id: string
  chatId: string
  url: string
  title: string
  relevance: number
  createdAt: string
}

interface ResearchState {
  isActive: boolean
  isCleared: boolean
  clearedAt?: string
  currentDepth: number
  maxDepth: number
  completedSteps: number
  totalExpectedSteps: number
  activities: ResearchActivity[]
  sources: ResearchSource[]
}

// Redis key patterns
const REDIS_KEYS = {
  researchState: (chatId: string) => `chat:${chatId}:research:state`,
  researchActivities: (chatId: string) => `chat:${chatId}:research:activities`,
  researchSources: (chatId: string) => `chat:${chatId}:research:sources`,
} as const

export async function updateChatResearchState(
  chatId: string,
  isCleared: boolean,
  maxDepth?: number
): Promise<void> {
  const redis = await getRedisClient()
  const stateKey = REDIS_KEYS.researchState(chatId)
  const activitiesKey = REDIS_KEYS.researchActivities(chatId)
  const sourcesKey = REDIS_KEYS.researchSources(chatId)

  // Get current state first to avoid unnecessary updates
  const currentState = await redis.hgetall(stateKey)
  const newState = {
    isActive: !isCleared,
    isCleared,
    clearedAt: isCleared ? new Date().toISOString() : null,
    currentDepth: 0,
    maxDepth: maxDepth ?? 7,
    completedSteps: 0,
    totalExpectedSteps: 0
  }

  // Only update if state has changed
  if (!currentState || 
      currentState.isCleared !== String(isCleared) || 
      currentState.maxDepth !== String(maxDepth ?? 7)) {
    
    const pipeline = redis.pipeline()

    // Batch all operations
    pipeline.hmset(stateKey, newState)
    
    if (isCleared) {
      pipeline.del(activitiesKey)
      pipeline.del(sourcesKey)
    }

    await pipeline.exec()
  }
}

export async function updateResearchDepth(
  chatId: string,
  currentDepth: number,
  maxDepth: number
): Promise<void> {
  const redis = await getRedisClient()
  const stateKey = REDIS_KEYS.researchState(chatId)

  await redis.hmset(stateKey, {
    currentDepth: currentDepth.toString(),
    maxDepth: maxDepth.toString()
  })
}

export async function getChatResearchState(chatId: string): Promise<ResearchState> {
  const redis = await getRedisClient()
  const stateKey = REDIS_KEYS.researchState(chatId)
  const activitiesKey = REDIS_KEYS.researchActivities(chatId)
  const sourcesKey = REDIS_KEYS.researchSources(chatId)

  const pipeline = redis.pipeline()
  pipeline.hgetall(stateKey)
  pipeline.zrange(activitiesKey, 0, -1)
  pipeline.zrange(sourcesKey, 0, -1)
  
  const [state, activities, sources] = await pipeline.exec() as [
    Record<string, string> | null,
    string[],
    string[]
  ]

  const parsedState = state ? {
    isActive: state.isActive === 'true',
    isCleared: state.isCleared === 'true',
    clearedAt: state.clearedAt === 'null' ? undefined : state.clearedAt,
    currentDepth: parseInt(state.currentDepth || '0', 10),
    maxDepth: parseInt(state.maxDepth || '7', 10),
    completedSteps: parseInt(state.completedSteps || '0', 10),
    totalExpectedSteps: parseInt(state.totalExpectedSteps || '0', 10)
  } : {
    isActive: true,
    isCleared: false,
    currentDepth: 0,
    maxDepth: 7,
    completedSteps: 0,
    totalExpectedSteps: 0
  }

  return {
    ...parsedState,
    activities: activities?.map(a => JSON.parse(a)) || [],
    sources: sources?.map(s => JSON.parse(s)) || []
  }
}

export async function addResearchActivity(
  chatId: string,
  activity: Omit<ResearchActivity, 'id' | 'chatId' | 'createdAt'>
): Promise<void> {
  const redis = await getRedisClient()
  const activitiesKey = REDIS_KEYS.researchActivities(chatId)
  const state = await getChatResearchState(chatId)

  if (state.isCleared) {
    return
  }

  const newActivity: ResearchActivity = {
    ...activity,
    id: nanoid(),
    chatId,
    createdAt: new Date().toISOString()
  }

  await redis.zadd(activitiesKey, Date.now(), JSON.stringify(newActivity))
}

// Batch activity updates
const activityUpdateQueue = new Map<string, { id: string; status: string }[]>()
const BATCH_DELAY = 100 // ms

export async function updateActivityStatus(
  chatId: string,
  activityId: string,
  status: ResearchActivity['status']
): Promise<void> {
  // Add to queue
  const queueKey = `${chatId}`
  const currentQueue = activityUpdateQueue.get(queueKey) || []
  currentQueue.push({ id: activityId, status })
  activityUpdateQueue.set(queueKey, currentQueue)

  // Debounce updates
  await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))

  // Process queue if it still contains our update
  const queue = activityUpdateQueue.get(queueKey)
  if (queue?.some(item => item.id === activityId)) {
    const redis = await getRedisClient()
    const activitiesKey = REDIS_KEYS.researchActivities(chatId)
    const activities = await redis.zrange(activitiesKey, 0, -1)

    if (!activities?.length) {
      activityUpdateQueue.delete(queueKey)
      return
    }

    const parsedActivities = activities.map(a => JSON.parse(a))
    const updatedActivities = parsedActivities.map(activity => {
      const queuedUpdate = queue.find(item => item.id === activity.id)
      return queuedUpdate 
        ? { ...activity, status: queuedUpdate.status }
        : activity
    })

    const pipeline = redis.pipeline()
    pipeline.del(activitiesKey)
    
    for (const activity of updatedActivities) {
      pipeline.zadd(activitiesKey, Date.now(), JSON.stringify(activity))
    }
    
    await pipeline.exec()
    activityUpdateQueue.delete(queueKey)
  }
}

// Add batching for source additions
const sourceAdditionQueue = new Map<string, ResearchSource[]>()

export async function addResearchSource(
  chatId: string,
  source: Omit<ResearchSource, 'id' | 'chatId' | 'createdAt'>
): Promise<void> {
  const redis = await getRedisClient()
  const sourcesKey = REDIS_KEYS.researchSources(chatId)
  const state = await getChatResearchState(chatId)

  if (state.isCleared) return

  const newSource: ResearchSource = {
    ...source,
    id: nanoid(),
    chatId,
    createdAt: new Date().toISOString()
  }

  // Add to queue
  const currentQueue = sourceAdditionQueue.get(chatId) || []
  currentQueue.push(newSource)
  sourceAdditionQueue.set(chatId, currentQueue)

  // Debounce updates
  await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))

  // Process queue
  const queue = sourceAdditionQueue.get(chatId)
  if (queue?.length) {
    const pipeline = redis.pipeline()
    
    for (const queuedSource of queue) {
      pipeline.zadd(sourcesKey, Date.now(), JSON.stringify(queuedSource))
    }
    
    await pipeline.exec()
    sourceAdditionQueue.delete(chatId)
  }
} 