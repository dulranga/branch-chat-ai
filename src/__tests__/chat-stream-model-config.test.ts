// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mockStreamText = vi.fn();
const mockDecryptApiKey = vi.fn();
const mockGetActiveModel = vi.fn();
const mockGetLatestUserModel = vi.fn();
const mockGetNode = vi.fn();
const mockGetNodeMessages = vi.fn();
const mockGetAncestorMessages = vi.fn();
const mockAppendMessage = vi.fn();
const mockGetSystemModelInstance = vi.fn();
const mockGetUserModelInstance = vi.fn();
const mockGetProviderOptions = vi.fn();
const mockAuth = {
  api: {
    getSession: vi.fn(),
  },
};

vi.mock("ai", () => ({
  streamText: mockStreamText,
  generateText: vi.fn(),
}));

vi.mock("@/data-access", () => ({
  decryptApiKey: mockDecryptApiKey,
  getActiveModel: mockGetActiveModel,
  getLatestUserModel: mockGetLatestUserModel,
  getNode: mockGetNode,
  getNodeMessages: mockGetNodeMessages,
  getAncestorMessages: mockGetAncestorMessages,
  appendMessage: mockAppendMessage,
}));

vi.mock("@/lib/llm", () => ({
  getSystemModelInstance: mockGetSystemModelInstance,
  getUserModelInstance: mockGetUserModelInstance,
}));

vi.mock("@/lib/provider-options", () => ({
  getProviderOptions: mockGetProviderOptions,
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("next/headers", () => ({
  headers: () => new Headers({ cookie: "session=test" }),
}));

const mockLanguageModel = { id: "lang-model" };

describe("chat api stream with model config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: "u1" },
      session: { id: "s1" },
    });
    mockGetNode.mockResolvedValue({
      id: "node-1",
      userId: "u1",
      chatId: "chat-1",
      path: "/node-1",
    });
    mockGetNodeMessages.mockResolvedValue([]);
    mockGetAncestorMessages.mockResolvedValue([]);
    mockGetActiveModel.mockResolvedValue({
      id: "model-1",
      provider: "openai",
      model: "gpt-4o",
      name: "My Model",
    });
    mockDecryptApiKey.mockResolvedValue("sk-test-key");
    mockGetUserModelInstance.mockResolvedValue(mockLanguageModel);
    mockGetSystemModelInstance.mockResolvedValue(mockLanguageModel);
    mockGetProviderOptions.mockReturnValue({
      openai: { reasoningEffort: "medium" },
    });
    mockAppendMessage.mockImplementation(
      (
        nodeId: string,
        content: string,
        role: string,
        replyTo?: string,
        modelConfigId?: string | null,
        reasoningLevel?: string | null,
      ) => {
        const obj = {
          id: `msg-${Date.now()}`,
          order: 0,
          content,
          role,
          nodeId,
          modelConfigId: modelConfigId ?? null,
          reasoningLevel: reasoningLevel ?? null,
        };
        return Promise.resolve(obj);
      },
    );
  });

  it("reads active model and decrypts API key when modelConfigId provided", async () => {
    mockStreamText.mockImplementation(
      ({ model, providerOptions, onFinish }: Record<string, unknown>) => {
        expect(model).toBe(mockLanguageModel);
        expect(providerOptions).toEqual({
          openai: { reasoningEffort: "medium" },
        });
        (onFinish as (opts: { text: string }) => void)({ text: "Hello from AI!" });
        return { toTextStreamResponse: () => new Response("stream") };
      },
    );

    const { POST } = await import("@/app/api/chat/route");
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        id: "node-1",
        modelConfigId: "model-1",
        reasoningLevel: "medium",
      }),
    });

    await POST(req);

    expect(mockGetActiveModel).toHaveBeenCalled();
    expect(mockDecryptApiKey).toHaveBeenCalledWith("model-1");
    expect(mockGetUserModelInstance).toHaveBeenCalledWith(
      "openai",
      "gpt-4o",
      "sk-test-key",
    );
  });

  it("stores model_config_id and reasoning_level on user message", async () => {
    mockStreamText.mockImplementation(
      ({ onFinish }: Record<string, unknown>) => {
        (onFinish as (opts: { text: string }) => void)({ text: "response" });
        return { toTextStreamResponse: () => new Response("stream") };
      },
    );

    const { POST } = await import("@/app/api/chat/route");
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        id: "node-1",
        modelConfigId: "model-1",
        reasoningLevel: "medium",
      }),
    });

    await POST(req);

    const appendCalls =
      mockAppendMessage.mock.calls as unknown[][];
    const userMsgCall = appendCalls.find(
      (call) => call[2] === "user",
    );
    expect(userMsgCall).toBeDefined();
    expect(userMsgCall![4]).toBe("model-1");
    expect(userMsgCall![5]).toBe("medium");

    const assistantMsgCall = appendCalls.find(
      (call) => call[2] === "assistant",
    );
    expect(assistantMsgCall).toBeDefined();
    expect(assistantMsgCall![4]).toBe("model-1");
    expect(assistantMsgCall![5]).toBe("medium");
  });

  it("falls back to system model when no active model is set", async () => {
    mockGetActiveModel.mockResolvedValue(null);

    mockStreamText.mockImplementation(
      ({ onFinish }: Record<string, unknown>) => {
        (onFinish as (opts: { text: string }) => void)({ text: "response" });
        return { toTextStreamResponse: () => new Response("stream") };
      },
    );

    const { POST } = await import("@/app/api/chat/route");
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        id: "node-1",
        modelConfigId: null,
        reasoningLevel: "provider-default",
      }),
    });

    await POST(req);

    expect(mockGetSystemModelInstance).toHaveBeenCalled();
    expect(mockDecryptApiKey).not.toHaveBeenCalled();
  });

  it("passes providerOptions from reasoningLevel", async () => {
    let capturedProviderOptions: unknown;
    mockStreamText.mockImplementation(
      ({ providerOptions, onFinish }: Record<string, unknown>) => {
        capturedProviderOptions = providerOptions;
        (onFinish as (opts: { text: string }) => void)({ text: "response" });
        return { toTextStreamResponse: () => new Response("stream") };
      },
    );

    const { POST } = await import("@/app/api/chat/route");
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        id: "node-1",
        modelConfigId: "model-1",
        reasoningLevel: "medium",
      }),
    });

    await POST(req);

    expect(mockGetProviderOptions).toHaveBeenCalledWith("medium", "openai");
  });
});
