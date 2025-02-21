### Comprehensive Task Creation and Management System Design

AI assistant task scheduler: flexible scheduling, AI execution, dependency management, logging, access control, visualization. Uses lightweight scheduling, Supabase for data, real-time updates, and role-based access.

#### Task Types and Definitions

A variety of task types are supported to cover common assistant functions and complex AI-driven workflows:

**Reminders**

*   **Definition:** Simple time-based notifications to users (e.g., meeting reminders or to-do prompts).
*   **Functionality:**
    *   Tasks trigger at specified times.
    *   Alert the user via the assistant’s interface or other channels (email, push notification).
*   **Examples:**
    *   Meeting reminders.
    *   To-do prompts.
*   **Similar Implementations:**
    *   OpenAI’s ChatGPT has introduced scheduled reminders, allowing automated alerts at set times.

**Recurring Data Processing**

*   **Definition:** Tasks that run on a schedule to process or transform data regularly.
*   **Purpose:** Ensure routine maintenance and data pipelines run without manual intervention.
*   **Analogy:** Similar to cron jobs that perform system upkeep.
*   **Examples:**
    *   Daily database backups
    *   Nightly log aggregation
    *   Weekly data analysis

**Automated Queries**

*   **Definition:** Tasks that periodically fetch data from external APIs or databases and update the assistant’s knowledge or user dashboards.

*   **Examples:**
    *   Retrieving weather info every hour.
    *   Fetching financial market data daily.

*   **Analogy:** Setting up Google Alerts or scheduled reports, but with the AI assistant fetching and possibly summarizing the results.

**AI-Orchestrated Workflows**

*   **Description:** Complex tasks where the AI assistant breaks down a goal into sub-tasks and coordinates their execution.

    *   AI acts as an orchestrator, analyzing input and deciding on a sequence of actions autonomously.
    *   Leverages LLM agents to handle multi-step processes.
    *   AI is used to plan and manage tasks.

*   **Example:** User instructs the assistant to "prepare a weekly report."

    *   AI agent will gather data.
    *   AI agent will generate a summary.
    *   AI agent will schedule an email.
    *   All actions are part of one high-level task.

**AI Execution Tasks**

*   **Definition:** Tasks where the execution step itself involves AI decision-making. Instead of a predefined script, the AI assistant (LLM) is prompted to perform the task at runtime.

*   **Characteristics:**

    *   AI assistant (LLM) performs task at runtime.
    *   No predefined script; the AI is prompted to complete the task.

*   **Examples:**

    *   Nightly task to generate a summary of the day's chat logs using an LLM.
    *   AI task to classify new support tickets as they arrive.

*   **Capabilities Leveraged:** LLM's ability to "write reports, analyze data, and code… autonomously, streamlining countless tasks".

*   **Implementation:** Tasks may involve the assistant:

    *   Running internal AI workflows.
    *   Using frameworks (like LangChain) to call tools.
    *   Returning results.

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


