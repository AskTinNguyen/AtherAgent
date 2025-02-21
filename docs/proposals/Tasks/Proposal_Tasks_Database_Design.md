## Proposed Database Schema (COMPLETED) ✅

**An efficient schema underpins the system, especially with Supabase/Postgres as the backbone. Below is a high-level schema design covering tasks, scheduling, dependencies, logs, and preferences:**

### Tasks Table (tasks): This table holds the definition of each task.


# Database Schema Details

## Tasks Table (tasks)
- **id (PK)**: Unique identifier for the task.
- **name**: Human-friendly name or title of the task (e.g., "Daily Backup").
- **type**: Enum or text indicating the task type (Reminder, DataProcess, Query, AI_Orchestrated, AI_Execution, etc.).
- **schedule_cron**: Text field for cron expression (NULL if not using cron).
- **schedule_interval**: Interval or int for seconds/minutes between runs (NULL if not interval-based). Alternatively, store as seconds or a small JSON if needed (e.g., { "every": 30, "unit": "minutes" }).
- **next_run_at**: Timestamp of the next scheduled run (for quick querying of upcoming tasks). The scheduler updates this after each run for recurring tasks.
- **last_run_at**: Timestamp of the last execution (if any) – useful for reference.
- **is_active**: Boolean to enable/disable the task without deleting it.
- **action_type**: Type of action to execute (e.g., "HTTP", "Script", "AI_Prompt", etc.) – this helps the executor know how to handle it.
- **action_payload**: A JSON or text field with details needed for execution. For example:
  - HTTP: URL, method, headers, body template
  - AI_Prompt: prompt text and model name
  - Script: reference to a script or command
- **created_by**: User ID of who created the task.
- **owner_id**: User ID who "owns" the task (could be same as created_by or transferred).
- **created_at, updated_at**: Timestamps for audit.

**Indexes**:
- Index on next_run_at (to quickly find due tasks)
- Index on owner_id (for RLS checks)
- Composite index on (is_active, next_run_at) for filtering active tasks that are due

## Task Dependency Table (task_dependencies)
- **task_id**: (FK to tasks.id) The dependent task that should wait.
- **depends_on_task_id**: (FK to tasks.id) The prerequisite task that must complete first.
- **dependency_type**: Indicator if it requires success or can run on failure (default "success").
- **Primary key**: Composite of (task_id, depends_on_task_id)

*Note: This allows many-to-many relationships. A task can depend on multiple others. Simple queries on this table suffice for getting all dependencies or finding waiting tasks (with proper indexing).*

## Task Run History Table (task_runs)
- **run_id (PK)**: Unique ID for the run (UUID or bigserial)
- **task_id**: (FK to tasks) Which task was executed
- **scheduled_time**: Timestamp it was supposed to run
- **start_time**: Timestamp when execution actually started
- **end_time**: Timestamp when execution finished
- **status**: Enum ('completed', 'failed', 'running', 'cancelled', 'skipped')
- **attempt**: Integer attempt count (1 for first try, 2+ for retries)
- **log**: Text or JSON field for log output
- **error_message**: Short field for error message if failed
- **triggered_by**: Indicates trigger type ('schedule', 'manual', 'event:<event name>', etc.)

**Indexes**:
- Index on task_id (for querying runs per task)
- Index on status (for finding running tasks)
- Index on start_time (for global timeline queries)

## Users Table (users)
- **id (PK)**: User ID (UUID in Supabase)
- **role**: Enum or text ('admin','user','viewer', etc.)
- **name, email**: Basic user information

*Note: Can leverage Supabase Auth and RBAC via RLS policies*

## Task Permissions Table (task_permissions) [Optional]
- **task_id, user_id**: Composite key
- **can_edit**: Boolean
- **can_view**: Boolean

## Events Table [Optional]
For custom event triggers:
- **id**: Unique identifier
- **name/type**: Event identifier
- **details**: Event information
- **task_id**: Optional link to task

