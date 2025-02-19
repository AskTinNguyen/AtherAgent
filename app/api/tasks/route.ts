import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// Task creation schema
const createTaskSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["reminder", "recurring", "automated_query", "ai_workflow", "ai_execution"]),
  schedule_cron: z.string().optional(),
  schedule_interval: z.string().optional(),
  action_type: z.string().optional(),
  action_payload: z.any().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  workflow_status: z.enum(["todo", "in_progress", "completed", "cancelled"]).default("todo"),
  due_date: z.string().datetime().optional(),
});

// GET /api/tasks - List tasks with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = createRouteHandlerClient({ cookies });
    
    // Build query with filters
    let query = supabase
      .from("tasks")
      .select(`
        *,
        task_assignees (assignee_id),
        task_tags (tag_id),
        task_dependencies (depends_on_task_id)
      `);

    // Apply filters if provided
    if (searchParams.has("type")) {
      query = query.eq("type", searchParams.get("type"));
    }
    
    if (searchParams.has("status")) {
      query = query.eq("workflow_status", searchParams.get("status"));
    }
    
    if (searchParams.has("priority")) {
      query = query.eq("priority", searchParams.get("priority"));
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("[TASKS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create new task
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    // Validate request body
    const validatedData = createTaskSchema.parse(json);
    
    // Insert task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert([validatedData])
      .select()
      .single();

    if (taskError) throw taskError;

    // Handle assignees if provided
    if (json.assignees?.length > 0) {
      const assignees = json.assignees.map((assignee_id: string) => ({
        task_id: task.id,
        assignee_id,
      }));

      const { error: assigneeError } = await supabase
        .from("task_assignees")
        .insert(assignees);

      if (assigneeError) throw assigneeError;
    }

    // Handle tags if provided
    if (json.tags?.length > 0) {
      const tags = json.tags.map((tag_id: string) => ({
        task_id: task.id,
        tag_id,
      }));

      const { error: tagError } = await supabase
        .from("task_tags")
        .insert(tags);

      if (tagError) throw tagError;
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASKS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const json = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    // Validate request body
    const validatedData = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      workflow_status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      schedule_cron: z.string().optional(),
      schedule_interval: z.string().optional(),
      action_type: z.string().optional(),
      action_payload: z.any().optional(),
      due_date: z.string().datetime().optional(),
    }).parse(json);
    
    // Update task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .update(validatedData)
      .eq("id", params.id)
      .select()
      .single();

    if (taskError) throw taskError;

    // Handle assignees if provided
    if (json.assignees) {
      // Delete existing assignees
      await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", params.id);

      if (json.assignees.length > 0) {
        const assignees = json.assignees.map((assignee_id: string) => ({
          task_id: params.id,
          assignee_id,
        }));

        const { error: assigneeError } = await supabase
          .from("task_assignees")
          .insert(assignees);

        if (assigneeError) throw assigneeError;
      }
    }

    // Handle tags if provided
    if (json.tags) {
      // Delete existing tags
      await supabase
        .from("task_tags")
        .delete()
        .eq("task_id", params.id);

      if (json.tags.length > 0) {
        const tags = json.tags.map((tag_id: string) => ({
          task_id: params.id,
          tag_id,
        }));

        const { error: tagError } = await supabase
          .from("task_tags")
          .insert(tags);

        if (tagError) throw tagError;
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASKS_PUT]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Delete task dependencies
    await supabase
      .from("task_dependencies")
      .delete()
      .or(`task_id.eq.${params.id},depends_on_task_id.eq.${params.id}`);

    // Delete task assignees
    await supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", params.id);

    // Delete task tags
    await supabase
      .from("task_tags")
      .delete()
      .eq("task_id", params.id);

    // Delete task
    const { error: taskError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", params.id);

    if (taskError) throw taskError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TASKS_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 