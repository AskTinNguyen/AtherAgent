### Comprehensive Task Creation and Management System Design

This design outlines a task scheduling and execution system integrated into an AI assistant, supporting flexible scheduling (cron, intervals, events), AI-driven task execution, dependency management, robust logging, access control, and user-friendly visualization. It leverages a lightweight implementation (e.g. local cron or similar) and integrates with Supabase for data storage, real-time updates, and role-based access. Key components and best practices are detailed below.

#### Task Types and Definitions

A variety of task types are supported to cover common assistant functions and complex AI-driven workflows:

*   **Reminders:** Simple time-based notifications to users (e.g. meeting reminders or to-do prompts). These tasks trigger at specified times and alert the user via the assistant’s interface or other channels (email, push notification). OpenAI’s ChatGPT has introduced scheduled reminders in a similar vein, allowing automated alerts at set times​.

*   **Recurring Data Processing:** Tasks that run on a schedule to process or transform data regularly. Examples include daily database backups, nightly log aggregation, or weekly data analysis. Such tasks ensure routine maintenance and data pipelines run without manual intervention, much like cron jobs that perform system upkeep.

*   **Automated Queries:** Tasks that periodically fetch data from external APIs or databases and update the assistant’s knowledge or user dashboards. For instance, an automated query might retrieve weather info every hour or financial market data daily. This is akin to setting up Google Alerts or scheduled reports, but with the AI assistant fetching and possibly summarizing the results.

*   **AI-Orchestrated Workflows:** Complex tasks where the AI assistant breaks down a goal into sub-tasks and coordinates their execution. Here the AI acts as an orchestrator, analyzing input and deciding on a sequence of actions autonomously. For example, a user could instruct the assistant to “prepare a weekly report,” and the AI agent will gather data, generate a summary, and perhaps schedule an email – all as part of one high-level task. This approach leverages LLM agents to handle multi-step processes, effectively using AI to plan and manage tasks rather than just execute predetermined steps.

*   **AI Execution Tasks:** Tasks where the execution step itself involves AI computation or decision-making. Instead of a predefined script, the AI assistant (LLM) is prompted to perform the task at runtime. Examples: a nightly task to generate a summary of the day’s chat logs using an LLM, or an AI task to classify new support tickets as they arrive. LLM agents have shown the ability to “write reports, analyze data, and code… autonomously, streamlining countless tasks”, so the system taps into that capability. These tasks may involve the assistant running internal AI workflows or using frameworks (like LangChain) to call tools, then returning results.

By categorizing tasks, the system can apply appropriate handling for each. Reminders might require minimal execution (just send a notification), while AI-driven tasks might need loading AI models or calling external AI services. This flexible typology ensures the assistant can manage everything from simple cron jobs to sophisticated AI workflows.


## Flexible Task Scheduling

The system supports multiple scheduling mechanisms to accommodate different use cases:

### Cron-Based Scheduling

*   Users can specify cron expressions for tasks that need to run at specific calendar times or repeated intervals.
*   Cron syntax allows complex schedules (e.g. “every second Tuesday at 9:00 AM”).
*   Ideal for tasks like "run every Monday at 8 AM" or "every day at midnight".
*   The scheduler interprets the cron expression to calculate the next run times.
*   Under the hood, this could tie into a lightweight cron parser or the local OS cron daemon for precision.
*   Cron scheduling is powerful for complex periodicity (days of week, months, etc.) and is a proven method for time-driven automation.
*   The system should handle time zones and daylight savings properly (e.g. using UTC internally or a reliable library) to ensure consistency.

### Interval-Based Execution

*   For simpler recurring tasks, users can set interval schedules (e.g. “run every 15 minutes” or “every 6 hours”).
*   Interval schedules trigger tasks after a fixed duration repeatedly, without regard to specific clock times.
*   Useful for high-frequency tasks or those that simply need a regular cadence.
*   Internally, the scheduler will calculate the next run by adding the interval to the last run time.
*   Interval scheduling is essentially a subset of cron functionality (a cron expression like `*/15 * * * *` achieves a 15-minute interval), but providing it as an option makes it easier for users who think in terms of "every X time units."

### One-Off Scheduling

*   In addition to recurring schedules, the system allows one-time tasks (run at a specific future timestamp, then not repeat).
*   This is commonly used for single reminders or deferred execution of a job.
*   It can be implemented by treating it as a cron trigger that fires once or as a scheduled entry that is removed after execution.

### Event-Driven Triggers

*   Beyond time-based schedules, tasks can be triggered by events or conditions.
*   In an event-driven model, the arrival of a specific event causes the task to execute immediately, rather than on a pre-set timetable.
*   Examples of events include a file upload, a database update, an incoming message, or completion of another task (dependency).
*   Event triggers enable reactive workflows – for instance, if new data is available, a processing task can fire immediately instead of waiting for the next cron interval.
*   This improves freshness and efficiency by avoiding idle polling.
*   As an example, consider data pipelines: rather than cron scheduling a pipeline at fixed times and possibly missing late data or running when no data is available, an event-driven approach would "react to events directly… creating a more fluid and reliable pipeline."
*   Our system can implement event triggers via hooks: e.g., a webhook call into the assistant, a file system watcher, or database listeners.
*   Supabase’s real-time capabilities (listening to Postgres changes) can also serve as event triggers – for example, inserting a row into an "events" table could signal the assistant to run a corresponding task.

