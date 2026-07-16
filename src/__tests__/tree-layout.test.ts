import { describe, expect, it } from "vitest";
import type { Node } from "@/lib/types";

function calculateTreeLayout(nodes: Node[]) {
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
    if (children.length === 0) return startX + 100;

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

describe("calculateTreeLayout", () => {
  const mkNode = (id: string, parentId: string | null): Node => ({
    id,
    userId: "u1",
    parentId,
    title: null,
    path: `/${id}`,
    createdAt: new Date(),
  });

  it("returns positions that are NOT all at x=0 (non-vertical layout)", () => {
    const nodes = [
      mkNode("root", null),
      mkNode("c1", "root"),
      mkNode("c2", "root"),
    ];
    const positions = calculateTreeLayout(nodes);
    const xPositions = nodes.map((n) => positions.get(n.id)?.x);
    expect(new Set(xPositions).size).toBeGreaterThan(1);
  });

  it("places children below their parent (y increases with depth)", () => {
    const nodes = [
      mkNode("root", null),
      mkNode("c1", "root"),
      mkNode("gc1", "c1"),
    ];
    const positions = calculateTreeLayout(nodes);
    const rootPos = positions.get("root");
    const c1Pos = positions.get("c1");
    const gc1Pos = positions.get("gc1");
    expect(rootPos).toBeDefined();
    expect(c1Pos).toBeDefined();
    expect(gc1Pos).toBeDefined();
    expect(rootPos!.y).toBeLessThan(c1Pos!.y);
    expect(c1Pos!.y).toBeLessThan(gc1Pos!.y);
  });

  it("handles a single root node", () => {
    const nodes = [mkNode("root", null)];
    const positions = calculateTreeLayout(nodes);
    const p = positions.get("root");
    expect(p).toBeDefined();
    expect(typeof p!.x).toBe("number");
    expect(typeof p!.y).toBe("number");
  });
});
