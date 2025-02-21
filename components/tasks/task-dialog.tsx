'use client'

import { useAuth } from '@/components/providers/supabase-provider'
import { TaskForm } from '@/components/tasks/task-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { CreateTaskInput } from '@/lib/types/tasks'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ClipboardList, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export function TaskDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user, isLoading, setShowSignInModal } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session?.user) {
        setShowSignInModal(true)
      }
    }
    
    if (isOpen) {
      checkAuth()
    }
  }, [isOpen, setShowSignInModal, supabase.auth])

  const handleSubmit = async (data: CreateTaskInput) => {
    if (!user) {
      setShowSignInModal(true)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }

      const task = await response.json()
      
      toast({
        title: 'Success',
        description: 'Task created successfully',
        duration: 3000
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Error creating task:', error)
      if (error instanceof Error && error.message.includes('Authentication required')) {
        setShowSignInModal(true)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to create task',
          duration: 3000
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" className="w-9 px-0" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="sr-only">Loading...</span>
      </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-9 px-0"
          onClick={() => {
            if (!user) {
              setShowSignInModal(true)
              return
            }
            setIsOpen(true)
          }}
        >
          <ClipboardList className="h-5 w-5" />
          <span className="sr-only">Tasks</span>
        </Button>
      </DialogTrigger>
      {user && (
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task using natural language or fill in the details manually.
            </DialogDescription>
          </DialogHeader>
          <TaskForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        </DialogContent>
      )}
    </Dialog>
  )
} 