"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Node } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TreeNodeData {
  label: string;
  isActive: boolean;
  hasChildren: boolean;
  isRoot: boolean;
  node: Node;
  onDelete?: (node: Node) => void;
  onMerge?: (nodeId: string) => void;
}

export function TreeNode({ data }: NodeProps) {
  const d = data as unknown as TreeNodeData;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            style={{
              background: d.isActive
                ? "hsl(var(--primary))"
                : "hsl(var(--card))",
              color: d.isActive
                ? "hsl(var(--primary-foreground))"
                : "hsl(var(--card-foreground))",
              border: d.isActive
                ? "2px solid hsl(var(--ring))"
                : "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              padding: "8px 16px",
              boxShadow: d.isActive
                ? "0 4px 12px rgba(0,0,0,0.15)"
                : "0 1px 3px rgba(0,0,0,0.1)",
              fontSize: "0.875rem",
              fontWeight: d.isActive ? "600" : "400",
              cursor: "pointer",
            }}
          >
            {d.label}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex gap-1 p-1">
          {d.onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                d.onDelete?.(d.node);
              }}
              className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Delete
            </button>
          )}
          {d.onMerge && !d.isRoot && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                d.onMerge?.(d.node.id);
              }}
              className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
            >
              Merge
            </button>
          )}
        </TooltipContent>
      </Tooltip>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </TooltipProvider>
  );
}
