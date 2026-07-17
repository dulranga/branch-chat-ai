import { describe, expect, it, beforeEach } from "vitest";
import {
  registerCommand,
  getCommands,
  getCommand,
  initCommands,
  resetCommands,
} from "@/lib/commands";

describe("commands registry", () => {
  beforeEach(() => {
    resetCommands();
  });

  it("initCommands registers /branch", () => {
    initCommands();
    const cmd = getCommand("/branch");
    expect(cmd).toBeDefined();
    expect(cmd?.trigger).toBe("/branch");
    expect(cmd?.label).toBe("Branch from current node");
  });

  it("registerCommand adds a command", () => {
    registerCommand({
      trigger: "/test",
      label: "Test command",
      description: "A test command",
      execute: () => {},
    });
    const cmd = getCommand("/test");
    expect(cmd).toBeDefined();
    expect(cmd?.label).toBe("Test command");
  });

  it("getCommands returns all registered commands", () => {
    initCommands();
    const all = getCommands();
    expect(all.length).toBeGreaterThanOrEqual(1);
    expect(all.some((c) => c.trigger === "/branch")).toBe(true);
  });

  it("getCommand returns undefined for unknown trigger", () => {
    expect(getCommand("/nonexistent")).toBeUndefined();
  });

  it("command execute calls the registered function", () => {
    let called = false;
    registerCommand({
      trigger: "/call-test",
      label: "Call test",
      description: "Test execution",
      execute: () => {
        called = true;
      },
    });
    const cmd = getCommand("/call-test");
    cmd?.execute({ onFork: () => {} });
    expect(called).toBe(true);
  });
});
