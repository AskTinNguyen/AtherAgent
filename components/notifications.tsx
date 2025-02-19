'use client'

import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useNotifications } from '@/lib/contexts/notifications-context'
import { formatDistanceToNow } from 'date-fns'
import { Bell } from 'lucide-react'
import { Toaster } from 'sonner'

export function Notifications() {
  const { notifications, markAsRead, clearAll } = useNotifications()
  const hasUnread = notifications.length > 0

  return (
    <>
      <Toaster />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                {notifications.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between border-b p-3">
            <h4 className="font-medium">Notifications</h4>
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-auto px-2 py-1 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              <div className="grid gap-1">
                {notifications.map((notification) => (
                  <button
                    key={`${notification.taskId}-${notification.timestamp}`}
                    className="flex flex-col gap-1 border-b p-3 text-left hover:bg-muted/50"
                    onClick={() => {
                      markAsRead(notification.taskId)
                      window.location.href = `/tasks/${notification.taskId}`
                    }}
                  >
                    <div className="text-sm font-medium">{notification.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
} 