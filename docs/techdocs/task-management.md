# Task Management System Documentation

## Overview
The task management system provides a complete solution for creating, reading, updating, and deleting tasks with authentication, form validation, and real-time updates. The system is built using Next.js, Supabase, and follows modern React patterns.

## Components

### TaskDialog (`components/tasks/task-dialog.tsx`)
A modal dialog component that handles the task creation interface.

#### Key Features:
- Authentication-aware rendering
- Modal state management
- Error handling and user feedback
- Integration with Supabase authentication
- Real-time task creation feedback

### TaskForm (`components/tasks/task-form.tsx`)
A comprehensive form component for task creation and editing.

#### Key Features:
- Natural language input processing
- Form validation using Zod
- Dynamic field validation
- Real-time JSON preview
- Support for various task types
- Schedule configuration (cron, interval, due date)
- Advanced options for action types and payloads

#### Form Fields:
- Natural Language Input
- Name (required)
- Description
- Type (reminder, recurring, automated_query, ai_workflow, ai_execution)
- Priority (low, medium, high)
- Active Status
- Schedule Options:
  - Cron Schedule
  - Interval
  - Due Date
- Advanced Options:
  - Action Type
  - Action Payload (JSON)
  - Parent Task ID

## Services

### TaskService (`lib/services/task-service.ts`)
Handles all task-related operations with the Supabase backend.

#### Features:
- Server-side authentication
- Secure cookie handling
- Error handling and custom error types
- Data validation and cleaning
- CRUD operations for tasks

#### API Methods:

##### `createTask(task: CreateTaskInput)`
Creates a new task with proper validation and authentication.
```typescript
const task = await createTask({
  name: "Example Task",
  type: "reminder",
  priority: "medium",
  is_active: true
})
```

##### `getTasks()`
Retrieves all tasks for the authenticated user.
```typescript
const tasks = await getTasks()
```

##### `getTask(id: string)`
Retrieves a specific task by ID.
```typescript
const task = await getTask("task-uuid")
```

##### `updateTask(id: string, updates: Partial<CreateTaskInput>)`
Updates an existing task.
```typescript
const updated = await updateTask("task-uuid", {
  name: "Updated Task Name"
})
```

##### `deleteTask(id: string)`
Deletes a task by ID.
```typescript
await deleteTask("task-uuid")
```

## Authentication & Security

### Server-Side Authentication
- Uses Supabase SSR client for secure server-side operations
- Implements proper cookie handling for session management
- Validates user session before any operation
- Ensures task ownership for all operations

### Error Handling
- Custom `TaskServiceError` class for specific error types
- Comprehensive error messages for debugging
- User-friendly error responses
- Proper error logging

## Data Validation

### Form Validation
- Zod schema for form validation
- Required fields validation
- UUID format validation for parent tasks
- Schedule validation for active tasks
- JSON validation for action payloads

### Data Cleaning
- Converts empty strings to null for optional fields
- Proper timestamp handling
- JSON payload sanitization
- Proper type casting for database compatibility

## Best Practices Implemented

### Security
- Server-side authentication checks
- Cookie-based session management
- Owner-based access control
- Input sanitization

### Performance
- Optimized database queries
- Proper error boundaries
- Efficient state management
- Real-time updates

### User Experience
- Responsive form design
- Real-time validation
- Clear error messages
- Loading states
- Success notifications

## Database Schema

### Tasks Table
```sql
tasks (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  type text NOT NULL,
  priority text NOT NULL,
  is_active boolean DEFAULT true,
  schedule_cron text,
  schedule_interval text,
  due_date timestamp with time zone,
  action_type text,
  action_payload jsonb,
  parent_task_id uuid REFERENCES tasks(id),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  workflow_status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
)
```

## Future Improvements
1. Implement task scheduling execution
2. Add support for recurring task patterns
3. Enhance natural language processing capabilities
4. Add task dependencies visualization
5. Implement task progress tracking
6. Add support for task templates
7. Enhance reporting and analytics features 