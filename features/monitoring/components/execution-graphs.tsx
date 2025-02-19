'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { TaskStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { format, startOfDay, subDays } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'

interface ExecutionMetric {
  date: string
  completed: number
  failed: number
  total: number
}

interface ExecutionTrends {
  dailyMetrics: ExecutionMetric[]
  statusDistribution: {
    status: TaskStatus
    count: number
  }[]
}

interface DateRange {
  from: Date
  to: Date
}

export function ExecutionGraphs() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(startOfDay(new Date()), 7),
    to: startOfDay(new Date())
  })

  const { data: trends, isLoading } = useQuery<ExecutionTrends>({
    queryKey: ['executionTrends', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      })
      const response = await fetch(`/api/tasks/trends?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch execution trends')
      }
      return response.json()
    },
    refetchInterval: 300000 // Refresh every 5 minutes
  })

  if (isLoading) {
    return <div>Loading trends...</div>
  }

  const chartData = trends?.dailyMetrics || []

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Task Execution Trends</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{
                  from: dateRange?.from,
                  to: dateRange?.to
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({
                      from: startOfDay(range.from),
                      to: startOfDay(range.to)
                    })
                  }
                }}
                numberOfMonths={2}
                disabled={(date) => date > new Date() || date < subDays(new Date(), 90)}
              />
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(date: string) => format(new Date(date), 'MMM d')}
                />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                  labelFormatter={(label: string) => format(new Date(label), 'MMMM d, yyyy')}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stroke="#EF4444"
                  fillOpacity={1}
                  fill="url(#colorFailed)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 