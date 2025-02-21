'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, type ControllerRenderProps } from 'react-hook-form'
import * as z from 'zod'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { useToast } from '@/components/ui/use-toast'
import { type CreateTaskInput } from '@/lib/types/tasks'
import { Loader2 } from 'lucide-react'

const taskFormSchema = z.object({
  natural_language_input: z.string().min(1, 'Please describe your task'),
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

type TaskFormData = z.infer<typeof taskFormSchema>

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => void
  initialData?: Partial<CreateTaskInput>
  isLoading?: boolean
}

export function TaskForm({ onSubmit, initialData, isLoading }: TaskFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [jsonPreview, setJsonPreview] = useState<string>('')
  const { toast } = useToast()

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      natural_language_input: '',
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

  const handleNaturalLanguageGenerate = async () => {
    const naturalLanguageInput = form.getValues('natural_language_input')
    if (!naturalLanguageInput) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: naturalLanguageInput })
      })

      if (!response.ok) {
        throw new Error('Failed to generate task details')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream available')
      }

      let currentStatus = ''
      let buffer = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        buffer += chunk
        const lines = buffer.split('\n')
        
        // Keep the last partial line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines.filter(Boolean)) {
          try {
            const [type, ...contentParts] = line.split(':')
            // Rejoin content parts in case the content itself contained colons
            const content = contentParts.join(':')
            
            if (!content) {
              console.warn('Empty content in stream line:', line)
              continue
            }

            let data
            try {
              data = JSON.parse(content)
            } catch (parseError) {
              console.error('Error parsing JSON content:', content, parseError)
              continue
            }

            switch (type) {
              case '2': // Data message
                if (data.type === 'status') {
                  currentStatus = data.data
                  toast({
                    description: data.data,
                    duration: 2000
                  })
                } else if (data.type === 'task_details') {
                  // Update form with generated task details
                  Object.entries(data.data).forEach(([key, value]) => {
                    if (key === 'schedule') {
                      const schedule = value as { type: string; value: string }
                      switch (schedule.type) {
                        case 'cron':
                          form.setValue('schedule_cron', schedule.value)
                          break
                        case 'interval':
                          form.setValue('schedule_interval', schedule.value)
                          break
                        case 'due_date':
                          form.setValue('due_date', schedule.value)
                          break
                      }
                    } else if (key === 'action') {
                      const action = value as { type: string; payload?: any }
                      form.setValue('action_type', action.type)
                      form.setValue('action_payload', action.payload)
                    } else {
                      form.setValue(key as keyof TaskFormData, value as any)
                    }
                  })
                  updateJsonPreview()
                }
                break

              case '3': // Error message
                toast({
                  variant: 'destructive',
                  title: 'Error',
                  description: typeof data === 'string' ? data : JSON.stringify(data),
                  duration: 3000
                })
                break
            }
          } catch (lineError) {
            console.error('Error processing stream line:', line, lineError)
          }
        }
      }

      toast({
        title: 'Success',
        description: 'Task details generated successfully',
        duration: 3000
      })

    } catch (error) {
      console.error('Error generating task:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate task details',
        duration: 3000
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const updateJsonPreview = () => {
    const formData = form.getValues()
    setJsonPreview(JSON.stringify(formData, null, 2))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Natural Language Input Section */}
        <Card className="p-6">
          <FormField
            control={form.control}
            name="natural_language_input"
            render={({ field }: { field: ControllerRenderProps<TaskFormData, 'natural_language_input'> }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">Tell me what you want to do</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="e.g., Send a weekly report every Friday at 3 PM"
                      className="min-h-[100px] text-lg"
                      {...field}
                    />
                    <Button
                      type="button"
                      onClick={handleNaturalLanguageGenerate}
                      disabled={isGenerating || !field.value}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Task Details...
                        </>
                      ) : (
                        'Generate Task Details'
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  Describe your task in natural language and let AI help you set it up
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Task Details Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="basic-details">
            <AccordionTrigger>Basic Details</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }: { field: ControllerRenderProps<TaskFormData, 'name'> }) => (
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
                  render={({ field }: { field: ControllerRenderProps<TaskFormData, 'description'> }) => (
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
                    render={({ field }: { field: ControllerRenderProps<TaskFormData, 'type'> }) => (
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
                    render={({ field }: { field: ControllerRenderProps<TaskFormData, 'priority'> }) => (
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
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="schedule">
            <AccordionTrigger>Schedule Details</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }: { field: ControllerRenderProps<TaskFormData, 'is_active'> }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Active tasks require a schedule
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
                    render={({ field }: { field: ControllerRenderProps<TaskFormData, 'schedule_cron'> }) => (
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
                          Cron expression (e.g. "0 9 * * *" for daily at 9 AM)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="schedule_interval"
                    render={({ field }: { field: ControllerRenderProps<TaskFormData, 'schedule_interval'> }) => (
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
                          Interval in milliseconds
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }: { field: ControllerRenderProps<TaskFormData, 'due_date'> }) => (
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="advanced">
            <AccordionTrigger>Advanced Options</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="action_type"
                    render={({ field }: { field: ControllerRenderProps<TaskFormData, 'action_type'> }) => (
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
                    render={({ field }: { field: ControllerRenderProps<TaskFormData, 'parent_task_id'> }) => (
                      <FormItem>
                        <FormLabel>Parent Task ID</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter parent task UUID"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional UUID of parent task
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="action_payload"
                  render={({ field }: { field: ControllerRenderProps<TaskFormData, 'action_payload'> }) => (
                    <FormItem>
                      <FormLabel>Action Payload (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter JSON payload"
                          className="min-h-[100px] font-mono"
                          value={field.value ? JSON.stringify(field.value, null, 2) : ''}
                          onChange={(e) => {
                            try {
                              const value = e.target.value
                              const parsedValue = value ? JSON.parse(value) : null
                              field.onChange(parsedValue)
                              updateJsonPreview()
                            } catch (error) {
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
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="preview">
            <AccordionTrigger>JSON Preview</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-secondary p-4 rounded-lg overflow-auto max-h-[400px] text-sm">
                {jsonPreview || 'No preview available'}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit" className="w-full" disabled={isLoading || isGenerating}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Task...
            </>
          ) : (
            'Save Task'
          )}
        </Button>
      </form>
    </Form>
  )
} 