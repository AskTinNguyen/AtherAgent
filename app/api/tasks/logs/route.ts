import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({
      cookies: () => cookies()
    })
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const status = searchParams.get('status')
    const taskId = searchParams.get('taskId')
    const search = searchParams.get('search')

    // First, get the count using a separate query
    let countQuery = supabase
      .from('task_runs')
      .select('*', { count: 'exact', head: true })

    // Apply the same filters to both queries
    if (status) {
      countQuery = countQuery.eq('status', status)
    }
    if (taskId) {
      countQuery = countQuery.eq('task_id', taskId)
    }
    if (search) {
      countQuery = countQuery.or(`message.ilike.%${search}%,task_id.ilike.%${search}%`)
    }

    // Get the count
    const { count, error: countError } = await countQuery

    if (countError) {
      throw countError
    }

    // Now get the actual data with pagination
    let dataQuery = supabase
      .from('task_runs')
      .select('run_id, task_id, status, message, created_at, metadata')
      .order('created_at', { ascending: false })

    // Apply the same filters
    if (status) {
      dataQuery = dataQuery.eq('status', status)
    }
    if (taskId) {
      dataQuery = dataQuery.eq('task_id', taskId)
    }
    if (search) {
      dataQuery = dataQuery.or(`message.ilike.%${search}%,task_id.ilike.%${search}%`)
    }

    // Apply pagination
    const { data: logs, error: dataError } = await dataQuery
      .range((page - 1) * limit, page * limit - 1)

    if (dataError) {
      throw dataError
    }

    // Transform the logs to match our frontend interface
    const transformedLogs = logs.map(log => ({
      id: log.run_id,
      taskId: log.task_id,
      status: log.status,
      message: log.message,
      timestamp: log.created_at,
      metadata: log.metadata
    }))

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching task logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task logs' },
      { status: 500 }
    )
  }
} 