### Mixed Triggers

*   The design allows combining triggers.
*   For example, a task might run on a schedule and additionally on a specific event. Or a task might have a time deadline but can also be manually triggered.
*   This provides flexibility such as "run a cleanup daily at midnight, but also if disk usage exceeds a threshold (event)."

### Scheduling Engine

*   The core scheduler service will continuously monitor upcoming task schedules and events.
*   For cron/interval tasks, it calculates next run times and uses either a sleep-loop or integration with cron/OS schedulers to wake up at the right time.
*   For event-driven tasks, it subscribes to the relevant event sources (webhooks, DB triggers, etc.).
*   The scheduler component should be efficient – e.g., using a priority queue of next run times or leveraging the OS scheduler – to handle many tasks with minimal overhead.
*   It's important to avoid a busy-wait or heavy polling approach; instead, use callbacks or a sorted timer queue to wake only when the next task is due.
*   This ensures a lightweight footprint suitable for local deployment.
*   For instance, APScheduler or Node’s node-cron could be used to interpret cron expressions, whereas events can be handled via async listeners or message queues.
*   Using such libraries or existing cron facilities prevents reinventing the wheel and keeps the implementation compact.

### Edge Case Handling

*   Additionally, the scheduler must handle edge cases: if the system was offline or asleep when a task was supposed to run, it could either run immediately on restart (catch-up run) or mark it missed based on user preference.
*   Cron-like tools often skip missed runs by default, but for critical tasks a catch-up mechanism might be enabled.


## Task Execution and Integration

The execution layer carries out the actions defined by a task.

**AI Task Execution:**

*   If designated as an AI task, the AI assistant performs the necessary steps.
*   This involves prompting a large language model (LLM) or using an AI agent.
    *   Example: Summarizing news headlines and sending the response to the user.
*   AI execution leverages LLMs for content generation, data analysis, and decision-making.
*   AI agents can handle complex instructions, write reports, analyze data, etc.
*   The system will include templates/scripts for common AI tasks and custom prompts for user-defined AI tasks.

**Standard Task Execution:**

*   For tasks not relying on AI.
*   Executes predefined scripts, database queries, or API calls.
    *   Example: Running an SQL query on a Supabase database or calling a REST API.
*   Tasks specify an execution handler (code, script path, HTTP request template, or database operation).
*   The scheduler triggers the task, and an executor module runs the specified action.

**External Service Requests:**

*   Tasks can interact with external systems.
*   Supports sending HTTP requests, interacting with local OS processes, or invoking cloud functions.
    *   Example: Calling a weather API or executing a local shell script.
*   Facilitated via extensible connectors or plugins.
*   A library of integration actions (HTTP request, database query, email send, etc.) is available for task definitions.
*   Security is crucial: Only allowed operations should happen, especially in local deployments.

**Dependency Handling in Execution:**

*   The executor ensures a task runs only when its prerequisites are met.
*   When Task A finishes, it notifies the scheduler (or dependency manager).
*   The scheduler then schedules Task B if all its dependencies are satisfied.
*   Event-driven kick-off ensures dependent tasks start ASAP after predecessors complete.
*   If a dependency fails:
    *   The system can skip downstream tasks.
    *   Or mark them as blocked (with options for user override or rerun).

**Isolation and Resource Management:**

*   Each task execution runs in isolation to prevent interference.
*   For AI tasks: separate thread/process to avoid blocking the main assistant.
*   For local scripts: subprocesses or containers for isolation.
*   Enforces resource limits (CPU, memory) on tasks, especially user-provided scripts.

**AI Orchestration of Multi-Step Tasks:**

*   Execution may be iterative for AI-orchestrated workflows.
*   The AI could spawn subtasks or tools.
    *   Example: Planning a daily schedule and creating reminder tasks.
*   The system should allow dynamic task creation by the AI (with user permissions).
*   Safeguards are needed to prevent runaway loops or excessive task creation.


## Task Dependency Management

### Dependency Chains

*   Tasks can be specified to start only after one or more other tasks have completed successfully.
*   Example: Task B depends on Task A; B runs only after A's data is ready.
*   The system enforces this by not scheduling or pausing B until A is completed.
*   Ensures the correct ordering of operations.
*   Generalizes the concept of database schedulers where one job's execution is dependent on the completion of another.

### Multiple Dependencies

*   A task can have multiple prerequisites (e.g., Task Z runs after X and Y are complete).
*   Forms a directed acyclic graph (DAG) internally, where nodes are tasks and edges denote "must run before" relationships.
*   The scheduler or a dependency manager tracks task completion.
*   When all dependencies are satisfied, the task is marked as ready to run.
*   Analogous to Airflow's DAG scheduling where the DAG reflects task relationships and dependencies.
*   The scheduler ensures that tasks execute in the correct order.
*   The system will maintain a dependency table (or a mapping in memory) to continually evaluate these conditions.