## User Preferences Table (user_preferences) [Optional]
- **user_id**: (FK to users)
- **preference_key**: Setting name
- **preference_value**: Setting value

## Audit Log Table (audit_log) [Optional]
- **action**: Type of action performed
- **entity**: Target (task/task_run)
- **entity_id**: Target identifier
- **user_id**: Actor
- **timestamp**: When it occurred
- **details**: Additional information


All tables should have proper foreign key relationships (with cascading deletes carefully managed – e.g., if a task is deleted, its task_runs and dependencies should probably be deleted as well; or we soft-delete tasks to keep history).

In Supabase/Postgres, we can use Row Level Security policies on the tasks and task_runs tables such that:

Users can SELECT and INSERT into task_runs if the related task.owner_id is the user (or the user is admin).
Users can SELECT/UPDATE tasks if they are owner.
Admin role (perhaps determined by a JWT claim or a separate table mapping) can do anything. This ensures privacy even if multiple users use the same database.
The schema is optimized for the queries we need:

Finding due tasks (query tasks where next_run_at <= now and is_active true, and dependencies satisfied – the latter checked via left join on deps to see no unsatisfied ones).
Logging runs (insert into task_runs).
Retrieving history per task (select * from task_runs where task_id = X order by start_time desc).
Checking dependencies (select depends_on where task_id = X, and see their statuses in task_runs).
These will be aided by the indexes suggested.
Given the system’s scope, the number of tables is kept small. It avoids overly complex normalization; e.g., we store schedule info in the tasks table itself for simplicity. One could separate a schedules table if tasks could have multiple schedules, but that’s overkill here.

This schema will work efficiently for likely tens to hundreds of tasks per user (which covers most personal or small-team use cases). Proper indexing and the lightweight nature of each entry (mostly small text and timestamps) means performance should remain good even as the history grows (especially if we prune old logs). Using Supabase means we get a scalable Postgres that can handle far more if needed.





## Proposed Database Schema

This document outlines the proposed database schema, designed for use with Supabase/Postgres.

### Tasks Table (tasks)

This table holds the definition of each task.

| Column Name        | Data Type                                                                  | Description                                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| id                 | PK                                                                         | Unique identifier for the task.                                                                                                                                          |
| name               | Text                                                                       | Human-friendly name or title of the task (e.g., "Daily Backup").                                                                                                         |
| type               | Enum or Text                                                               | Task type (Reminder, DataProcess, Query, AI_Orchestrated, AI_Execution, etc.).                                                                                            |
| schedule_cron      | Text                                                                       | Cron expression (NULL if not using cron).                                                                                                                                |
| schedule_interval  | Interval or Int or JSON                                                     | Interval or int for seconds/minutes between runs (NULL if not interval-based). Alternatively, store as seconds or a small JSON (e.g., { "every": 30, "unit": "minutes" }). |
| next_run_at        | Timestamp                                                                  | Timestamp of the next scheduled run.                                                                                                                                     |
| last_run_at        | Timestamp                                                                  | Timestamp of the last execution (if any).                                                                                                                                |
| is_active          | Boolean                                                                    | Enable/disable the task without deleting it.                                                                                                                             |
| action_type        | Text                                                                       | Type of action to execute (e.g., "HTTP", "Script", "AI_Prompt", etc.).                                                                                                    |
| action_payload     | JSON or Text                                                               | Details needed for execution (e.g., URL, method, headers, body template for HTTP; prompt text and model name for AI_Prompt; script reference for Script).                 |
| created_by         | User ID                                                                    | User ID of who created the task.                                                                                                                                         |
| owner_id           | User ID                                                                    | User ID who “owns” the task.                                                                                                                                           |
| created_at         | Timestamp                                                                  | Timestamp for audit.                                                                                                                                                    |
| updated_at         | Timestamp                                                                  | Timestamp for audit.                                                                                                                                                    |
| **Indexes**        |                                                                            |                                                                                                                                                                          |
|                    |                                                                            | Index on `next_run_at`.                                                                                                                                                  |
|                    |                                                                            | Index on `owner_id`.                                                                                                                                                    |
|                    |                                                                            | Composite index on `(is_active, next_run_at)`.                                                                                                                            |

