import { Task } from '@/lib/types/tasks';

export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Task',
  description: 'Test Description',
  type: 'reminder',
  priority: 'medium',
  workflow_status: 'in_progress',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner_id: '123e4567-e89b-12d3-a456-426614174000',
  ...overrides,
});

export const createMockTasks = (count: number, baseOverrides: Partial<Task> = {}): Task[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockTask({
      id: `123e4567-e89b-12d3-a456-42661417400${index}`,
      name: `Test Task ${index + 1}`,
      ...baseOverrides,
    })
  );
};

export const mockTaskResponse = (task: Task) => ({
  data: task,
  error: null,
  status: 200,
  statusText: 'OK',
  count: 1,
});

export const mockTasksResponse = (tasks: Task[]) => ({
  data: tasks,
  error: null,
  status: 200,
  statusText: 'OK',
  count: tasks.length,
});

export const mockTaskError = (message: string, code = '23505') => ({
  data: null,
  error: {
    message,
    code,
    details: message,
    hint: '',
  },
  status: 400,
  statusText: 'Bad Request',
  count: 0,
}); 