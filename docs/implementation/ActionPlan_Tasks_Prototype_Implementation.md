## Quick Wins: Task Management Application

Here's a structured breakdown of the project phases and tasks, prioritized for achieving quick wins:

**Phase 1: Minimalist Task API (Backend - Quick Win)**

*   **Task 1.1: Define Basic Task Schema**
    *   Use the existing the database 'tasks' table schema with minimum changes:
        *   `id`
        *   `name`
        *   `description`
        *   `type` (text)
        *   `schedule_cron` (text)
        *   `action_type` (text)
        *   `action_payload` (JSON)
        *   `is_active` (boolean)
    *   Ignore (if possible) `priority`, `interval`, `due date`, and `dependencies` for now.

*   **Task 1.2: Implement API Endpoints (Next.js API Routes)**
    *   Use Supabase client for database interactions.
    *   API Endpoints:
        *   `POST /api/tasks`: Create a new task (minimal validation).
        *   `GET /api/tasks`: List all tasks (no filtering/sorting initially).
        *   `GET /api/tasks/:id`: Get a single task by ID.
        *   `PUT /api/tasks/:id`: Update task name/description.
        *   `DELETE /api/tasks/:id`: Delete a task.

*   **Task 1.3: Basic API Request Validation (Zod - Simple)**
    *   Add basic Zod validation to `POST` and `PUT` requests (name required).

**Phase 2: Simplified Task UI (Frontend - Quick Win)**

*   **Task 2.1: Simplify task-form.tsx**
    *   Schema: Update `taskFormSchema` in `components/tasks/task-form.tsx` to match the minimal Task schema from Task 1.1. 
    *   Comment out validation/fields for `priority`, `interval`, `due date`, etc.
    *   Form Fields: Keep only essential form fields in `TaskForm`:
        *   Name
        *   Description
        *   Type (dropdown - "Standard" only)
        *   Cron Schedule
        *   Action Type (text input)
        *   Action Payload (textarea)
        *   Remove or comment out unnecessary fields.
    *   onSubmit: Update `onSubmit` in `TaskForm` to call `POST /api/tasks` API endpoint.

*   **Task 2.2: Simplify task-list.tsx**
    *   Columns: Reduce columns in `TaskList` to:
        *   Name (link to task details - placeholder for now)
        *   Type
        *   Cron Schedule
        *   Active status
        *   Remove `priority`, `run times`, etc.
    *   Data Fetching: Update `TaskList` to fetch tasks from `GET /api/tasks` API endpoint using `react-query`.

*   **Task 2.3: Create Basic Task Page (app/tasks/page.tsx)**
    *   Create a new Next.js page at `app/tasks/page.tsx` linking it to the Header Navigation at 'header.tsx'.
    *   Integrate `CreateTaskDialog` and `TaskList` components on this page. Simple layout (e.g., "Create Task" button above the Task List).

**Phase 3: Basic Task Execution (Backend - Quick Win)**

*   **Task 3.1: Basic Cron Scheduler**
    *   Implement a basic scheduler service (e.g., in `lib/task-scheduler.ts`) using `node-cron`.
    *   Scheduler should:
        *   Fetch active tasks with `schedule_cron` from the database.
        *   Use `node-cron` to schedule tasks based on cron expressions.
        *   For now, only support `action_type`: "Script". Assume `action_payload` is a simple command string (e.g., "echo Hello from Task").
        *   Execute the command using `child_process.exec`.
        *   Log basic execution status (start, end, success/fail) to `task_runs` table (minimal `task_runs` schema: `id`, `task_id`, `start_time`, `end_time`, `status`, `log`).

*   **Task 3.2: Trigger Scheduler on App Start**
    *   Ensure the scheduler service starts when the Next.js app starts (e.g., in `app/layout.tsx` or a server-side initialization file).

**Phase 4: Demo Prep (Quick Win)**

*   **Task 4.1: Seed Tasks**
    *   Manually insert a few example tasks directly into the Supabase database using Supabase MCP for the demo (different cron schedules, simple script actions).

*   **Task 4.2: Demo Script**
    *   Write a short demo script outlining the key features to showcase:
        *   Show Task List.
        *   Create a new task using the UI.
        *   Show the task appearing in the list.
        *   (If time allows) Show task execution logs (basic logs in `task_runs` table).
