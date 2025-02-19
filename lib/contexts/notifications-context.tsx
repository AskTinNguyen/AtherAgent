'use client'

import { TaskStatus } from '@/lib/types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface TaskStatusUpdate {
  taskId: string
  oldStatus: TaskStatus
  newStatus: TaskStatus
  message: string
  timestamp: string
}

interface NotificationsContextType {
  notifications: TaskStatusUpdate[]
  markAsRead: (taskId: string) => void
  clearAll: () => void
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  markAsRead: () => {},
  clearAll: () => {}
})

export function NotificationsProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [notifications, setNotifications] = useState<TaskStatusUpdate[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Subscribe to task status changes
    const channel = supabase
      .channel('task-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: 'status=neq.previous_status'
        },
        (payload) => {
          const { new: newData, old: oldData } = payload

          const update: TaskStatusUpdate = {
            taskId: newData.id,
            oldStatus: oldData.status,
            newStatus: newData.status,
            message: `Task ${newData.id} changed from ${oldData.status} to ${newData.status}`,
            timestamp: new Date().toISOString()
          }

          setNotifications(prev => [update, ...prev])

          // Show toast notification
          toast(update.message, {
            description: new Date(update.timestamp).toLocaleString(),
            action: {
              label: "View",
              onClick: () => window.location.href = `/tasks/${update.taskId}`
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const markAsRead = (taskId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.taskId !== taskId)
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        markAsRead,
        clearAll
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext) 