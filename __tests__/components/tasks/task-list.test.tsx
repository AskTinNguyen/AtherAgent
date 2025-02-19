import { createMockTasks } from '@/__tests__/helpers/task-helpers'
import { render, screen } from '@/__tests__/helpers/test-utils'
import { TaskList } from '@/components/tasks/task-list'
import { describe, expect, test } from '@jest/globals'
import '@testing-library/jest-dom'

describe('TaskList Component', () => {
  test('renders empty state when no tasks are provided', () => {
    render(<TaskList tasks={[]} />)
    expect(screen.getByText('No results.')).toBeInTheDocument()
  })

  test('renders tasks with correct columns', () => {
    const mockTasks = createMockTasks(3)
    render(<TaskList tasks={mockTasks} />)

    // Check if all columns are rendered
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Next Run')).toBeInTheDocument()
    expect(screen.getByText('Last Run')).toBeInTheDocument()

    // Check if task data is rendered
    mockTasks.forEach(task => {
      expect(screen.getByText(task.name)).toBeInTheDocument()
      expect(screen.getByText(task.type)).toBeInTheDocument()
      expect(screen.getByText(task.priority)).toBeInTheDocument()
      expect(screen.getByText(task.workflow_status)).toBeInTheDocument()
      expect(screen.getByText(task.is_active ? 'Active' : 'Inactive')).toBeInTheDocument()
    })
  })

  test('applies correct badge colors', () => {
    const mockTasks = createMockTasks(1, {
      priority: 'high',
      workflow_status: 'in_progress',
      type: 'ai_workflow',
    })
    render(<TaskList tasks={mockTasks} />)

    // Check priority badge
    const priorityBadge = screen.getByText('high')
    expect(priorityBadge).toHaveClass('bg-orange-100', 'text-orange-800')

    // Check status badge
    const statusBadge = screen.getByText('in_progress')
    expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800')

    // Check type badge
    const typeBadge = screen.getByText('ai_workflow')
    expect(typeBadge).toHaveClass('bg-indigo-100', 'text-indigo-800')
  })

  test('supports sorting by clicking column headers', async () => {
    const mockTasks = createMockTasks(3)
    const { user } = render(<TaskList tasks={mockTasks} />)

    // Click title column to sort
    const titleButton = screen.getByRole('button', { name: /title/i })
    await user.click(titleButton)

    // Get all task titles
    const taskTitles = screen.getAllByRole('cell', { name: /test task/i })
    const titles = taskTitles.map(cell => cell.textContent)

    // Check if titles are sorted
    const sortedTitles = [...titles].sort()
    expect(titles).toEqual(sortedTitles)
  })

  test('supports filtering through toolbar', async () => {
    const mockTasks = createMockTasks(3)
    const { user } = render(<TaskList tasks={mockTasks} />)

    // Open filter
    const filterButton = screen.getByRole('button', { name: /filter/i })
    await user.click(filterButton)

    // Filter by type
    const typeFilter = screen.getByLabelText(/type/i)
    await user.type(typeFilter, 'reminder')

    // Check if filtered results are shown
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeLessThan(mockTasks.length + 1) // +1 for header row
  })

  test('handles date formatting correctly', () => {
    const nextRun = new Date('2024-03-28T10:00:00Z')
    const lastRun = new Date('2024-03-27T15:30:00Z')
    
    const mockTasks = createMockTasks(1, {
      next_run_at: nextRun.toISOString(),
      last_run_at: lastRun.toISOString(),
    })
    
    render(<TaskList tasks={mockTasks} />)

    // Check if dates are formatted correctly
    expect(screen.getByText(nextRun.toLocaleString())).toBeInTheDocument()
    expect(screen.getByText(lastRun.toLocaleString())).toBeInTheDocument()
  })

  test('handles missing date values', () => {
    const mockTasks = createMockTasks(1, {
      next_run_at: undefined,
      last_run_at: undefined,
    })
    
    render(<TaskList tasks={mockTasks} />)

    // Check if placeholder is shown for missing dates
    const cells = screen.getAllByText('-')
    expect(cells).toHaveLength(2) // One for next_run and one for last_run
  })
}) 