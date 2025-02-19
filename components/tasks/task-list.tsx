'use client'

import { ColumnDef, ColumnFiltersState, SortingState, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { DataTableToolbar } from '@/components/ui/data-table-toolbar'
import { Task, TaskPriority, TaskStatus, TaskType } from '@/lib/types/tasks'

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
}

const statusColors: Record<TaskStatus, string> = {
  open: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

const typeColors: Record<TaskType, string> = {
  reminder: 'bg-purple-100 text-purple-800',
  recurring: 'bg-indigo-100 text-indigo-800',
  automated_query: 'bg-blue-100 text-blue-800',
  ai_workflow: 'bg-green-100 text-green-800',
  ai_execution: 'bg-orange-100 text-orange-800',
}

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return (
        <Button
          variant="link"
          className="p-0 h-auto font-normal"
          onClick={() => window.location.href = `/tasks/${row.original.id}`}
        >
          {name}
        </Button>
      )
    },
    enableSorting: true,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as TaskType
      return (
        <Badge className={typeColors[type]} variant="outline">
          {type}
        </Badge>
      )
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => {
      const priority = row.getValue('priority') as TaskPriority
      return (
        <Badge className={priorityColors[priority]} variant="outline">
          {priority}
        </Badge>
      )
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as TaskStatus
      return (
        <Badge className={statusColors[status]} variant="outline">
          {status}
        </Badge>
      )
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'is_active',
    header: 'Active',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean
      return (
        <Badge
          className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
          variant="outline"
        >
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'next_run',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Next Run
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const nextRun = row.getValue('next_run') as string
      return nextRun ? new Date(nextRun).toLocaleString() : '-'
    },
    enableSorting: true,
  },
  {
    accessorKey: 'last_run',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Last Run
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const lastRun = row.getValue('last_run') as string
      return lastRun ? new Date(lastRun).toLocaleString() : '-'
    },
    enableSorting: true,
  },
]

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      sorting,
    },
  })

  return (
    <DataTable
      columns={columns}
      data={tasks}
      toolbar={<DataTableToolbar table={table} />}
    />
  )
} 