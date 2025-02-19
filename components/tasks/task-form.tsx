'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CreateTaskInput } from '@/lib/types/tasks'

const taskFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['reminder', 'recurring', 'automated_query', 'ai_workflow', 'ai_execution'] as const),
  priority: z.enum(['low', 'medium', 'high'] as const),
  is_active: z.boolean().default(true),
  schedule_cron: z.string().optional(),
  schedule_interval: z.string().optional(),
  due_date: z.string().optional(),
  action_type: z.string().optional(),
  action_payload: z.any().optional(),
  parent_task_id: z.string().refine((val) => {
    if (!val) return true
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(val)
  }, "Must be a valid UUID or empty").optional()
}).refine((data) => {
  // If task is active, require at least one scheduling option
  if (data.is_active) {
    return !!(data.schedule_cron || data.schedule_interval || data.due_date)
  }
  return true
}, {
  message: "Active tasks must have either a cron schedule, interval, or due date",
  path: ["is_active"] // Show error on the is_active field
})

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => void
  initialData?: Partial<CreateTaskInput>
  isLoading?: boolean
}

export function TaskForm({ onSubmit, initialData, isLoading }: TaskFormProps) {
  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      type: initialData?.type || 'reminder',
      priority: initialData?.priority || 'medium',
      is_active: initialData?.is_active ?? true,
      schedule_cron: initialData?.schedule_cron || '',
      schedule_interval: initialData?.schedule_interval || '',
      due_date: initialData?.due_date || '',
      action_type: initialData?.action_type || '',
      action_payload: initialData?.action_payload,
      parent_task_id: initialData?.parent_task_id || ''
    },
  })

  const taskType = form.watch('type')

  const handleActionPayloadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const value = e.target.value
      const parsedValue = value ? JSON.parse(value) : {}
      form.setValue('action_payload', parsedValue)
    } catch (error) {
      // If JSON is invalid, store as string
      form.setValue('action_payload', { value: e.target.value })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Task name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Task description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                    <SelectItem value="automated_query">Automated Query</SelectItem>
                    <SelectItem value="ai_workflow">AI Workflow</SelectItem>
                    <SelectItem value="ai_execution">AI Execution</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Active tasks require a schedule (cron, interval, or due date)
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="schedule_cron"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cron Schedule</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="* * * * *" 
                    {...field} 
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Cron expression for scheduling (e.g. "0 9 * * *" for daily at 9 AM)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="schedule_interval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interval (ms)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="60000"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Interval in milliseconds (e.g. 3600000 for hourly)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input 
                  type="datetime-local" 
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                />
              </FormControl>
              <FormDescription>
                Set a due date for the task
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="action_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Action Type</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter action type"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parent_task_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Task ID (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter parent task UUID (optional)"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Leave empty or enter a valid UUID
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="action_payload"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action Payload (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter JSON payload"
                  className="min-h-[100px]"
                  value={field.value ? JSON.stringify(field.value, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const value = e.target.value
                      const parsedValue = value ? JSON.parse(value) : null
                      field.onChange(parsedValue)
                    } catch (error) {
                      // If JSON is invalid, store as null
                      field.onChange(null)
                    }
                  }}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription>
                Enter a valid JSON object
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Task'}
        </Button>
      </form>
    </Form>
  )
} 