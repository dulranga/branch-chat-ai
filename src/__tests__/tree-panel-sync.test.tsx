/// <reference types="vitest/globals" />
// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import type { Edge, Node } from "@xyflow/react";
import { useEdgesState, useNodesState } from "@xyflow/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";

/**
 * Tests the FIX pattern for TreePanel Bug 2:
 * useNodesState/useEdgesState only read initial value on mount, so we
 * must manually sync via useEffect + setNodes/setEdges.
 */
describe("TreePanel sync pattern (Bug 2 regression)", () => {
  it("manually syncing useNodesState via useEffect updates nodes on prop change", () => {
    const initialNodes: Node[] = [
      { id: "root", position: { x: 0, y: 0 }, data: { label: "Root" } },
    ];

    const { rerender, result } = renderHook(
      ({ nodes }: { nodes: Node[] }) => {
        const [fNodes, setNodes, _onNodesChange] = useNodesState(nodes);
        useEffect(() => {
          setNodes(nodes);
        }, [nodes, setNodes]);
        return fNodes;
      },
      { initialProps: { nodes: initialNodes } },
    );

    expect(result.current).toHaveLength(1);

    const newNodes: Node[] = [
      { id: "root", position: { x: 0, y: 0 }, data: { label: "Root" } },
      { id: "child", position: { x: 200, y: 100 }, data: { label: "Child" } },
    ];
    rerender({ nodes: newNodes });

    expect(result.current).toHaveLength(2);
    expect(result.current[1].id).toBe("child");
  });

  it("manually syncing useEdgesState via useEffect updates edges on prop change", () => {
    const initialEdges: Edge[] = [];
    const { rerender, result } = renderHook(
      ({ edges }: { edges: Edge[] }) => {
        const [fEdges, setEdges, _onEdgesChange] = useEdgesState(edges);
        useEffect(() => {
          setEdges(edges);
        }, [edges, setEdges]);
        return fEdges;
      },
      { initialProps: { edges: initialEdges } },
    );

    expect(result.current).toHaveLength(0);

    const newEdges: Edge[] = [
      { id: "root-child", source: "root", target: "child" },
    ];
    rerender({ edges: newEdges });

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe("root-child");
  });
});
