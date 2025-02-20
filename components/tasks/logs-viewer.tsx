'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { TaskStatus } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useState } from 'react'

interface TaskLog {
  id: string
  taskId: string
  status: TaskStatus
  message: string
  timestamp: string
  metadata?: Record<string, any>
}

interface LogFilters {
  status?: TaskStatus
  taskId?: string
  search?: string
  limit: number
  page: number
}

interface PaginatedResponse {
  logs: TaskLog[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function LogsViewer() {
  const [filters, setFilters] = useState<LogFilters>({
    limit: 50,
    page: 1
  })

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['taskLogs', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.taskId) params.set('taskId', filters.taskId)
      if (filters.search) params.set('search', filters.search)
      params.set('limit', filters.limit.toString())
      params.set('page', filters.page.toString())

      const response = await fetch(`/api/tasks/logs?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch task logs')
      }
      return response.json()
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  })

  const clearFilters = () => {
    setFilters({
      limit: 50,
      page: 1
    })
  }

  if (isLoading) {
    return <div>Loading logs...</div>
  }

  const { logs, pagination } = data || { logs: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 1 } }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Task Execution Logs</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search logs..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="w-[200px]"
            />
            <Select
              value={filters.status}
              onValueChange={(value: TaskStatus) => 
                setFilters(prev => ({ ...prev, status: value, page: 1 }))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Task ID"
              value={filters.taskId || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, taskId: e.target.value, page: 1 }))}
              className="w-[150px]"
            />
            {(filters.status || filters.taskId || filters.search) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Task ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50%]">Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono">
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell className="font-mono">{log.taskId}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.status === 'completed'
                          ? 'success'
                          : log.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.message}</TableCell>
                </TableRow>
              ))}
              {!logs?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No logs available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 