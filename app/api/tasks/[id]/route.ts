import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// Task update schema
const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["reminder", "recurring", "automated_query", "ai_workflow", "ai_execution"]).optional(),
  schedule_cron: z.string().optional(),
  schedule_interval: z.string().optional(),
  action_type: z.string().optional(),
  action_payload: z.any().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  workflow_status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
  due_date: z.string().datetime().optional(),
}).strict();

// GET /api/tasks/[id] - Get task details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        task_assignees (assignee_id),
        task_tags (tag_id),
        task_dependencies (depends_on_task_id),
        task_runs (
          run_id,
          status,
          start_time,
          end_time,
          error_message
        )
      `)
      .eq("id", params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[TASK_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    // Validate request body
    const validatedData = updateTaskSchema.parse(json);
    
    // Update task
    const { data, error } = await supabase
      .from("tasks")
      .update(validatedData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Update assignees if provided
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

    // Update tags if provided
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

    return NextResponse.json(data);
  } catch (error) {
    console.error("[TASK_PUT]", error);
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
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Delete related records first
    await Promise.all([
      supabase.from("task_assignees").delete().eq("task_id", params.id),
      supabase.from("task_tags").delete().eq("task_id", params.id),
      supabase.from("task_dependencies").delete().eq("task_id", params.id),
    ]);

    // Delete the task
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TASK_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 