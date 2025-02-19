export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type TaskType = 'reminder' | 'recurring' | 'automated_query' | 'ai_workflow' | 'ai_execution';

export interface Task {
  id: string;
  name: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  workflow_status: TaskStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  owner_id: string;
  
  // Scheduling
  schedule_cron?: string;
  schedule_interval?: string;
  due_date?: string;
  next_run_at?: string;
  last_run_at?: string;
  
  // Action
  action_type?: string;
  action_payload?: Record<string, any>;
  
  // Parent task
  parent_task_id?: string;
}

export interface TaskRun {
  run_id: string;
  task_id: string;
  status: TaskStatus;
  scheduled_time?: string;
  start_time?: string;
  end_time?: string;
  attempt: number;
  log?: string;
  error_message?: string;
  triggered_by?: string;
}

export interface TaskDependency {
  task_id: string;
  depends_on_task_id: string;
  dependency_type: 'success';
}

export interface TaskAssignee {
  task_id: string;
  assignee_id: string;
}

export interface TaskTag {
  task_id: string;
  tag_id: string;
}

export interface CreateTaskInput {
  name: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  is_active?: boolean;
  schedule_cron?: string;
  schedule_interval?: string;
  due_date?: string;
  action_type?: string;
  action_payload?: Record<string, any>;
  parent_task_id?: string;
}

export interface UpdateTaskInput extends Partial<Omit<CreateTaskInput, 'type'>> {
  id: string;
  workflow_status?: TaskStatus;
}

export interface TaskFilter {
  type?: TaskType;
  workflow_status?: TaskStatus;
  priority?: TaskPriority;
  is_active?: boolean;
  from_date?: string;
  to_date?: string;
  search?: string;
} 