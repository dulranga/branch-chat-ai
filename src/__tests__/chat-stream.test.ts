import { streamText } from "ai";
import { describe, expect, it } from "vitest";
import { getModel } from "@/lib/llm";

describe("chat stream", () => {
  it("streams a response", async () => {
    if (!process.env.OPENROUTER_API_KEY) {
      return;
    }

    const result = streamText({
      model: getModel(),
      messages: [{ role: "user", content: 'Reply with exactly "hello world"' }],
    });

    const text = await result.text;
    expect(text.toLowerCase()).toContain("hello");
  }, 60000);
});
