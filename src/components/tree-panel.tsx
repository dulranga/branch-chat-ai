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
import { useCallback, useMemo } from "react";
import "@xyflow/react/dist/style.css";
import type { Node } from "@/lib/types";

interface TreePanelProps {
  nodes: Node[];
  currentNode: Node | null;
  onSelectNode: (node: Node) => void;
  onDeleteNode: (nodeId: string) => void;
  onMergeNode: (nodeId: string) => void;
  isMobileTree?: boolean;
}

/** Positions nodes in a tree shape using DFS layout. */
function layoutTree(nodes: Node[]) {
  const childrenMap = new Map<string | null, Node[]>();
  for (const node of nodes) {
    const parentKey = node.parentId;
    if (!childrenMap.has(parentKey)) childrenMap.set(parentKey, []);
    const siblings = childrenMap.get(parentKey);
    if (siblings) siblings.push(node);
  }

  const positions = new Map<string, { x: number; y: number }>();

  function layoutSubtree(
    parentId: string | null,
    level: number,
    startX: number,
  ): number {
    const children = childrenMap.get(parentId) || [];
    if (children.length === 0) return startX + 160;

    let cursor = startX;
    for (const child of children) {
      const subtreeEnd = layoutSubtree(child.id, level + 1, cursor);
      const cx = (cursor + subtreeEnd) / 2;
      positions.set(child.id, { x: cx, y: level * 100 + 50 });
      cursor = subtreeEnd + 60;
    }

    const parentSpan = cursor - startX;
    const parentX = startX + parentSpan / 2;
    if (parentId) {
      positions.set(parentId, {
        x: parentX,
        y: (level - 1) * 100 + 50,
      });
    }

    return cursor;
  }

  layoutSubtree(null, 1, 0);
  return positions;
}

export function TreePanel({
  nodes: treeNodes,
  currentNode,
  onSelectNode,
  onDeleteNode,
  onMergeNode,
  isMobileTree,
}: TreePanelProps) {
  const nodePositions = useMemo(() => layoutTree(treeNodes), [treeNodes]);

  const flowNodes: FlowNode[] = treeNodes.map((n) => {
    const pos = nodePositions.get(n.id) || { x: 0, y: 0 };
    return {
      id: n.id,
      type: "default",
      position: pos,
      data: {
        label: n.title || "Untitled",
        isActive: currentNode?.id === n.id,
        hasChildren: treeNodes.some((c) => c.parentId === n.id),
        isRoot: !n.parentId,
        node: n,
      },
      style: {
        background: currentNode?.id === n.id ? "#3b82f6" : "#1e293b",
        color: "#fff",
        border:
          currentNode?.id === n.id ? "2px solid #93c5fd" : "1px solid #334155",
        borderRadius: "8px",
        padding: "8px 16px",
        cursor: "pointer",
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
      markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      style: { stroke: "#64748b" },
    }));

  const [fNodes, _setNodes, onNodesChange] = useNodesState(flowNodes);
  const [fEdges, _setEdges, onEdgesChange] = useEdgesState(flowEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      const treeNode = treeNodes.find((n) => n.id === node.id);
      if (treeNode) onSelectNode(treeNode);
    },
    [treeNodes, onSelectNode],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      event.preventDefault();
      const treeNode = treeNodes.find((n) => n.id === node.id);
      if (!treeNode || !treeNode.parentId) return;

      const action = window.confirm(
        `Delete "${treeNode.title || "Untitled"}" and all its children?`,
      );
      if (action) onDeleteNode(treeNode.id);
    },
    [treeNodes, onDeleteNode],
  );

  return (
    <div className={`${isMobileTree ? "h-full" : "h-full"}`}>
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {currentNode?.parentId && (
          <button
            type="button"
            onClick={() => onMergeNode(currentNode.id)}
            className="text-xs px-2 py-1 bg-amber-500 text-white rounded hover:bg-amber-600"
            title="Merge this branch into parent"
          >
            Merge
          </button>
        )}
        {currentNode && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Delete this node and all children?")) {
                onDeleteNode(currentNode.id);
              }
            }}
            className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            title="Delete this node"
          >
            Delete
          </button>
        )}
      </div>
      <ReactFlow
        nodes={fNodes}
        edges={fEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.3}
        maxZoom={2}
      >
        <Controls />
        <MiniMap
          style={{ background: "#0f172a" }}
          nodeColor={(node) => (node.data?.isActive ? "#3b82f6" : "#1e293b")}
        />
        <Background color="#334155" gap={16} />
      </ReactFlow>
    </div>
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
    <div className="flex border-b border-zinc-200 dark:border-zinc-700 md:hidden">
      <button
        type="button"
        onClick={() => onTabChange("chat")}
        className={`flex-1 px-4 py-2 text-sm font-medium ${
          activeTab === "chat"
            ? "text-blue-500 border-b-2 border-blue-500"
            : "text-zinc-500"
        }`}
      >
        Chat
      </button>
      <button
        type="button"
        onClick={() => onTabChange("tree")}
        className={`flex-1 px-4 py-2 text-sm font-medium ${
          activeTab === "tree"
            ? "text-blue-500 border-b-2 border-blue-500"
            : "text-zinc-500"
        }`}
      >
        Tree
      </button>
    </div>
  );
}
