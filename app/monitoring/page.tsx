'use client'

import { ExecutionGraphs } from '@/features/monitoring/components/execution-graphs'
import { LogsViewer } from '@/features/monitoring/components/logs-viewer'
import { StatusCards } from '@/features/monitoring/components/status-cards'

export default function MonitoringPage() {
  return (
    <div className="container space-y-8 py-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Task Monitoring</h2>
          <p className="text-muted-foreground">
            Monitor task execution status, trends, and performance metrics
          </p>
        </div>
      </div>
      <StatusCards />
      <ExecutionGraphs />
      <LogsViewer />
    </div>
  )
} 