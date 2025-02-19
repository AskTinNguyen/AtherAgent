import * as taskHandlers from '@/app/api/tasks/route';
import { TaskPriority, TaskStatus, TaskType } from '@/lib/types/tasks';
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getMockedSupabaseClient } from '../helpers/supabase-mock';

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => getMockedSupabaseClient()),
}));

// Mock NextRequest and NextResponse
const createNextRequest = (method: string, body?: any, query?: any) => {
  const url = new URL('http://localhost:3000/api/tasks');
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.append(key, value as string);
    });
  }
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe('Task API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/tasks', () => {
    test('should create a new task with valid data', async () => {
      const req = createNextRequest('POST', {
        name: 'Test API Task',
        description: 'Test Description',
        type: 'reminder' as TaskType,
        priority: 'medium' as TaskPriority,
        workflow_status: 'todo' as TaskStatus,
        due_date: new Date().toISOString(),
      });

      const response = await taskHandlers.POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.task).toBeDefined();
      expect(data.task.name).toBe('Test API Task');
    });

    test('should return 400 for invalid task data', async () => {
      const req = createNextRequest('POST', {
        description: 'Missing required fields',
      });

      const response = await taskHandlers.POST(req);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tasks', () => {
    test('should return filtered tasks', async () => {
      const req = createNextRequest('GET', null, {
        status: 'todo',
        type: 'reminder',
      });

      const response = await taskHandlers.GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.tasks)).toBe(true);
    });

    test('should handle pagination', async () => {
      const req = createNextRequest('GET', null, {
        page: '1',
        limit: '10',
      });

      const response = await taskHandlers.GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBeDefined();
      expect(data.pagination.page).toBe(1);
    });
  });

  describe('PUT /api/tasks/[id]', () => {
    test('should update task with valid data', async () => {
      const taskId = '123e4567-e89b-12d3-a456-426614174001';
      const req = createNextRequest('PUT', {
        name: 'Updated Task Name',
        workflow_status: 'in_progress',
      });

      const response = await taskHandlers.PUT(req, { params: { id: taskId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(taskId);
      expect(data.name).toBe('Updated Task Name');
      expect(data.workflow_status).toBe('in_progress');
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    test('should delete existing task', async () => {
      const taskId = '123e4567-e89b-12d3-a456-426614174001';
      const req = createNextRequest('DELETE');

      const response = await taskHandlers.DELETE(req, { params: { id: taskId } });
      expect(response.status).toBe(204);
    });

    test('should return 404 for non-existent task', async () => {
      const req = createNextRequest('DELETE');

      const response = await taskHandlers.DELETE(req, { params: { id: 'non-existent-id' } });
      expect(response.status).toBe(404);
    });
  });
}); 