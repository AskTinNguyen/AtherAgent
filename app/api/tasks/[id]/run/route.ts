import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/tasks/[id]/runs - Get task execution history
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = createRouteHandlerClient({ cookies });
    
    let query = supabase
      .from("task_runs")
      .select("*")
      .eq("task_id", params.id)
      .order("start_time", { ascending: false });

    // Apply status filter if provided
    if (searchParams.has("status")) {
      query = query.eq("status", searchParams.get("status"));
    }

    // Apply limit if provided
    const limit = searchParams.get("limit");
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("[TASK_RUNS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/run - Manually trigger task execution
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if task exists
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", params.id)
      .single();

    if (taskError) throw taskError;
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Create a new task run record
    const { data: taskRun, error: runError } = await supabase
      .from("task_runs")
      .insert({
        task_id: params.id,
        status: "pending",
        triggered_by: "manual",
        attempt: 1,
      })
      .select()
      .single();

    if (runError) throw runError;

    // TODO: Trigger actual task execution via background job
    // For now, we'll just update the status to simulate execution
    const { error: updateError } = await supabase
      .from("task_runs")
      .update({
        status: "completed",
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      })
      .eq("run_id", taskRun.run_id);

    if (updateError) throw updateError;

    return NextResponse.json(taskRun);
  } catch (error) {
    console.error("[TASK_RUN_POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 