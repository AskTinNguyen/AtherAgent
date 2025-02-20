'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskStatus } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'

interface TaskStatusCount {
  status: TaskStatus
  count: number
}

interface TaskMetrics {
  totalTasks: number
  statusCounts: TaskStatusCount[]
  lastExecutionTime: string | null
  successRate: number
}

export function StatusCards() {
  const { data: metrics, isLoading } = useQuery<TaskMetrics>({
    queryKey: ['taskMetrics'],
    queryFn: async () => {
      const response = await fetch('/api/tasks/metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch task metrics')
      }
      return response.json()
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  if (isLoading) {
    return <div>Loading metrics...</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics?.totalTasks || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.successRate ? `${Math.round(metrics.successRate * 100)}%` : 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {metrics?.statusCounts.map((status) => (
              <Badge key={status.status} variant="outline">
                {status.status}: {status.count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Execution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.lastExecutionTime
              ? formatDistanceToNow(new Date(metrics.lastExecutionTime), { addSuffix: true })
              : 'No executions yet'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 