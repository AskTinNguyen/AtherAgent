import { ResearchActivityType } from '@/lib/types/research'
import { nanoid } from 'nanoid'
import { getRedisClient } from './config'

// Define types to match the deep research context
interface ResearchActivity {
  id: string
  chatId: string
  type: 'search' | 'extract' | 'analyze' | 'reasoning' | 'synthesis' | 'thought' | 'user_prompt' | 'ai_response' | 'ai_suggestion' | 'visualization_update' | 'research_path'
  status: 'pending' | 'complete' | 'error'
  message: string
  timestamp: string
  depth?: number
  createdAt: string
  metadata?: {
    aiModel?: string
    confidence?: number
    relatedTopics?: string[]
    sourceContext?: string
    previousActivities?: string[]  // IDs of related activities
    visualizationData?: {
      type: 'path' | 'depth' | 'suggestion' | 'analysis'
      depthLevel?: number
      pathProgress?: number
      relatedActivities?: string[]
      interactionType?: 'auto' | 'user_triggered'
      displayTimestamp: string
    }
    researchPath?: {
      currentStep: number
      totalSteps: number
      pathType: string
    }
  }
  parentActivityId?: string  // To track conversation flow
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

  if (isCleared) {
    const pipeline = redis.pipeline()
    // Update state
    pipeline.hmset(stateKey, {
      isActive: false,
      isCleared: true,
      clearedAt: new Date().toISOString(),
      currentDepth: 0,
      maxDepth: maxDepth ?? 7,
      completedSteps: 0,
      totalExpectedSteps: 0
    })
    // Clear activities and sources
    pipeline.del(activitiesKey)
    pipeline.del(sourcesKey)
    await pipeline.exec()
  } else {
    await redis.hmset(stateKey, {
      isActive: true,
      isCleared: false,
      clearedAt: null,
      currentDepth: 0,
      maxDepth: maxDepth ?? 7,
      completedSteps: 0,
      totalExpectedSteps: 0
    })
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

export async function addResearchSource(
  chatId: string,
  source: Omit<ResearchSource, 'id' | 'chatId' | 'createdAt'>
): Promise<void> {
  const redis = await getRedisClient()
  const sourcesKey = REDIS_KEYS.researchSources(chatId)
  const state = await getChatResearchState(chatId)

  if (state.isCleared) {
    return
  }

  const newSource: ResearchSource = {
    ...source,
    id: nanoid(),
    chatId,
    createdAt: new Date().toISOString()
  }

  await redis.zadd(sourcesKey, Date.now(), JSON.stringify(newSource))
}

export async function updateActivityStatus(
  chatId: string,
  activityId: string,
  status: ResearchActivity['status']
): Promise<void> {
  const redis = await getRedisClient()
  const activitiesKey = REDIS_KEYS.researchActivities(chatId)
  const activities = await redis.zrange(activitiesKey, 0, -1)

  if (!activities?.length) return

  const parsedActivities = activities.map(a => JSON.parse(a))
  const updatedActivities = parsedActivities.map(activity => 
    activity.id === activityId 
      ? { ...activity, status }
      : activity
  )

  const pipeline = redis.pipeline()
  pipeline.del(activitiesKey)
  
  for (const activity of updatedActivities) {
    pipeline.zadd(activitiesKey, Date.now(), JSON.stringify(activity))
  }
  
  await pipeline.exec()
}

export async function addUserPrompt(
  chatId: string,
  message: string
): Promise<string> {
  const activity: Omit<ResearchActivity, 'id' | 'chatId' | 'createdAt'> = {
    type: 'user_prompt',
    status: 'complete',
    message,
    timestamp: new Date().toISOString(),
  }

  const redis = await getRedisClient()
  const activitiesKey = REDIS_KEYS.researchActivities(chatId)
  const state = await getChatResearchState(chatId)

  if (state.isCleared) {
    return ''
  }

  const newActivity: ResearchActivity = {
    ...activity,
    id: nanoid(),
    chatId,
    createdAt: new Date().toISOString()
  }

  await redis.zadd(activitiesKey, Date.now(), JSON.stringify(newActivity))
  return newActivity.id
}

export async function addAIResponse(
  chatId: string,
  message: string,
  parentActivityId: string,
  metadata?: {
    aiModel?: string
    confidence?: number
    relatedTopics?: string[]
    sourceContext?: string
  }
): Promise<string> {
  const activity: Omit<ResearchActivity, 'id' | 'chatId' | 'createdAt'> = {
    type: 'ai_response',
    status: 'complete',
    message,
    timestamp: new Date().toISOString(),
    metadata,
    parentActivityId
  }

  const redis = await getRedisClient()
  const activitiesKey = REDIS_KEYS.researchActivities(chatId)
  const state = await getChatResearchState(chatId)

  if (state.isCleared) {
    return ''
  }

  const newActivity: ResearchActivity = {
    ...activity,
    id: nanoid(),
    chatId,
    createdAt: new Date().toISOString()
  }

  await redis.zadd(activitiesKey, Date.now(), JSON.stringify(newActivity))
  return newActivity.id
}

export async function addAISuggestion(
  chatId: string,
  message: string,
  metadata: {
    aiModel?: string
    confidence: number
    relatedTopics: string[]
    sourceContext?: string
    depth?: number
  }
): Promise<string> {
  const activity: Omit<ResearchActivity, 'id' | 'chatId' | 'createdAt'> = {
    type: 'ai_suggestion',
    status: 'complete',
    message,
    timestamp: new Date().toISOString(),
    depth: metadata.depth,
    metadata: {
      aiModel: metadata.aiModel,
      confidence: metadata.confidence,
      relatedTopics: metadata.relatedTopics,
      sourceContext: metadata.sourceContext
    }
  }

  const redis = await getRedisClient()
  const activitiesKey = REDIS_KEYS.researchActivities(chatId)
  const state = await getChatResearchState(chatId)

  if (state.isCleared) {
    return ''
  }

  const newActivity: ResearchActivity = {
    ...activity,
    id: nanoid(),
    chatId,
    createdAt: new Date().toISOString()
  }

  await redis.zadd(activitiesKey, Date.now(), JSON.stringify(newActivity))
  return newActivity.id
}

export async function addVisualizationUpdate(
  chatId: string,
  message: string,
  metadata: {
    type: 'path' | 'depth' | 'suggestion' | 'analysis'
    depthLevel?: number
    pathProgress?: number
    relatedActivities?: string[]
    interactionType?: 'auto' | 'user_triggered'
  }
): Promise<string> {
  const activity: Omit<ResearchActivity, 'id' | 'chatId' | 'createdAt'> = {
    type: 'visualization_update',
    status: 'complete',
    message,
    timestamp: new Date().toISOString(),
    metadata: {
      visualizationData: {
        ...metadata,
        displayTimestamp: new Date().toISOString()
      }
    }
  }

  const redis = await getRedisClient()
  const activitiesKey = REDIS_KEYS.researchActivities(chatId)
  const state = await getChatResearchState(chatId)

  if (state.isCleared) {
    return ''
  }

  const newActivity: ResearchActivity = {
    ...activity,
    id: nanoid(),
    chatId,
    createdAt: new Date().toISOString()
  }

  await redis.zadd(activitiesKey, Date.now(), JSON.stringify(newActivity))
  return newActivity.id
}

export async function addResearchPathProgress(
  chatId: string,
  message: string,
  metadata: {
    currentStep: number
    totalSteps: number
    pathType: string
    relatedActivities?: string[]
    depthLevel?: number
  }
): Promise<string> {
  const activity: Omit<ResearchActivity, 'id' | 'chatId' | 'createdAt'> = {
    type: 'research_path',
    status: 'complete',
    message,
    timestamp: new Date().toISOString(),
    depth: metadata.depthLevel,
    metadata: {
      researchPath: {
        currentStep: metadata.currentStep,
        totalSteps: metadata.totalSteps,
        pathType: metadata.pathType
      },
      previousActivities: metadata.relatedActivities
    }
  }

  const redis = await getRedisClient()
  const activitiesKey = REDIS_KEYS.researchActivities(chatId)
  const state = await getChatResearchState(chatId)

  if (state.isCleared) {
    return ''
  }

  const newActivity: ResearchActivity = {
    ...activity,
    id: nanoid(),
    chatId,
    createdAt: new Date().toISOString()
  }

  await redis.zadd(activitiesKey, Date.now(), JSON.stringify(newActivity))
  return newActivity.id
}

export async function getResearchTimeline(
  chatId: string,
  options?: {
    startTime?: string
    endTime?: string
    types?: ResearchActivityType[]
    includeVisualization?: boolean
  }
): Promise<ResearchActivity[]> {
  const redis = await getRedisClient()
  const activitiesKey = REDIS_KEYS.researchActivities(chatId)
  const activities = await redis.zrange(activitiesKey, 0, -1)

  if (!activities?.length) return []

  let parsedActivities = activities.map(a => JSON.parse(a)) as ResearchActivity[]

  // Apply filters if options are provided
  if (options) {
    if (options.startTime) {
      parsedActivities = parsedActivities.filter(a => a.timestamp >= options.startTime!)
    }
    if (options.endTime) {
      parsedActivities = parsedActivities.filter(a => a.timestamp <= options.endTime!)
    }
    if (options.types) {
      parsedActivities = parsedActivities.filter(a => options.types!.includes(a.type))
    }
    if (options.includeVisualization === false) {
      parsedActivities = parsedActivities.filter(a => a.type !== 'visualization_update')
    }
  }

  return parsedActivities
}

// Add a helper to get conversation thread
export async function getConversationThread(
  chatId: string,
  activityId: string
): Promise<ResearchActivity[]> {
  const redis = await getRedisClient()
  const activitiesKey = REDIS_KEYS.researchActivities(chatId)
  const activities = await redis.zrange(activitiesKey, 0, -1)

  if (!activities?.length) return []

  const parsedActivities = activities.map(a => JSON.parse(a)) as ResearchActivity[]
  const thread: ResearchActivity[] = []
  
  // Start with the given activity
  let currentActivity = parsedActivities.find(a => a.id === activityId)
  
  // Trace back through parent activities
  while (currentActivity) {
    thread.unshift(currentActivity)
    currentActivity = currentActivity.parentActivityId 
      ? parsedActivities.find(a => a.id === currentActivity?.parentActivityId)
      : undefined
  }

  return thread
} 