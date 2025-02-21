import { createTask, deleteTask, getTasks, updateTask } from '@/lib/services/task-service'
import { type CreateTaskInput } from '@/lib/types/tasks'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const task = (await req.json()) as CreateTaskInput
    const data = await createTask(task)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/tasks:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const data = await getTasks()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/tasks:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const updates = await req.json()
    const task = await updateTask(id, updates)
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error in PUT /api/tasks:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    await deleteTask(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/tasks:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete task' },
      { status: 500 }
    )
  }
} 