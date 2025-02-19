"use client";

import { Task, TaskDependency } from "@/lib/types/tasks";
import { Background, Controls, Panel, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

interface TaskNode extends Task {
  position: { x: number; y: number };
}

interface TaskDependencyGraphProps {
  task: Task;
  dependencies: (TaskDependency & {
    tasks: Pick<Task, "id" | "name" | "workflow_status">;
  })[];
  allRelatedTasks?: Task[];
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const LEVEL_HEIGHT = 150;
const NODES_PER_ROW = 3;
const NODE_HORIZONTAL_SPACING = 250;

export function TaskDependencyGraph({
  task,
  dependencies,
  allRelatedTasks = [],
}: TaskDependencyGraphProps) {
  const router = useRouter();

  // Create nodes for the graph
  const nodes = useMemo(() => {
    const nodes: any[] = [];
    const processedTasks = new Set<string>();

    // Add the main task as the root node
    nodes.push({
      id: task.id,
      type: "taskNode",
      position: { x: NODE_HORIZONTAL_SPACING, y: 0 },
      data: {
        label: task.name,
        status: task.workflow_status,
        type: task.type,
        priority: task.priority,
      },
    });
    processedTasks.add(task.id);

    // Add dependent tasks
    dependencies.forEach((dep, index) => {
      if (!processedTasks.has(dep.depends_on_task_id)) {
        const rowIndex = Math.floor(index / NODES_PER_ROW);
        const colIndex = index % NODES_PER_ROW;
        
        nodes.push({
          id: dep.depends_on_task_id,
          type: "taskNode",
          position: {
            x: colIndex * NODE_HORIZONTAL_SPACING,
            y: (rowIndex + 1) * LEVEL_HEIGHT,
          },
          data: {
            label: dep.tasks.name,
            status: dep.tasks.workflow_status,
            type: "dependency",
            dependencyType: dep.dependency_type,
          },
        });
        processedTasks.add(dep.depends_on_task_id);
      }
    });

    return nodes;
  }, [task, dependencies]);

  // Create edges for the graph
  const edges = useMemo(() => {
    return dependencies.map((dep) => ({
      id: `${task.id}-${dep.depends_on_task_id}`,
      source: task.id,
      target: dep.depends_on_task_id,
      type: "smoothstep",
      animated: true,
      label: dep.dependency_type,
      style: { stroke: "#64748b" },
    }));
  }, [task.id, dependencies]);

  // Custom node styles
  const nodeTypes = useMemo(
    () => ({
      taskNode: ({ data }: any) => (
        <div
          className={`p-4 rounded-lg shadow-md w-[${NODE_WIDTH}px] cursor-pointer
            ${
              data.status === "completed"
                ? "bg-green-100 border-green-500"
                : data.status === "in_progress"
                ? "bg-yellow-100 border-yellow-500"
                : "bg-white border-gray-300"
            } border-2`}
        >
          <div className="text-sm font-medium truncate">{data.label}</div>
          <div className="flex gap-2 mt-2">
            <span
              className={`text-xs px-2 py-1 rounded-full
                ${
                  data.status === "completed"
                    ? "bg-green-200 text-green-800"
                    : data.status === "in_progress"
                    ? "bg-yellow-200 text-yellow-800"
                    : "bg-gray-200 text-gray-800"
                }`}
            >
              {data.status}
            </span>
            {data.type && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                {data.type}
              </span>
            )}
          </div>
        </div>
      ),
    }),
    []
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      router.push(`/tasks/${node.id}`);
    },
    [router]
  );

  return (
    <div className="w-full h-[500px] border rounded-lg bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <Panel position="top-left" className="bg-white p-2 rounded shadow-md">
          <h3 className="text-sm font-medium">Task Dependencies</h3>
          <p className="text-xs text-muted-foreground">
            Click on a task to view details
          </p>
        </Panel>
      </ReactFlow>
    </div>
  );
} 