### Task Dependency Table (task_dependencies)

Defines dependency edges between tasks.

| Column Name         | Data Type   | Description                                                                              |
| ------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| task_id             | FK to tasks | The dependent task that should wait.                                                     |
| depends_on_task_id  | FK to tasks | The prerequisite task that must complete first.                                          |
| dependency_type     | Text        | Indicator if it requires success or can run on failure (default "success").             |
| **Primary Key**     |             | Composite of `(task_id, depends_on_task_id)`.                                              |

### Task Run History Table (task_runs)

Records each execution instance of tasks.

| Column Name     | Data Type                       | Description                                                                                                                                                                                                                                                                                                                       |
| --------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| run_id          | PK                              | Unique ID for the run (could be UUID or bigserial).                                                                                                                                                                                                                                                                              |
| task_id         | FK to tasks                     | Which task was executed.                                                                                                                                                                                                                                                                                                        |
| scheduled_time  | Timestamp                       | Timestamp it was supposed to run.                                                                                                                                                                                                                                                                                               |
| start_time      | Timestamp                       | Timestamp when execution actually started.                                                                                                                                                                                                                                                                                        |
| end_time        | Timestamp                       | Timestamp when execution finished.                                                                                                                                                                                                                                                                                               |
| status          | Enum                            | ('completed', 'failed', 'running', 'cancelled', 'skipped').                                                                                                                                                                                                                                                                     |
| attempt         | Integer                         | Integer attempt count (for retries; 1 for first try, 2 for first retry, etc).                                                                                                                                                                                                                                                    |
| log             | Text or JSON                    | Log output (could store truncated logs or summary). For large logs, this might be null and actual logs stored in a separate log file or object storage, with a reference (e.g., a URL or path).                                                                                                                                |
| error_message   | Text                            | Short field for error message if failed.                                                                                                                                                                                                                                                                                        |
| triggered_by    | Text                            | Indicates what triggered this run – could be 'schedule', 'manual', 'event:<event name>', etc.                                                                                                                                                                                                                                     |
| **Indexes**     |                                 |                                                                                                                                                                                                                                                                                                                                   |
|                 |                                 | Index on `task_id`.                                                                                                                                                                                                                                                                                                                 |
|                 |                                 | Index on `status`.                                                                                                                                                                                                                                                                                                               |
|                 |                                 | Index on `start_time`.                                                                                                                                                                                                                                                                                                             |

### Users Table (users) or view of Supabase auth

If using Supabase Auth, a users table might already exist or we use auth.uid() function. But we can store some profile like role.

| Column Name | Data Type      | Description                                                                           |
| ----------- | -------------- | ------------------------------------------------------------------------------------- |
| id          | PK (UUID)      | User ID (UUID in Supabase).                                                            |
| role        | Enum or Text   | ('admin','user','viewer', etc.).                                                        |
| name        | Text           | User name.                                                                            |
| email       | Text           | User email.                                                                           |

### Task Permissions Table (task_permissions) (Optional)

(Optional, only if fine-grained sharing is needed beyond owner.)

| Column Name | Data Type   | Description                             |
| ----------- | ----------- | --------------------------------------- |
| task_id     | FK to tasks | Task ID.                                |
| user_id     | FK to users | User ID.                                |
| can_edit    | Boolean     | Indicates if the user can edit the task. |
| can_view    | Boolean     | Indicates if the user can view the task. |

### Events/Table for Event Triggers

If we allow custom event triggers (like external systems triggering tasks), we could have:

*   **events table**: with id, name or type, details, and possibly a task\_id to automatically link to a task to run.
*   **task\_event\_triggers table**: with columns task\_id and event\_name (e.g., "file\_uploaded", "new\_order").

### Visualization Preferences (user_preferences) (Optional)

