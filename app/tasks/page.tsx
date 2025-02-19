'use client'

import { RequireAuth } from '@/components/auth/require-auth'
import { useSupabaseSession } from '@/components/providers/session-provider'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { TaskList } from '@/components/tasks/task-list'
import { Button } from '@/components/ui/button'
import { CreateTaskInput } from '@/lib/types/tasks'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function TasksPage() {
  const { data: nextAuthSession } = useSession()
  const [supabaseSession, setSupabaseSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkSupabaseSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Initial Supabase session:', session)
      setSupabaseSession(session)
      setIsLoading(false)
    }

    checkSupabaseSession()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session })
      if (event === 'SIGNED_IN') {
        // Fetch fresh session when signed in
        const { data: { session: freshSession } } = await supabase.auth.getSession()
        console.log('Fresh session after sign in:', freshSession)
        setSupabaseSession(freshSession)
      } else if (event === 'SIGNED_OUT') {
        setSupabaseSession(null)
      } else if (session) {
        setSupabaseSession(session)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[200px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  // If user is already authenticated with NextAuth, render content directly
  if (nextAuthSession) {
    return <TasksContent />
  }

  // If user is authenticated with Supabase, render content
  if (supabaseSession) {
    console.log('Rendering with Supabase session:', supabaseSession)
    return <TasksContent initialSession={supabaseSession} />
  }

  // Otherwise, use Supabase auth check
  return (
    <RequireAuth>
      <TasksContent />
    </RequireAuth>
  )
}

interface TasksContentProps {
  initialSession?: any
}

function TasksContent({ initialSession }: TasksContentProps) {
  const supabase = createClientComponentClient()
  const { data: nextAuthSession } = useSession()
  const supabaseSession = useSupabaseSession()
  const [currentSession, setCurrentSession] = useState<any>(null)

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      // First try NextAuth session
      if (nextAuthSession?.user) {
        setCurrentSession(nextAuthSession)
        return
      }

      // Then try Supabase session from context
      if (supabaseSession?.user) {
        setCurrentSession(supabaseSession)
        return
      }

      // Finally, try initialSession prop
      if (initialSession?.user) {
        setCurrentSession(initialSession)
        return
      }

      // If no session found, try to get a fresh one
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setCurrentSession(session)
      }
    }

    initSession()
  }, [initialSession, nextAuthSession, supabaseSession, supabase])

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', currentSession?.user?.id],
    queryFn: async () => {
      let userId: string | undefined

      // Try to get user ID from different session sources
      if (nextAuthSession?.user?.email) {
        userId = nextAuthSession.user.email
      } else if (currentSession?.user?.id) {
        userId = currentSession.user.id
      }

      if (!userId) {
        console.log('No user ID found in any session')
        return []
      }

      console.log('Fetching tasks for user:', userId)

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Failed to fetch tasks')
        throw error
      }
      
      return data || []
    },
    enabled: !!currentSession,
  })

  const handleTaskCreated = async (task: CreateTaskInput) => {
    try {
      let userId: string | undefined

      // Try to get user ID from different session sources
      if (nextAuthSession?.user?.email) {
        userId = nextAuthSession.user.email
      } else if (currentSession?.user?.id) {
        userId = currentSession.user.id
      }

      if (!userId) {
        throw new Error('No active session. Please sign in.')
      }

      console.log('Creating task with user ID:', userId)

      const now = new Date().toISOString()

      // Prepare task data with required fields
      const taskData = {
        name: task.name,
        description: task.description || '',
        type: task.type,
        owner_id: userId,
        workflow_status: 'open' as const,
        priority: task.priority,
        is_active: task.is_active,
        created_by: userId,
        created_at: now,
        updated_at: now,
        // Optional fields - only include if they have values
        ...(task.schedule_cron ? { schedule_cron: task.schedule_cron } : {}),
        ...(task.schedule_interval ? { schedule_interval: task.schedule_interval } : {}),
        ...(task.due_date ? { due_date: new Date(task.due_date).toISOString() } : {}),
        ...(task.action_type ? { action_type: task.action_type } : {}),
        ...(task.action_payload ? { action_payload: task.action_payload } : {}),
        ...(task.parent_task_id ? { parent_task_id: task.parent_task_id } : {})
      }

      console.log('Inserting task with data:', taskData)

      // First verify we can read tasks (to check auth)
      const { error: readError } = await supabase
        .from('tasks')
        .select('id')
        .limit(1)

      if (readError) {
        console.error('Auth check failed:', readError)
        throw new Error('Authentication check failed. Please sign out and sign in again.')
      }

      // Now try to insert the task
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select('*')
        .single()

      if (error) {
        console.error('Task creation error:', error)
        toast.error(`Failed to create task: ${error.message}`)
        throw error
      }

      if (!data) {
        throw new Error('No data returned from task creation')
      }

      toast.success('Task created successfully')
      return data
    } catch (error: any) {
      console.error('Error creating task:', error)
      toast.error(error.message || 'Failed to create task')
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tasks</h1>
        </div>
        <div className="bg-card rounded-lg p-6">
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/monitoring'}
          >
            Monitoring Dashboard
          </Button>
          <CreateTaskDialog onTaskCreated={handleTaskCreated} />
        </div>
      </div>
      <TaskList tasks={tasks} />
    </div>
  )
} 