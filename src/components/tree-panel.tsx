"use client";

import {
  Background,
  Controls,
  type Edge,
  type Node as FlowNode,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import type { Node } from "@/lib/types";
import { layoutTree } from "@/lib/tree-layout";
import { TreeNode } from "@/components/tree-node";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TreePanelProps {
  nodes: Node[];
  currentNode: Node | null;
  onSelectNode: (node: Node) => void;
  onDeleteNode: (nodeId: string) => void;
  onMergeNode: (nodeId: string) => void;
  isMobileTree?: boolean;
}

export function TreePanel({
  nodes: treeNodes,
  currentNode,
  onSelectNode,
  onDeleteNode,
  onMergeNode,
  isMobileTree,
}: TreePanelProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<Node | null>(null);

  const handleDeleteClick = useCallback((node: Node) => {
    setNodeToDelete(node);
    setDeleteDialogOpen(true);
  }, []);

  const nodePositions = useMemo(() => layoutTree(treeNodes), [treeNodes]);

  const flowNodes: FlowNode[] = treeNodes.map((n) => {
    const pos = nodePositions.get(n.id) || { x: 0, y: 0 };
    const isActive = currentNode?.id === n.id;
    return {
      id: n.id,
      type: "treeNode",
      position: pos,
      data: {
        label: n.title || "Untitled",
        isActive,
        hasChildren: treeNodes.some((c) => c.parentId === n.id),
        isRoot: !n.parentId,
        node: n,
        onDelete: handleDeleteClick,
        onMerge: onMergeNode,
      },
    };
  });

  const flowEdges: Edge[] = treeNodes
    .filter((n): n is Node & { parentId: string } => !!n.parentId)
    .map((n) => ({
      id: `${n.parentId}-${n.id}`,
      source: n.parentId,
      target: n.id,
      type: "smoothstep",
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "var(--muted-foreground)",
      },
      style: { stroke: "var(--muted-foreground)", opacity: 0.6 },
    }));

  const [fNodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [fEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const nodeTypes = useMemo(
    () => ({ treeNode: TreeNode }),
    [],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, flowNode: FlowNode) => {
      const treeNode = treeNodes.find((n) => n.id === flowNode.id);
      if (treeNode) {
        onSelectNode(treeNode);
        setSelectedNodeId(treeNode.id);
      }
    },
    [treeNodes, onSelectNode],
  );

  const confirmDelete = useCallback(() => {
    if (nodeToDelete) {
      onDeleteNode(nodeToDelete.id);
      setDeleteDialogOpen(false);
      setNodeToDelete(null);
      setSelectedNodeId(null);
    }
  }, [nodeToDelete, onDeleteNode]);

  const selectedNode = useMemo(
    () => treeNodes.find((n) => n.id === selectedNodeId) || currentNode,
    [treeNodes, selectedNodeId, currentNode],
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`${isMobileTree ? "h-full" : "h-full"} relative`}>
        <ReactFlow
          nodes={fNodes}
          edges={fEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Controls />
          <MiniMap
            style={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
            }}
            nodeColor={(node) =>
              node.data?.isActive
                ? "var(--primary)"
                : "var(--muted)"
            }
            maskColor="color-mix(in oklab, var(--background) 80%, transparent)"
          />
          <Background
            color="var(--border)"
            gap={16}
            size={1}
          />
        </ReactFlow>

        {selectedNode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-card border border-border rounded-lg shadow-lg p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(selectedNode)}
                >
                  Delete
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Delete this node and all children
              </TooltipContent>
            </Tooltip>
            {selectedNode.parentId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onMergeNode(selectedNode.id)}
                  >
                    Merge
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Merge this branch into parent
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Node</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;
                {nodeToDelete?.title || "Untitled"}&rdquo; and all its
                children? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export function MobileTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: "chat" | "tree";
  onTabChange: (tab: "chat" | "tree") => void;
}) {
  return (
    <div className="flex border-b border-border md:hidden">
      <button
        type="button"
        onClick={() => onTabChange("chat")}
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "chat"
            ? "text-primary border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Chat
      </button>
      <button
        type="button"
        onClick={() => onTabChange("tree")}
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === "tree"
            ? "text-primary border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Tree
      </button>
    </div>
  );
}
