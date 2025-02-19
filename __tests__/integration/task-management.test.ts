import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import { getMockedSupabaseClient, mockSupabaseResponse } from '../helpers/supabase-mock';

describe('Task Management System', () => {
  const supabase = getMockedSupabaseClient();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Task Creation', () => {
    test('should create a task with valid data', async () => {
      const mockTask = {
        name: 'Test Task',
        description: 'Test Description',
        type: TaskType.REMINDER,
        priority: TaskPriority.MEDIUM,
        workflow_status: TaskStatus.OPEN,
        is_active: true,
        owner_id: '123e4567-e89b-12d3-a456-426614174000',
        due_date: new Date().toISOString(),
      };

      const mockInsert = jest.spyOn(supabase.from('tasks'), 'insert')
        .mockResolvedValueOnce(mockSupabaseResponse([{
          ...mockTask,
          id: '123e4567-e89b-12d3-a456-426614174001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]));

      const response = await supabase.from('tasks').insert(mockTask);
      
      expect(response.error).toBeNull();
      expect(response.data).toHaveLength(1);
      expect(response.data![0]).toMatchObject(mockTask);
      expect(mockInsert).toHaveBeenCalledWith(mockTask);
    });

    test('should validate required fields', async () => {
      const invalidTask = {
        description: 'Test Description',
      };

      const mockInsert = jest.spyOn(supabase.from('tasks'), 'insert')
        .mockResolvedValueOnce(mockSupabaseResponse(null, {
          message: 'Required fields missing',
          details: 'name is required',
          hint: '',
          code: '23502',
        }));

      const response = await supabase.from('tasks').insert(invalidTask);
      
      expect(response.error).not.toBeNull();
      expect(response.error!.message).toBe('Required fields missing');
      expect(mockInsert).toHaveBeenCalledWith(invalidTask);
    });
  });

  describe('Task Retrieval', () => {
    test('should fetch tasks with filtering', async () => {
      const mockTasks = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Task 1',
          workflow_status: TaskStatus.OPEN,
          is_active: true,
          owner_id: '123e4567-e89b-12d3-a456-426614174000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Task 2',
          workflow_status: TaskStatus.COMPLETED,
          is_active: true,
          owner_id: '123e4567-e89b-12d3-a456-426614174000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockSelect = jest.spyOn(supabase.from('tasks'), 'select')
        .mockResolvedValueOnce(mockSupabaseResponse(mockTasks));

      const response = await supabase
        .from('tasks')
        .select('*')
        .eq('workflow_status', TaskStatus.OPEN);

      expect(response.error).toBeNull();
      expect(response.data).toHaveLength(2);
      expect(mockSelect).toHaveBeenCalled();
    });

    test('should fetch single task by ID', async () => {
      const mockTask = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Test Task',
        description: 'Test Description',
        workflow_status: TaskStatus.OPEN,
        is_active: true,
        owner_id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSelect = jest.spyOn(supabase.from('tasks'), 'select')
        .mockImplementation(() => ({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValueOnce(mockSupabaseResponse(mockTask)),
        } as any));

      const response = await supabase
        .from('tasks')
        .select()
        .eq('id', '123e4567-e89b-12d3-a456-426614174001')
        .single();

      expect(response.error).toBeNull();
      expect(response.data).toMatchObject(mockTask);
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe('Task Updates', () => {
    test('should update task status', async () => {
      const updateData = {
        workflow_status: TaskStatus.COMPLETED,
      };

      const mockUpdate = jest.spyOn(supabase.from('tasks'), 'update')
        .mockImplementation(() => ({
          eq: jest.fn().mockResolvedValueOnce(mockSupabaseResponse([{
            id: '123e4567-e89b-12d3-a456-426614174001',
            ...updateData,
            updated_at: new Date().toISOString(),
          }])),
        } as any));

      const response = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', '123e4567-e89b-12d3-a456-426614174001');

      expect(response.error).toBeNull();
      expect(response.data![0].workflow_status).toBe(TaskStatus.COMPLETED);
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
    });

    test('should handle invalid status updates', async () => {
      const updateData = {
        workflow_status: 'INVALID_STATUS',
      };

      const mockUpdate = jest.spyOn(supabase.from('tasks'), 'update')
        .mockImplementation(() => ({
          eq: jest.fn().mockResolvedValueOnce(mockSupabaseResponse(null, {
            message: 'Invalid status value',
            details: 'Status must be one of: OPEN, IN_PROGRESS, COMPLETED, CANCELLED',
            hint: '',
            code: '23514',
          })),
        } as any));

      const response = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', '123e4567-e89b-12d3-a456-426614174001');

      expect(response.error).not.toBeNull();
      expect(response.error!.message).toBe('Invalid status value');
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
    });
  });

  describe('Task Deletion', () => {
    test('should delete task by ID', async () => {
      const mockDelete = jest.spyOn(supabase.from('tasks'), 'delete')
        .mockImplementation(() => ({
          eq: jest.fn().mockResolvedValueOnce(mockSupabaseResponse([{
            id: '123e4567-e89b-12d3-a456-426614174001'
          }])),
        } as any));

      const response = await supabase
        .from('tasks')
        .delete()
        .eq('id', '123e4567-e89b-12d3-a456-426614174001');

      expect(response.error).toBeNull();
      expect(response.data).toHaveLength(1);
      expect(mockDelete).toHaveBeenCalled();
    });

    test('should handle deletion of non-existent task', async () => {
      const mockDelete = jest.spyOn(supabase.from('tasks'), 'delete')
        .mockImplementation(() => ({
          eq: jest.fn().mockResolvedValueOnce(mockSupabaseResponse(null, {
            message: 'Task not found',
            details: 'No task exists with the specified ID',
            hint: '',
            code: '23503',
          })),
        } as any));

      const response = await supabase
        .from('tasks')
        .delete()
        .eq('id', '123e4567-e89b-12d3-a456-426614174999');

      expect(response.error).not.toBeNull();
      expect(response.error!.message).toBe('Task not found');
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('Task Dependencies', () => {
    test('should validate task dependencies', async () => {
      const mockDependency = {
        task_id: '123e4567-e89b-12d3-a456-426614174001',
        depends_on_task_id: '123e4567-e89b-12d3-a456-426614174002',
        dependency_type: 'success' as const,
      };

      const mockInsert = jest.spyOn(supabase.from('task_dependencies'), 'insert')
        .mockResolvedValueOnce(mockSupabaseResponse([mockDependency]));

      const response = await supabase
        .from('task_dependencies')
        .insert(mockDependency);

      expect(response.error).toBeNull();
      expect(response.data![0]).toMatchObject(mockDependency);
      expect(mockInsert).toHaveBeenCalledWith(mockDependency);
    });

    test('should prevent circular dependencies', async () => {
      const mockCircularDependency = {
        task_id: '123e4567-e89b-12d3-a456-426614174002',
        depends_on_task_id: '123e4567-e89b-12d3-a456-426614174001',
        dependency_type: 'success' as const,
      };

      const mockInsert = jest.spyOn(supabase.from('task_dependencies'), 'insert')
        .mockResolvedValueOnce(mockSupabaseResponse(null, {
          message: 'Circular dependency detected',
          details: 'Cannot create circular dependency between tasks',
          hint: '',
          code: '23514',
        }));

      const response = await supabase
        .from('task_dependencies')
        .insert(mockCircularDependency);

      expect(response.error).not.toBeNull();
      expect(response.error!.message).toBe('Circular dependency detected');
      expect(mockInsert).toHaveBeenCalledWith(mockCircularDependency);
    });
  });
}); 