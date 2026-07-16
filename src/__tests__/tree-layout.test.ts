import { describe, expect, it } from "vitest";
import type { Node } from "@/lib/types";
import { layoutTree } from "@/lib/tree-layout";

describe("layoutTree", () => {
  const mkNode = (id: string, parentId: string | null): Node => ({
    id,
    userId: "u1",
    chatId: "chat1",
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
    const positions = layoutTree(nodes);
    const xPositions = nodes.map((n) => positions.get(n.id)?.x);
    expect(new Set(xPositions).size).toBeGreaterThan(1);
  });

  it("places children below their parent (y increases with depth)", () => {
    const nodes = [
      mkNode("root", null),
      mkNode("c1", "root"),
      mkNode("gc1", "c1"),
    ];
    const positions = layoutTree(nodes);
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
    const positions = layoutTree(nodes);
    const p = positions.get("root");
    expect(p).toBeDefined();
    expect(typeof p!.x).toBe("number");
    expect(typeof p!.y).toBe("number");
  });
});
