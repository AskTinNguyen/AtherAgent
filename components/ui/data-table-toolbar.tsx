'use client'

import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Task } from '@/lib/types/tasks'

interface DataTableToolbarProps {
  table: Table<Task>
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('type') && (
          <Select
            value={(table.getColumn('type')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('type')?.setFilterValue(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="recurring">Recurring</SelectItem>
              <SelectItem value="automated_query">Automated Query</SelectItem>
              <SelectItem value="ai_workflow">AI Workflow</SelectItem>
              <SelectItem value="ai_execution">AI Execution</SelectItem>
            </SelectContent>
          </Select>
        )}
        {table.getColumn('workflow_status') && (
          <Select
            value={(table.getColumn('workflow_status')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('workflow_status')?.setFilterValue(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )}
        {table.getColumn('priority') && (
          <Select
            value={(table.getColumn('priority')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('priority')?.setFilterValue(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
} 