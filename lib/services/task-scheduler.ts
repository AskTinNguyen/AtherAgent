import { Database } from '@/lib/types/database'
import { createClient } from '@supabase/supabase-js'
import cronParser from 'cron-parser'
import cron from 'node-cron'
import { taskExecutor } from './task-executor'

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export type TaskSchedule = {
  taskId: string
  cronExpression?: string
  intervalMs?: number
  nextRunAt?: Date
  isActive: boolean
}

interface Task {
  id: string
  type: string
  schedule_cron: string | null
  schedule_interval: string | null
  is_active: boolean
  action_type: string | null
  action_payload: any
}

class TaskScheduler {
  private schedules: Map<string, TaskSchedule>
  private cronJobs: Map<string, cron.ScheduledTask>
  private intervalJobs: Map<string, NodeJS.Timeout>

  constructor() {
    this.schedules = new Map()
    this.cronJobs = new Map()
    this.intervalJobs = new Map()
  }

  async initialize() {
    try {
      // Load all active tasks from database
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .not('schedule_cron', 'is', null)
        .not('schedule_interval', 'is', null)

      if (error) throw error

      // Schedule each task
      tasks?.forEach((task: Task) => {
        if (task.schedule_cron) {
          this.scheduleCronTask(task.id, task.schedule_cron)
        } else if (task.schedule_interval) {
          this.scheduleIntervalTask(task.id, parseInt(task.schedule_interval))
        }
      })

      // Listen for task updates
      this.setupRealtimeListeners()
    } catch (error) {
      console.error('Failed to initialize task scheduler:', error)
    }
  }

  private setupRealtimeListeners() {
    const channel = supabase
      .channel('task-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        async (payload: any) => {
          const task = payload.new as Task
          
          // Handle task updates
          if (payload.eventType === 'UPDATE') {
            if (!task.is_active) {
              this.unscheduleTask(task.id)
            } else if (task.schedule_cron) {
              this.scheduleCronTask(task.id, task.schedule_cron)
            } else if (task.schedule_interval) {
              this.scheduleIntervalTask(task.id, parseInt(task.schedule_interval))
            }
          }
          // Handle task deletions
          else if (payload.eventType === 'DELETE') {
            this.unscheduleTask(payload.old.id)
          }
        }
      )
      .subscribe()
  }

  private scheduleCronTask(taskId: string, cronExpression: string) {
    try {
      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`)
      }

      // Unschedule existing job if any
      this.unscheduleTask(taskId)

      // Create new cron job
      const job = cron.schedule(cronExpression, async () => {
        await this.executeTask(taskId)
      })

      // Store job reference
      this.cronJobs.set(taskId, job)
      this.schedules.set(taskId, {
        taskId,
        cronExpression,
        isActive: true,
        nextRunAt: cronParser.parseExpression(cronExpression).next().toDate()
      })
    } catch (error) {
      console.error(`Failed to schedule cron task ${taskId}:`, error)
    }
  }

  private scheduleIntervalTask(taskId: string, intervalMs: number) {
    try {
      // Unschedule existing job if any
      this.unscheduleTask(taskId)

      // Create new interval
      const interval = setInterval(async () => {
        await this.executeTask(taskId)
      }, intervalMs)

      // Store interval reference
      this.intervalJobs.set(taskId, interval)
      this.schedules.set(taskId, {
        taskId,
        intervalMs,
        isActive: true,
        nextRunAt: new Date(Date.now() + intervalMs)
      })
    } catch (error) {
      console.error(`Failed to schedule interval task ${taskId}:`, error)
    }
  }

  private async executeTask(taskId: string) {
    try {
      // Get task details
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (taskError) throw taskError
      if (!task) throw new Error(`Task not found: ${taskId}`)

      // Create task run record
      const { data: taskRun, error: runError } = await supabase
        .from('task_runs')
        .insert({
          task_id: taskId,
          status: 'pending',
          triggered_by: 'scheduler',
          attempt: 1
        })
        .select()
        .single()

      if (runError) throw runError

      // Execute task using task executor
      await taskExecutor.execute({
        taskId,
        runId: taskRun.run_id,
        type: task.type,
        actionType: task.action_type,
        actionPayload: task.action_payload
      })

      // Update next run time in schedule
      const schedule = this.schedules.get(taskId)
      if (schedule?.cronExpression) {
        schedule.nextRunAt = cronParser.parseExpression(schedule.cronExpression).next().toDate()
      } else if (schedule?.intervalMs) {
        schedule.nextRunAt = new Date(Date.now() + schedule.intervalMs)
      }
    } catch (error) {
      console.error(`Failed to execute task ${taskId}:`, error)
      // Error handling is done by the task executor
    }
  }

  private unscheduleTask(taskId: string) {
    // Stop and remove cron job if exists
    const cronJob = this.cronJobs.get(taskId)
    if (cronJob) {
      cronJob.stop()
      this.cronJobs.delete(taskId)
    }

    // Clear and remove interval if exists
    const interval = this.intervalJobs.get(taskId)
    if (interval) {
      clearInterval(interval)
      this.intervalJobs.delete(taskId)
    }

    // Remove from schedules
    this.schedules.delete(taskId)
  }

  getTaskSchedule(taskId: string): TaskSchedule | undefined {
    return this.schedules.get(taskId)
  }

  getAllSchedules(): TaskSchedule[] {
    return Array.from(this.schedules.values())
  }
}

// Create singleton instance
export const taskScheduler = new TaskScheduler()

// Initialize scheduler on server start
if (process.env.NODE_ENV !== 'test') {
  taskScheduler.initialize().catch(console.error)
} 