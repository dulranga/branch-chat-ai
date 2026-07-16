// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChatArea } from "@/components/chat-area";
import type { Message, Node } from "@/lib/types";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: {
      session: { id: "s1" },
      user: { id: "u1", email: "test@example.com" },
    },
    isPending: false,
  }),
}));

const mockNode: Node = {
  id: "node-1",
  userId: "u1",
  chatId: "chat-1",
  parentId: null,
  title: "Test Conversation",
  path: "/node-1",
  createdAt: new Date(),
};

const mockMessages: Message[] = [
  {
    id: "m1",
    nodeId: "node-1",
    role: "user",
    content: "Hello there",
    order: 0,
    replyTo: null,
    createdAt: new Date(),
  },
  {
    id: "m2",
    nodeId: "node-1",
    role: "assistant",
    content: "Hi! How can I help you?",
    order: 1,
    replyTo: "m1",
    createdAt: new Date(),
  },
];

describe("ChatArea", () => {
  it("shows empty state when no node", () => {
    render(
      <ChatArea
        node={null}
        messages={[]}
        onSendMessage={vi.fn()}
        onFork={vi.fn()}
        onEditMessage={vi.fn()}
      />,
    );
    expect(screen.getByText(/No conversation yet/i)).toBeDefined();
  });

  it("renders messages", () => {
    render(
      <ChatArea
        node={mockNode}
        messages={mockMessages}
        onSendMessage={vi.fn()}
        onFork={vi.fn()}
        onEditMessage={vi.fn()}
      />,
    );
    expect(screen.getByText("Hello there")).toBeDefined();
    expect(screen.getByText("Hi! How can I help you?")).toBeDefined();
  });

  it("shows the node title", () => {
    render(
      <ChatArea
        node={mockNode}
        messages={mockMessages}
        onSendMessage={vi.fn()}
        onFork={vi.fn()}
        onEditMessage={vi.fn()}
      />,
    );
    expect(screen.getByText("Test Conversation")).toBeDefined();
  });
});
