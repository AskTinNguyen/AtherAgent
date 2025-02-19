import { Database } from '@/lib/types/database'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Initialize clients
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface TaskExecutionContext {
  taskId: string
  runId: string
  type: string
  actionType?: string
  actionPayload?: any
}

export class TaskExecutor {
  async execute(context: TaskExecutionContext): Promise<void> {
    try {
      // Update task run status to running
      await this.updateTaskRunStatus(context.runId, 'running')

      // Execute based on task type
      switch (context.type) {
        case 'reminder':
          await this.executeReminder(context)
          break
        case 'recurring':
          await this.executeRecurring(context)
          break
        case 'automated_query':
          await this.executeAutomatedQuery(context)
          break
        case 'ai_workflow':
          await this.executeAIWorkflow(context)
          break
        case 'ai_execution':
          await this.executeAITask(context)
          break
        default:
          throw new Error(`Unsupported task type: ${context.type}`)
      }

      // Update task run status to completed
      await this.updateTaskRunStatus(context.runId, 'completed')
    } catch (error) {
      console.error(`Task execution failed:`, error)
      // Update task run with error
      if (error instanceof Error) {
        await this.updateTaskRunStatus(context.runId, 'failed', error.message)
      }
      throw error
    }
  }

  private async executeReminder(context: TaskExecutionContext) {
    // TODO: Implement reminder notification logic
    // For now, just log it
    console.log(`Executing reminder task: ${context.taskId}`)
  }

  private async executeRecurring(context: TaskExecutionContext) {
    // Execute the recurring action based on actionType
    switch (context.actionType) {
      case 'database_query':
        await this.executeDatabaseQuery(context.actionPayload)
        break
      case 'api_call':
        await this.executeAPICall(context.actionPayload)
        break
      default:
        throw new Error(`Unsupported action type: ${context.actionType}`)
    }
  }

  private async executeAutomatedQuery(context: TaskExecutionContext) {
    if (!context.actionPayload?.query) {
      throw new Error('Query not provided for automated query task')
    }

    const { query, parameters } = context.actionPayload
    
    // Execute the query
    const { data, error } = await supabase.rpc('execute_query', {
      query_text: query,
      query_params: parameters
    })

    if (error) throw error

    // Store query results
    await this.storeTaskResults(context.runId, data)
  }

  private async executeAIWorkflow(context: TaskExecutionContext) {
    if (!context.actionPayload?.prompt) {
      throw new Error('Prompt not provided for AI workflow task')
    }

    // Get AI to plan and execute the workflow
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a workflow orchestrator. Plan and execute the given task step by step."
        },
        {
          role: "user",
          content: context.actionPayload.prompt
        }
      ]
    })

    const plan = completion.choices[0].message.content

    // Store the workflow plan
    await this.storeTaskResults(context.runId, { plan })

    // TODO: Execute the planned steps
    // For now, just store the plan
  }

  private async executeAITask(context: TaskExecutionContext) {
    if (!context.actionPayload?.prompt) {
      throw new Error('Prompt not provided for AI task')
    }

    // Execute the AI task
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a task executor. Execute the given task and provide the results."
        },
        {
          role: "user",
          content: context.actionPayload.prompt
        }
      ]
    })

    const result = completion.choices[0].message.content

    // Store the results
    await this.storeTaskResults(context.runId, { result })
  }

  private async executeDatabaseQuery(payload: any) {
    const { query, parameters } = payload
    const { error } = await supabase.rpc('execute_query', {
      query_text: query,
      query_params: parameters
    })
    if (error) throw error
  }

  private async executeAPICall(payload: any) {
    const { url, method, headers, body } = payload
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body)
    })
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }
  }

  private async updateTaskRunStatus(
    runId: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
    errorMessage?: string
  ) {
    const updates: any = {
      status,
      ...(status === 'running' ? { start_time: new Date().toISOString() } : {}),
      ...(status === 'completed' || status === 'failed'
        ? { end_time: new Date().toISOString() }
        : {}),
      ...(errorMessage ? { error_message: errorMessage } : {})
    }

    const { error } = await supabase
      .from('task_runs')
      .update(updates)
      .eq('run_id', runId)

    if (error) throw error
  }

  private async storeTaskResults(runId: string, results: any) {
    const { error } = await supabase
      .from('task_runs')
      .update({
        results: results
      })
      .eq('run_id', runId)

    if (error) throw error
  }
}

// Create singleton instance
export const taskExecutor = new TaskExecutor() 