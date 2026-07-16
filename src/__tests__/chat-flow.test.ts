import { describe, expect, it, vi } from "vitest";

function createMockStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i]));
        i++;
      } else {
        controller.close();
      }
    },
  });
}

function createTrackingSetMessages() {
  let state: string[] = [];
  const capturedStates: string[][] = [];
  const fn = (updater: (prev: string[]) => string[]) => {
    state = updater(state);
    capturedStates.push([...state]);
  };
  return { fn, capturedStates };
}

/** Simulates the streaming handleSendMessage from page.tsx */
async function simulateSendMessage(
  currentNodeId: string,
  selectedChatId: string | null,
  deps: {
    fetch: typeof fetch;
    setMessages: (fn: (prev: string[]) => string[]) => void;
    loadOwnMessages: (nodeId: string) => Promise<string[]>;
    getChatTree: (chatId: string) => Promise<string[]>;
    getUserChats: () => Promise<{ id: string; title: string | null }[]>;
  },
) {
  deps.setMessages((prev) => [...prev, "user:hi", "assistant:"]);

  const res = await deps.fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodeId: currentNodeId, message: "hi" }),
  });

  if (res.ok && selectedChatId) {
    const reader = res.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        deps.setMessages((prev) =>
          prev.map((m) =>
            m.startsWith("assistant:") ? `assistant:${accumulated}` : m,
          ),
        );
      }
    }

    await deps.loadOwnMessages(currentNodeId);
    await deps.getChatTree(selectedChatId);
    await deps.getUserChats();
  }
}

describe("Progressive streaming (tokens appear before DB save)", () => {
  it("appends tokens to the assistant message as they arrive", async () => {
    const { fn: setMessages, capturedStates } = createTrackingSetMessages();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: createMockStream(["Hel", "lo ", "World"]),
    });
    const loadOwnMessages = vi.fn();
    const getChatTree = vi.fn();
    const getUserChats = vi.fn();

    await simulateSendMessage("node1", "chat1", {
      fetch: mockFetch as unknown as typeof fetch,
      setMessages: setMessages as unknown as (
        fn: (prev: string[]) => string[],
      ) => void,
      loadOwnMessages,
      getChatTree,
      getUserChats,
    });

    // capturedStates[0]: initial (user + empty assistant)
    expect(capturedStates[0]).toEqual(["user:hi", "assistant:"]);

    // After streaming: tokens appear progressively
    const streamingUpdates = capturedStates.slice(1);
    const lastStreamState = streamingUpdates[streamingUpdates.length - 1] ?? [];
    const assistantContent = lastStreamState.find((m) =>
      m.startsWith("assistant:"),
    );

    // DESIRED: the last streaming update has the full "assistant:Hello World"
    // BUG (if regression): the assistant message is still "assistant:"
    expect(assistantContent).toBe("assistant:Hello World");
    expect(loadOwnMessages).toHaveBeenCalledWith("node1");
    expect(getUserChats).toHaveBeenCalled();
  });

  it("streams chunks progressively (incremental content growth)", async () => {
    const { fn: setMessages, capturedStates } = createTrackingSetMessages();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: createMockStream(["A", "B", "C"]),
    });

    await simulateSendMessage("node1", "chat1", {
      fetch: mockFetch as unknown as typeof fetch,
      setMessages: setMessages as unknown as (
        fn: (prev: string[]) => string[],
      ) => void,
      loadOwnMessages: vi.fn(),
      getChatTree: vi.fn(),
      getUserChats: vi.fn(),
    });

    // Get streaming updates (skip the initial state at [0])
    const streamingUpdates = capturedStates.slice(1);
    const assistantContents = streamingUpdates.map(
      (state) => state.find((m) => m.startsWith("assistant:")) ?? "",
    );

    // DESIRED: each chunk produces a new state with the accumulated text
    // "A" → "AB" → "ABC"
    expect(assistantContents.length).toBeGreaterThanOrEqual(3);
    expect(assistantContents[0]).toBe("assistant:A");
    expect(assistantContents[1]).toBe("assistant:AB");
    expect(assistantContents[2]).toBe("assistant:ABC");
  });
});
