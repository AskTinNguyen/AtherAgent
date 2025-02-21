export type TaskType = 'reminder' | 'recurring' | 'automated_query' | 'ai_workflow' | 'ai_execution'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface CreateTaskInput {
  natural_language_input: string
  name: string
  description?: string
  type: TaskType
  priority: TaskPriority
  is_active: boolean
  schedule_cron?: string
  schedule_interval?: string
  due_date?: string
  action_type?: string
  action_payload?: any
  parent_task_id?: string
}

export interface Task extends CreateTaskInput {
  id: string
  created_at: string
  updated_at: string
  last_run_at?: string
  next_run_at?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  error?: string
} 