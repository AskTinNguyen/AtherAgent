import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get total tasks count
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    // Get status distribution
    const { data: statusCounts } = await supabase
      .from('tasks')
      .select('status')
      .then(({ data }) => {
        const counts = data?.reduce((acc, { status }) => {
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        return {
          data: Object.entries(counts || {}).map(([status, count]) => ({
            status,
            count
          }))
        }
      })

    // Get last execution time
    const { data: lastExecution } = await supabase
      .from('task_runs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Calculate success rate
    const { data: executionStats } = await supabase
      .from('task_runs')
      .select('status')
      .then(({ data }) => {
        const total = data?.length || 0
        const successful = data?.filter(run => run.status === 'completed').length || 0
        return {
          data: {
            successRate: total > 0 ? successful / total : 0
          }
        }
      })

    return NextResponse.json({
      totalTasks: totalTasks || 0,
      statusCounts: statusCounts || [],
      lastExecutionTime: lastExecution?.created_at || null,
      successRate: executionStats?.successRate || 0
    })
  } catch (error) {
    console.error('Error fetching task metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task metrics' },
      { status: 500 }
    )
  }
} 