import { describe, expect, it } from "vitest";
import type { Message } from "@/lib/types";

/**
 * Combines ancestor messages with current node messages for display.
 * Ancestor messages shown first, then current node's messages.
 */
function combineMessages(
  ancestorMsgs: Message[],
  nodeMsgs: Message[],
): Message[] {
  return [...ancestorMsgs, ...nodeMsgs];
}

describe("combineMessages", () => {
  const ancestorMsgs: Message[] = [
    {
      id: "a1",
      nodeId: "ancestor",
      role: "user",
      content: "Ancestor user msg",
      order: 0,
      replyTo: null,
      modelConfigId: null,
      reasoningLevel: null,
      createdAt: new Date("2024-01-01"),
    },
    {
      id: "a2",
      nodeId: "ancestor",
      role: "assistant",
      content: "Ancestor AI response",
      order: 1,
      replyTo: "a1",
      modelConfigId: null,
      reasoningLevel: null,
      createdAt: new Date("2024-01-01"),
    },
  ];

  const nodeMsgs: Message[] = [
    {
      id: "n1",
      nodeId: "current",
      role: "user",
      content: "Current user msg",
      order: 0,
      replyTo: null,
      modelConfigId: null,
      reasoningLevel: null,
      createdAt: new Date("2024-01-02"),
    },
  ];

  it("returns ancestor messages before current node messages", () => {
    const combined = combineMessages(ancestorMsgs, nodeMsgs);
    expect(combined[0].id).toBe("a1");
    expect(combined[1].id).toBe("a2");
    expect(combined[2].id).toBe("n1");
  });

  it("includes all messages from both sources", () => {
    const combined = combineMessages(ancestorMsgs, nodeMsgs);
    expect(combined).toHaveLength(3);
  });

  it("returns only node messages when no ancestors", () => {
    const combined = combineMessages([], nodeMsgs);
    expect(combined).toHaveLength(1);
    expect(combined[0].id).toBe("n1");
  });

  it("returns only ancestor messages when no node messages", () => {
    const combined = combineMessages(ancestorMsgs, []);
    expect(combined).toHaveLength(2);
  });
});
