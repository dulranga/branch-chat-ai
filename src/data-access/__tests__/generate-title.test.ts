import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: "u1" },
        session: { id: "s1" },
      }),
    },
  },
}));

const mockSelectResult = vi.fn();

function createThenable() {
  let val: unknown;
  const p = Promise.resolve().then(() => {
    if (val === undefined) val = mockSelectResult();
    return val;
  });
  const thenable = {
    then: p.then.bind(p),
    catch: p.catch.bind(p),
    finally: p.finally.bind(p),
    orderBy: () => thenable,
  };
  return thenable;
}

const mockDbWhere = vi.fn(() => createThenable());
const mockDbFrom = vi.fn(() => ({ where: mockDbWhere }));
const mockDbUpdate = vi.fn(() => ({
  set: vi.fn(() => ({
    where: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({ from: mockDbFrom }),
    update: mockDbUpdate,
  },
}));

const mockGenerateText = vi.fn();
vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

describe("generateTitle", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("generates a title from the first user message", async () => {
    const { generateTitle } = await import("../index");

    mockSelectResult
      .mockReturnValueOnce([
        { id: "node-1", userId: "u1", chatId: "chat-1", title: null },
      ])
      .mockReturnValueOnce([
        { id: "node-1", userId: "u1", chatId: "chat-1", title: null },
      ])
      .mockReturnValueOnce([
        {
          id: "m1",
          nodeId: "node-1",
          role: "user",
          content: "Hello I need help with math",
          order: 0,
          replyTo: null,
          modelConfigId: null,
          reasoningLevel: null,
          createdAt: new Date(),
        },
      ]);

    mockGenerateText.mockResolvedValue({ text: "Help with Math" });

    const result = await generateTitle("node-1");

    expect(result).toBe("Help with Math");
    expect(mockGenerateText).toHaveBeenCalledOnce();
  });

  it("refines the title at 3 user messages, but stops at 4+", async () => {
    const { generateTitle } = await import("../index");

    mockGenerateText.mockResolvedValue({ text: "Refined Math Help" });

    mockSelectResult
      .mockReturnValueOnce([
        { id: "node-1", userId: "u1", chatId: "chat-1", title: null },
      ])
      .mockReturnValueOnce([
        { id: "node-1", userId: "u1", chatId: "chat-1", title: null },
      ])
      .mockReturnValueOnce([
        { id: "m1", nodeId: "node-1", role: "user", content: "hi", order: 0, replyTo: null, modelConfigId: null, reasoningLevel: null, createdAt: new Date() },
        { id: "m2", nodeId: "node-1", role: "user", content: "need help", order: 1, replyTo: null, modelConfigId: null, reasoningLevel: null, createdAt: new Date() },
        { id: "m3", nodeId: "node-1", role: "user", content: "with math", order: 2, replyTo: null, modelConfigId: null, reasoningLevel: null, createdAt: new Date() },
      ]);

    const result = await generateTitle("node-1");

    expect(result).toBe("Refined Math Help");
    expect(mockGenerateText).toHaveBeenCalledOnce();
  });

  it("skips title generation after the 3rd user message (4+ messages)", async () => {
    const { generateTitle } = await import("../index");

    mockSelectResult
      .mockReturnValueOnce([
        { id: "node-1", userId: "u1", chatId: "chat-1", title: null },
      ])
      .mockReturnValueOnce([
        { id: "node-1", userId: "u1", chatId: "chat-1", title: null },
      ])
      .mockReturnValueOnce([
        { id: "m1", role: "user", content: "a", order: 0 },
        { id: "m2", role: "user", content: "b", order: 1 },
        { id: "m3", role: "user", content: "c", order: 2 },
        { id: "m4", role: "user", content: "d", order: 3 },
      ]);

    const result = await generateTitle("node-1");

    expect(result).toBeNull();
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("does not generate a title when there are no user messages at all", async () => {
    const { generateTitle } = await import("../index");

    mockSelectResult
      .mockReturnValueOnce([
        { id: "node-1", userId: "u1", chatId: "chat-1", title: null },
      ])
      .mockReturnValueOnce([]);

    const result = await generateTitle("node-1");

    expect(result).toBeNull();
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it("does not update chat title when node is not root", async () => {
    mockDbUpdate.mockClear();
    const { generateTitle } = await import("../index");

    mockGenerateText.mockResolvedValue({ text: "Fork Title" });

    mockSelectResult
      .mockReturnValueOnce([
        { id: "node-2", userId: "u1", chatId: "chat-1", parentId: "node-1", title: null },
      ])
      .mockReturnValueOnce([
        { id: "node-2", userId: "u1", chatId: "chat-1", parentId: "node-1", title: null },
      ])
      .mockReturnValueOnce([
        { id: "m1", nodeId: "node-2", role: "user", content: "Tell me a joke", order: 0, replyTo: null, modelConfigId: null, reasoningLevel: null, createdAt: new Date() },
      ]);

    const result = await generateTitle("node-2");

    expect(result).toBe("Fork Title");
    expect(mockDbUpdate).toHaveBeenCalledTimes(1);
  });
});
