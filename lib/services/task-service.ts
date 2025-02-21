import { type CreateTaskInput } from '@/lib/types/tasks'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

class TaskServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TaskServiceError'
  }
}

async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { expires?: Date }) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Handle cookie mutation error in read-only context
            console.warn('Cookie set attempted in read-only context:', error)
          }
        },
        remove(name: string, options: { expires?: Date }) {
          try {
            cookieStore.delete(name)
          } catch (error) {
            // Handle cookie mutation error in read-only context
            console.warn('Cookie removal attempted in read-only context:', error)
          }
        }
      }
    }
  )
}

export async function createTask(task: CreateTaskInput) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.error('Auth error:', authError)
      throw new TaskServiceError('Authentication error. Please try again.')
    }
    
    if (!session?.user) {
      throw new TaskServiceError('Authentication required. Please sign in.')
    }

    // Clean up timestamp fields - convert empty strings to null
    const cleanTask = {
      ...task,
      due_date: task.due_date || null,
      schedule_cron: task.schedule_cron || null,
      schedule_interval: task.schedule_interval || null,
      action_payload: task.action_payload || null,
      parent_task_id: task.parent_task_id || null
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        name: cleanTask.name,
        description: cleanTask.description,
        type: cleanTask.type,
        priority: cleanTask.priority,
        is_active: cleanTask.is_active,
        schedule_cron: cleanTask.schedule_cron,
        schedule_interval: cleanTask.schedule_interval,
        due_date: cleanTask.due_date,
        action_type: cleanTask.action_type,
        action_payload: cleanTask.action_payload,
        parent_task_id: cleanTask.parent_task_id,
        owner_id: session.user.id,
        created_by: session.user.id,
        workflow_status: 'pending', // Default status
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      throw new TaskServiceError(error.message)
    }

    return data
  } catch (error) {
    console.error('Error in createTask:', error)
    throw error instanceof TaskServiceError ? error : new TaskServiceError('Failed to create task')
  }
}

export async function getTasks() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      throw new TaskServiceError('Authentication required. Please sign in.')
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      throw new TaskServiceError(error.message)
    }

    return data
  } catch (error) {
    console.error('Error in getTasks:', error)
    throw error instanceof TaskServiceError ? error : new TaskServiceError('Failed to fetch tasks')
  }
}

export async function getTask(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      throw new TaskServiceError('Authentication required. Please sign in.')
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('owner_id', session.user.id)
      .single()

    if (error) {
      console.error('Error fetching task:', error)
      throw new TaskServiceError(error.message)
    }

    return data
  } catch (error) {
    console.error('Error in getTask:', error)
    throw error instanceof TaskServiceError ? error : new TaskServiceError('Failed to fetch task')
  }
}

export async function updateTask(id: string, updates: Partial<CreateTaskInput>) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      throw new TaskServiceError('Authentication required. Please sign in.')
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('owner_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      throw new TaskServiceError(error.message)
    }

    return data
  } catch (error) {
    console.error('Error in updateTask:', error)
    throw error instanceof TaskServiceError ? error : new TaskServiceError('Failed to update task')
  }
}

export async function deleteTask(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      throw new TaskServiceError('Authentication required. Please sign in.')
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('owner_id', session.user.id)

    if (error) {
      console.error('Error deleting task:', error)
      throw new TaskServiceError(error.message)
    }
  } catch (error) {
    console.error('Error in deleteTask:', error)
    throw error instanceof TaskServiceError ? error : new TaskServiceError('Failed to delete task')
  }
} 