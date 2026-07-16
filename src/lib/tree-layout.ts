import type { Node } from "@/lib/types";

export function layoutTree(nodes: Node[]) {
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
