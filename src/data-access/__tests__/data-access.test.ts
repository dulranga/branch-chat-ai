import { describe, expect, it } from "vitest";

describe("Data Access Layer – smoke", () => {
  it("should export the expected server action functions", async () => {
    const mod = await import("../index");
    const functionNames = [
      "createChat",
      "forkNode",
      "appendMessage",
      "getNode",
      "getNodeMessages",
      "getUserChats",
      "getChat",
      "getChatTree",
      "getChatRootNode",
      "deleteChat",
      "getAncestorMessages",
      "editLastMessage",
      "deleteNode",
      "mergeNode",
      "getSubtree",
      "generateTitle",
    ];
    for (const name of functionNames) {
      expect(typeof mod[name as keyof typeof mod]).toBe("function");
    }
  });
});
