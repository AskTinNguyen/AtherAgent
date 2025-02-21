import { type ResearchConfiguration, type ResearchSessionConfig } from '@/lib/types/research-enhanced'

// Constants
const STORAGE_KEY_PREFIX = 'research_session'
const CONFIG_STORAGE_KEY = 'research_config'

interface StoredSession extends ResearchSessionConfig {
  config: ResearchConfiguration
  sources: string[] // URLs of sources used in this session
  metrics: {
    averageRelevance: number
    completionRate: number
    lastUpdated: string
  }
}

/**
 * ResearchManager handles session tracking, persistence, and recovery
 * for research sessions.
 */
export class ResearchManager {
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private static getSessionStorageKey(sessionId: string): string {
    return `${STORAGE_KEY_PREFIX}_${sessionId}`
  }

  /**
   * Creates a new research session
   */
  static createSession(config: ResearchConfiguration): ResearchSessionConfig {
    const sessionId = this.generateSessionId()
    const session: StoredSession = {
      sessionId,
      timestamp: Date.now(),
      status: 'running',
      config,
      sources: [],
      metrics: {
        averageRelevance: 0,
        completionRate: 0,
        lastUpdated: new Date().toISOString()
      }
    }

    // Store the session
    localStorage.setItem(
      this.getSessionStorageKey(sessionId),
      JSON.stringify(session)
    )

    // Store as last active session
    localStorage.setItem('last_active_session', sessionId)

    return {
      sessionId,
      timestamp: session.timestamp,
      status: session.status
    }
  }

  /**
   * Updates the status of a session
   */
  static updateSessionStatus(
    sessionId: string,
    status: ResearchSessionConfig['status']
  ): void {
    const storageKey = this.getSessionStorageKey(sessionId)
    const storedSession = localStorage.getItem(storageKey)
    
    if (!storedSession) {
      console.warn(`Session ${sessionId} not found`)
      return
    }

    const session: StoredSession = JSON.parse(storedSession)
    session.status = status
    
    localStorage.setItem(storageKey, JSON.stringify(session))
  }

  /**
   * Updates session metrics
   */
  static updateSessionMetrics(
    sessionId: string,
    metrics: {
      averageRelevance?: number
      completionRate?: number
    }
  ): void {
    const storageKey = this.getSessionStorageKey(sessionId)
    const storedSession = localStorage.getItem(storageKey)
    
    if (!storedSession) {
      console.warn(`Session ${sessionId} not found`)
      return
    }

    const session: StoredSession = JSON.parse(storedSession)
    session.metrics = {
      ...session.metrics,
      ...metrics,
      lastUpdated: new Date().toISOString()
    }
    
    localStorage.setItem(storageKey, JSON.stringify(session))
  }

  /**
   * Adds a source to the session
   */
  static addSessionSource(sessionId: string, sourceUrl: string): void {
    const storageKey = this.getSessionStorageKey(sessionId)
    const storedSession = localStorage.getItem(storageKey)
    
    if (!storedSession) {
      console.warn(`Session ${sessionId} not found`)
      return
    }

    const session: StoredSession = JSON.parse(storedSession)
    if (!session.sources.includes(sourceUrl)) {
      session.sources.push(sourceUrl)
      localStorage.setItem(storageKey, JSON.stringify(session))
    }
  }

  /**
   * Gets a stored session by ID
   */
  static getSession(sessionId: string): StoredSession | null {
    const storageKey = this.getSessionStorageKey(sessionId)
    const storedSession = localStorage.getItem(storageKey)
    
    if (!storedSession) {
      return null
    }

    return JSON.parse(storedSession)
  }

  /**
   * Gets the last active session
   */
  static getLastActiveSession(): StoredSession | null {
    const lastSessionId = localStorage.getItem('last_active_session')
    if (!lastSessionId) {
      return null
    }

    return this.getSession(lastSessionId)
  }

  /**
   * Stores research configuration
   */
  static storeConfiguration(config: ResearchConfiguration): void {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
  }

  /**
   * Gets stored research configuration
   */
  static getStoredConfiguration(): ResearchConfiguration | null {
    const storedConfig = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (!storedConfig) {
      return null
    }

    return JSON.parse(storedConfig)
  }

  /**
   * Lists all stored sessions
   */
  static listSessions(): StoredSession[] {
    const sessions: StoredSession[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const session = localStorage.getItem(key)
        if (session) {
          sessions.push(JSON.parse(session))
        }
      }
    }

    return sessions.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Cleans up old sessions (keeps last 10)
   */
  static cleanupOldSessions(): void {
    const sessions = this.listSessions()
    const sessionsToKeep = 10

    if (sessions.length > sessionsToKeep) {
      sessions
        .slice(sessionsToKeep)
        .forEach(session => {
          localStorage.removeItem(
            this.getSessionStorageKey(session.sessionId)
          )
        })
    }
  }
} 