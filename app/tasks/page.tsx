'use client'

import { useSupabase } from '@/components/providers/supabase-provider'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { TaskList } from '@/components/tasks/task-list'
import { Task } from '@/lib/types/tasks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TasksPage() {
  const supabase = useSupabase()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const checkAuthAndFetchTasks = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError || !session) {
        router.push('/login')
        return
      }

      // Fetch tasks
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })

      if (taskError) {
        console.error('Error fetching tasks:', taskError)
        return
      }

      setTasks(taskData || [])
      setIsLoading(false)
    }

    checkAuthAndFetchTasks()
  }, [supabase, router])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[200px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <CreateTaskDialog />
      </div>
      <TaskList tasks={tasks} />
    </div>
  )
} 