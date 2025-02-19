"use client";

import { useSession, useSupabase } from "@/components/providers/supabase-provider";
import { TaskDependencyGraph } from "@/components/tasks/task-dependency-graph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Task, TaskDependency, TaskRun } from "@/lib/types/tasks";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

const TaskDetailsPage = () => {
  const params = useParams();
  const supabase = useSupabase();
  const session = useSession();
  const taskId = params.id as string;

  const { data: task, isLoading, error: queryError } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          task_assignees (assignee_id),
          task_tags (tag_id),
          task_dependencies!task_dependencies_task_id_fkey (
            depends_on_task_id,
            dependency_type,
            tasks!task_dependencies_depends_on_task_id_fkey (
              id,
              name,
              workflow_status
            )
          ),
          task_runs (
            run_id,
            status,
            scheduled_time,
            start_time,
            end_time,
            attempt,
            error_message,
            triggered_by
          )
        `)
        .eq("id", taskId)
        .single();

      if (error) throw error;
      return data as Task & {
        task_runs: TaskRun[];
        task_dependencies: (TaskDependency & {
          tasks: Pick<Task, "id" | "name" | "workflow_status">;
        })[];
      };
    },
    enabled: !!supabase && !!session, // Only run query when both supabase and session are available
  });

  const handleManualTrigger = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/run`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to trigger task");
      }
      
      toast.success("Task triggered successfully");
    } catch (error) {
      console.error("Error triggering task:", error);
      toast.error("Failed to trigger task");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold text-red-500">Error loading task</h1>
        <p className="text-gray-600">{queryError.message}</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold">Task not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Task Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{task.name}</h1>
          <div className="mt-2 space-x-2">
            <Badge variant={task.priority === "high" ? "destructive" : "default"}>
              {task.priority}
            </Badge>
            <Badge variant="outline">{task.type}</Badge>
            <Badge
              variant={
                task.workflow_status === "completed"
                  ? "success"
                  : task.workflow_status === "in_progress"
                  ? "secondary"
                  : "default"
              }
            >
              {task.workflow_status}
            </Badge>
          </div>
        </div>
        <Button onClick={handleManualTrigger} className="flex items-center gap-2">
          <PlayCircle className="h-4 w-4" />
          Run Now
        </Button>
      </div>

      {/* Task Details */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-muted-foreground">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Created</h3>
              <p className="text-muted-foreground">
                {format(new Date(task.created_at), "PPpp")}
              </p>
            </div>
            {task.due_date && (
              <div>
                <h3 className="font-medium">Due Date</h3>
                <p className="text-muted-foreground">
                  {format(new Date(task.due_date), "PPpp")}
                </p>
              </div>
            )}
          </div>

          {(task.schedule_cron || task.schedule_interval) && (
            <div>
              <h3 className="font-medium">Schedule</h3>
              <p className="text-muted-foreground">
                {task.schedule_cron
                  ? `Cron: ${task.schedule_cron}`
                  : `Interval: ${task.schedule_interval}`}
              </p>
            </div>
          )}

          {task.action_type && (
            <div>
              <h3 className="font-medium">Action</h3>
              <p className="text-muted-foreground">{task.action_type}</p>
              {task.action_payload && (
                <pre className="mt-2 p-2 bg-muted rounded-md">
                  {JSON.stringify(task.action_payload, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dependencies */}
      {task.task_dependencies?.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {task.task_dependencies.map((dep) => (
                    <TableRow key={dep.depends_on_task_id}>
                      <TableCell>{dep.tasks.name}</TableCell>
                      <TableCell>{dep.dependency_type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            dep.tasks.workflow_status === "completed"
                              ? "success"
                              : dep.tasks.workflow_status === "in_progress"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {dep.tasks.workflow_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dependency Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskDependencyGraph
                task={task}
                dependencies={task.task_dependencies}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Attempt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {task.task_runs
                .sort(
                  (a, b) =>
                    new Date(b.start_time || 0).getTime() -
                    new Date(a.start_time || 0).getTime()
                )
                .map((run) => {
                  const duration = run.start_time && run.end_time
                    ? new Date(run.end_time).getTime() -
                      new Date(run.start_time).getTime()
                    : null;

                  return (
                    <TableRow key={run.run_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {run.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : run.status === "in_progress" ? (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          {run.status}
                        </div>
                      </TableCell>
                      <TableCell>
                        {run.start_time
                          ? format(new Date(run.start_time), "PPpp")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {duration ? `${Math.round(duration / 1000)}s` : "N/A"}
                      </TableCell>
                      <TableCell>{run.triggered_by || "Scheduled"}</TableCell>
                      <TableCell>#{run.attempt}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetailsPage; 