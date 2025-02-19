import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { format, parseISO, startOfDay, subDays } from 'date-fns'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Parse date range or use default (last 7 days)
    const fromDate = searchParams.get('from')
      ? startOfDay(parseISO(searchParams.get('from') || ''))
      : subDays(startOfDay(new Date()), 7)
    
    const toDate = searchParams.get('to')
      ? startOfDay(parseISO(searchParams.get('to') || ''))
      : startOfDay(new Date())

    // Get task runs within date range
    const { data: taskRuns } = await supabase
      .from('task_runs')
      .select('created_at, status')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())

    // Generate daily metrics for each day in the range
    const dailyMetrics = []
    let currentDate = fromDate
    while (currentDate <= toDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const dayRuns = taskRuns?.filter(run => 
        format(new Date(run.created_at), 'yyyy-MM-dd') === dateStr
      ) || []

      dailyMetrics.push({
        date: dateStr,
        completed: dayRuns.filter(run => run.status === 'completed').length,
        failed: dayRuns.filter(run => run.status === 'failed').length,
        total: dayRuns.length
      })

      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
    }

    // Get overall status distribution
    const statusDistribution = taskRuns?.reduce((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statusCounts = Object.entries(statusDistribution || {}).map(([status, count]) => ({
      status,
      count
    }))

    return NextResponse.json({
      dailyMetrics,
      statusDistribution: statusCounts
    })
  } catch (error) {
    console.error('Error fetching task trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task trends' },
      { status: 500 }
    )
  }
} 