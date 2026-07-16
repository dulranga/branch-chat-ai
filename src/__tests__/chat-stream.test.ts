import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { describe, expect, it } from "vitest";

const ollama = createOpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama",
});

describe("chat stream with Ollama", () => {
  it("streams a response without credentials", async () => {
    const result = streamText({
      model: ollama.chat("gemma4:12b"),
      messages: [{ role: "user", content: 'Reply with exactly "hello world"' }],
    });

    const text = await result.text;
    expect(text.toLowerCase()).toContain("hello");
  }, 60000);
});
