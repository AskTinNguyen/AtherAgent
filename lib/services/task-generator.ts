import { StreamProtocolManager } from '@/lib/streaming/stream-protocol-manager'
import { CreateTaskInput, TaskPriority, TaskType } from '@/lib/types/tasks'
import { DataStreamWriter } from 'ai'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface ParsedTask {
  name: string
  description?: string
  type: TaskType
  priority: TaskPriority
  schedule?: {
    type: 'cron' | 'interval' | 'due_date'
    value: string
  }
  action?: {
    type: string
    payload?: any
  }
}

const TASK_GENERATION_PROMPT = `You are a task parser that converts natural language task descriptions into structured task data. Extract the following information:
- Task name (required, concise but descriptive)
- Description (optional, more detailed explanation)
- Task type (one of: reminder, recurring, automated_query, ai_workflow, ai_execution)
- Priority (one of: low, medium, high)
- Schedule (either cron expression, interval in ms, or due date)
- Action details (if applicable)

Respond in JSON format matching the ParsedTask type. Be smart about inferring missing details.

Example input: "Send a weekly report every Friday at 3 PM"
Example output:
{
  "name": "Weekly Report",
  "description": "Send the weekly report every Friday afternoon",
  "type": "recurring",
  "priority": "medium",
  "schedule": {
    "type": "cron",
    "value": "0 15 * * 5"
  }
}`

export async function generateTaskFromNaturalLanguage(
  naturalLanguageInput: string,
  dataStream: DataStreamWriter
): Promise<Partial<CreateTaskInput>> {
  const streamManager = new StreamProtocolManager(dataStream)

  try {
    // Start streaming the processing status
    streamManager.streamData({
      type: 'status',
      data: 'Analyzing task description...'
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: TASK_GENERATION_PROMPT },
        { role: 'user', content: naturalLanguageInput }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const parsedResponse = completion.choices[0].message.content
    if (!parsedResponse) {
      throw new Error('Failed to generate task details')
    }

    const parsedTask = JSON.parse(parsedResponse) as ParsedTask

    // Stream the generated task details
    streamManager.streamData({
      type: 'task_details',
      data: parsedTask
    })

    // Convert ParsedTask to CreateTaskInput
    const taskInput: Partial<CreateTaskInput> = {
      name: parsedTask.name,
      description: parsedTask.description,
      type: parsedTask.type,
      priority: parsedTask.priority,
      is_active: true
    }

    // Handle scheduling
    if (parsedTask.schedule) {
      switch (parsedTask.schedule.type) {
        case 'cron':
          taskInput.schedule_cron = parsedTask.schedule.value
          break
        case 'interval':
          taskInput.schedule_interval = parsedTask.schedule.value
          break
        case 'due_date':
          taskInput.due_date = parsedTask.schedule.value
          break
      }
    }

    // Handle action details
    if (parsedTask.action) {
      taskInput.action_type = parsedTask.action.type
      taskInput.action_payload = parsedTask.action.payload
    }

    // Stream completion status
    streamManager.streamData({
      type: 'status',
      data: 'Task details generated successfully'
    })

    streamManager.streamFinish()
    return taskInput

  } catch (error) {
    console.error('Error generating task:', error)
    streamManager.streamError(error as Error)
    throw error
  }
} 