| Column Name      | Data Type      | Description                                      |
| ---------------- | -------------- | ------------------------------------------------ |
| user_id          | FK to users    | User ID.                                         |
| preference_key   | Text           | Key of the preference (e.g., "default\_view").   |
| preference_value | Text or JSON   | Value of the preference (e.g., "gantt").         |

### Audit Log Table (audit_log) (Optional)

| Column Name | Data Type | Description                                                                   |
| ----------- | --------- | ----------------------------------------------------------------------------- |
| action      | Text      | Action performed (e.g., "create", "update", "run").                          |
| entity      | Text      | Entity affected (e.g., "task", "task\_run").                                  |
| entity_id   | Text      | ID of the entity affected.                                                    |
| user_id     | FK to users | User ID who performed the action.                                           |
| timestamp   | Timestamp | Timestamp of the action.                                                      |
| details     | JSON      | Additional details about the action (e.g., changes made to the task).         |


# Database Schema and Security for Task Management

## I. Tables

Here's the database schema designed for a task management system, focusing on simplicity and performance for personal or small-team use:

| Table Name | Columns | Data Types | Constraints/Relationships | Notes |
|---|---|---|---|---|
| `users` | `id` | UUID | PRIMARY KEY | User identification.  Could be managed by Supabase Auth. |
|  | `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT `now()` |  |
|  | `email` | TEXT | UNIQUE | |
|  | `name` | TEXT | |  |
| `tasks` | `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | Unique identifier for the task. |
|  | `owner_id` | UUID | NOT NULL | Foreign Key to `users.id`,  `ON DELETE CASCADE` |  User who owns/created the task. |
|  | `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT `now()` | Timestamp of task creation. |
|  | `name` | TEXT | NOT NULL | Task name or title. |
|  | `description` | TEXT |  | Task description (optional). |
|  | `next_run_at` | TIMESTAMP WITH TIME ZONE |  | Next scheduled execution time. |
|  | `schedule` | TEXT |  | Cron-like expression for scheduling (e.g., "0 0 * * *"). |
|  | `is_active` | BOOLEAN | DEFAULT TRUE | Indicates if the task is currently active. |
|  | `command` | TEXT | NOT NULL | The command to execute for the task. |
|  | `timeout_seconds` | INTEGER | | Optional timeout in seconds. |
|  | `soft_delete` | BOOLEAN | DEFAULT FALSE | Used for soft deletes instead of hard deletes. |
| `task_dependencies` | `task_id` | UUID | PRIMARY KEY, Foreign Key to `tasks.id`, `ON DELETE CASCADE` | The task that has the dependency. |
|  | `depends_on` | UUID | PRIMARY KEY, Foreign Key to `tasks.id`, `ON DELETE CASCADE` | The task that is being depended on. |
| `task_runs` | `id` | UUID | PRIMARY KEY, DEFAULT `uuid_generate_v4()` | Unique identifier for the task run. |
|  | `task_id` | UUID | NOT NULL, Foreign Key to `tasks.id`, `ON DELETE CASCADE` |  The task that was executed. |
|  | `start_time` | TIMESTAMP WITH TIME ZONE | DEFAULT `now()` | Execution start time. |
|  | `end_time` | TIMESTAMP WITH TIME ZONE |  | Execution end time. |
|  | `status` | TEXT |  | Status of the execution (e.g., "success", "failure"). |
|  | `log_output` | TEXT |  | Output/logs from the execution. |

### Notes:

*   **UUIDs:** Using UUIDs for IDs provides global uniqueness and avoids conflicts, especially in distributed systems. The `uuid_generate_v4()` function is a Postgres extension for generating UUIDs.
*   **Timestamps:**  `TIMESTAMP WITH TIME ZONE` stores timestamps with timezone information.
*   **ON DELETE CASCADE:**  Crucial for maintaining data integrity. When a `task` is deleted, all associated `task_runs` and `task_dependencies` are automatically removed.
*   **Soft Deletes:** Implementing `soft_delete` (e.g., `is_deleted` column) instead of actual deletion allows for keeping history and audit trails.
*   **Indexes:** Create indexes on frequently queried columns like `tasks.owner_id`, `tasks.next_run_at`, `tasks.is_active`, and `task_runs.task_id`.  Consider a composite index on (`next_run_at`, `is_active`).
*   **Normalization:** The schema avoids over-normalization to keep things simple. The `schedule` is stored directly in the `tasks` table.

## II. Row Level Security (RLS) Policies

Supabase's Row Level Security (RLS) provides fine-grained access control at the row level.  Here are example policies for the `tasks` and `task_runs` tables:

*   **Tasks Table:**

    *   **SELECT:**
        *   Policy: `Tasks can be viewed by owner`
        *   Expression: `owner_id = auth.uid()`  (Assuming Supabase Auth and `auth.uid()` is the user's ID).
    *   **UPDATE:**
        *   Policy: `Tasks can be updated by owner`
        *   Expression: `owner_id = auth.uid()`
    *   **INSERT:**
        *   Policy: `Tasks can be inserted by authenticated users`
        *   Expression: `TRUE` (or similar, depending on whether `owner_id` is automatically set).  A trigger might be necessary to set `owner_id` on insert.
    *   **DELETE:**
        *   Policy: `Tasks can be deleted by owner`
        *   Expression: `owner_id = auth.uid()` (or consider soft-deletes instead).

*   **Task Runs Table:**

    *   **SELECT:**
        *   Policy: `Task runs can be viewed if the user owns the related task`
        *   Expression: `(SELECT owner_id FROM tasks WHERE id = task_id) = auth.uid()`
    *   **INSERT:**
        *   Policy: `Task runs can be inserted if the user owns the related task`
        *   Expression: `(SELECT owner_id FROM tasks WHERE id = task_id) = auth.uid()`

### Notes:

*   **Admin Role:** Create an additional RLS policy (or use a bypass RLS option) for an "admin" role that bypasses the `owner_id` check. This can be determined by a JWT claim or a separate table mapping user IDs to admin status.
*   **Security Context:**  Remember that RLS policies operate within the security context of the user making the query.
*   **`auth.uid()`:** This assumes you're using Supabase Auth.  Adjust accordingly if using a different authentication mechanism.

## III. Example Queries

*   **Finding Due Tasks:**

    ```sql
    SELECT t.*
    FROM tasks t
    LEFT JOIN task_dependencies td ON t.id = td.task_id
    WHERE t.next_run_at <= NOW()
      AND t.is_active = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM task_runs tr
        WHERE tr.task_id = td.depends_on
          AND tr.status != 'success'  -- Or whatever defines "satisfied"
      );
    ```

*   **Logging Runs:**

    ```sql
    INSERT INTO task_runs (task_id, start_time, status, log_output)
    VALUES ('<task_id>', NOW(), 'success', '<log_output>');
    ```

*   **Retrieving History per Task:**

    ```sql
    SELECT *
    FROM task_runs
    WHERE task_id = '<task_id>'
    ORDER BY start_time DESC;
    ```

*   **Checking Dependencies:**

    ```sql
    SELECT depends_on
    FROM task_dependencies
    WHERE task_id = '<task_id>';
    ```

## IV. Optimizations

*   **Indexing:**  Proper indexing is critical for performance, especially as the data grows.
    *   Index on `tasks.owner_id`
    *   Index on `tasks.next_run_at`
    *   Index on `tasks.is_active`
    *   Index on `task_runs.task_id`
    *   Consider a composite index on `tasks(next_run_at, is_active)` for the "find due tasks" query.
*   **Pruning:** Regularly prune old `task_runs` logs to maintain performance, especially if they grow significantly.  Consider archiving them to a separate table or storage.
*   **Connection Pooling:** Use connection pooling to reduce database connection overhead.
*   **Prepared Statements:** Use prepared statements for frequently executed queries.
