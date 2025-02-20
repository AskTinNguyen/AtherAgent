'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreateTaskInput } from '@/lib/types/tasks'
import { useState } from 'react'
import { toast } from 'sonner'
import { TaskForm } from './task-form'

interface CreateTaskDialogProps {
  onTaskCreated?: (task: CreateTaskInput) => Promise<any>
}

export function CreateTaskDialog({ onTaskCreated }: CreateTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateTaskInput) => {
    try {
      setIsLoading(true)
      const result = await onTaskCreated?.(data)
      if (result) {
        toast.success('Task created successfully')
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Failed to create task:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to create task')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task with scheduling and execution settings.
          </DialogDescription>
        </DialogHeader>
        <TaskForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  )
} 