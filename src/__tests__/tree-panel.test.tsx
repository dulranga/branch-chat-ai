// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TreePanel } from "@/components/tree-panel";
import type { Node } from "@/lib/types";

const mockNodes: Node[] = [
  {
    id: "root",
    userId: "u1",
    chatId: "chat-1",
    parentId: null,
    title: "Root",
    path: "/root",
    createdAt: new Date(),
  },
  {
    id: "child-1",
    userId: "u1",
    chatId: "chat-1",
    parentId: "root",
    title: "Child 1",
    path: "/root/child-1",
    createdAt: new Date(),
  },
  {
    id: "child-2",
    userId: "u1",
    chatId: "chat-1",
    parentId: "root",
    title: "Child 2",
    path: "/root/child-2",
    createdAt: new Date(),
  },
];

describe("TreePanel", () => {
  it("renders without crashing with mock nodes", () => {
    const { container } = render(
      <TreePanel
        nodes={mockNodes}
        currentNode={mockNodes[0]}
        onSelectNode={vi.fn()}
        onDeleteNode={vi.fn()}
        onMergeNode={vi.fn()}
      />,
    );
    // ReactFlow renders a div with class "react-flow"
    expect(container.querySelector(".react-flow")).toBeDefined();
  });

  it("renders without crashing with empty nodes", () => {
    render(
      <TreePanel
        nodes={[]}
        currentNode={null}
        onSelectNode={vi.fn()}
        onDeleteNode={vi.fn()}
        onMergeNode={vi.fn()}
      />,
    );
  });
});