### Handling Failures in Dependencies

*   By default, if a dependency task fails, dependent tasks should not run.
*   Dependent tasks are marked as skipped or blocked due to a failed prerequisite.
*   Status is logged and shown to the user.
*   Optionally, tasks can declare if they can run even if a dependency failed.
*   Chaining generally implies a success requirement.
*   The user or admin can re-run or clear the failure and manually trigger downstream tasks.
*   A clear indication of the chain in the UI (arrows or indentations) helps users understand relationships.

### Sequential vs. Parallel Execution

*   Dependencies enable both sequences and parallel branches.
*   If Task C has no dependency on A or B, C can run in parallel (or at any time).
*   The scheduler can start independent tasks concurrently if resources allow.
*   DAG view example: "A before B, while C can run anytime" means A → B is one chain, and C is separate.
*   This should be visualized for clarity.
*   The system should avoid introducing cycles in dependency definitions and reject them if the user tries to create one.

### Transitive Chains and Workflow Orchestration

*   Users or the AI orchestrator can create entire workflows with dependency chaining.
*   Example: A -> B -> D, and A -> C -> D (D depends on both B and C).
*   A runs first, then B and C (in parallel after A), then D last when both B and C are done.
*   The workflow as a whole can have an identity (parent task grouping or DAG name).
*   Similar to how Airflow groups tasks into a DAG for a coherent workflow.
*   Focuses on order and dependency rather than specifics of each task's code.

### Dependency Implementation

*   In the database schema, a table (e.g., `task_dependencies`) lists pairs of task IDs: `predecessor_id` and `successor_id`.
*   The scheduler checks this table to ensure all predecessor tasks have `status = completed`.
*   Alternatively, each task could have a list of prerequisite IDs.
*   Internally, maintain a wait-list of tasks that are ready except for dependencies.
*   Each time a task finishes, check if it was a prerequisite for others and mark those tasks as closer to ready.
*   If all prerequisites are done, move the task to the ready queue.
*   This event-driven release of tasks ensures no polling is needed.
*   Task B can start immediately when Task A finishes, rather than waiting for the next scheduler tick.

### Error Propagation and Alerts

*   If a task in a chain fails, the system should provide clear logging (e.g., "skipped due to failure of Task A" in Task B's record).
*   The system might notify the user that the whole workflow did not complete.
*   This ties into the logging/notification subsystem.
*   The user can decide to fix and rerun or ignore the chain.

By supporting dependencies, the system can coordinate complex sequences of actions, essential for AI-orchestrated tasks and scenarios where one task's output is another's input. This adds reliability and flexibility in designing workflows, similar to enterprise schedulers or DAG-based pipelines.

## Task Logging and History

This section outlines the comprehensive logging and history tracking features crucial for transparency, debugging, and auditing.

### Execution Status Tracking

*   Each task execution will have a status updated throughout its lifecycle:
    *   Pending
    *   Running
    *   Completed
    *   Failed
    *   Skipped
*   Statuses are stored in a history table or log.
*   Each status change is timestamped.
*   Recurring tasks generate a new history entry for each occurrence.

### Logs and Output Capture

*   The system captures stdout, stderr, and any relevant task output.
*   Logs are potentially truncated to a reasonable size.
*   Full logs can be stored in a file or blob storage if very large.
*   Logs are associated with the task run record for retrieval.
*   Error messages and stack traces are saved upon failure.
*   Start and end times (and duration) are logged for performance monitoring.

Example History Record:

| Task | Date        | Time   | Status    | Duration | Notes                      |
| :---- | :---------- | :----- | :--------- | :------- | :-------------------------- |
| X    | Jan 10      | 10:00  | Completed | 5s      |                            |
| X    | Jan 11      | 10:00  | Failed     |         | With Error Message         |

### Centralized Log Access

*   Users with appropriate permissions can view logs and history via the UI or query them via the assistant.
*   Quick filters (e.g., show all failures, last runs) are available.
*   Search functionality is provided for log keywords.
*   Debugging AI tasks: Stores prompts and AI responses.
*   Debugging other tasks: Stores requests and responses.

### Error Handling and Retries

*   Task failures are logged as "Failed."
*   The system supports automatic retries (configured with max retry count and delay).
*   A new attempt is scheduled upon failure if retry is enabled (status: "Retrying" -> Running).
*   All attempts are logged, indicating attempt number.

### Audit Trail

*   Logs who created or edited a task and who manually ran or canceled a task.
*   Each task definition stores created_by and last_modified_by.
*   Manual executions or edits generate audit log entries.
*   History tracks if a task was disabled or its schedule changed.

### Historical Analytics

*   The system provides analytics based on execution logs:
    *   Success rate
    *   Average run time
    *   Frequency of failures

### Storage of Logs

*   Shorter logs can be stored in a text column in the database.
*   Larger logs can be stored in Supabase storage or an external log service (with a reference in the database).
*   Logs are stored with timestamps (with timezone) for accurate chronology.


## Proposed Database Schema

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
