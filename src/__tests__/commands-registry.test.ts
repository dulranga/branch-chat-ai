import { describe, expect, it, beforeEach } from "vitest";
import {
  registerCommand,
  getCommands,
  getCommand,
  resetCommands,
} from "@/lib/commands";

describe("commands registry", () => {
  beforeEach(() => {
    resetCommands();
  });

  it("/branch is registered at module load", () => {
    resetCommands();
    registerCommand({
      trigger: "/branch",
      label: "Branch from current node",
      description: "Create a new branch from the current conversation node",
      execute: () => {},
    });
    const cmd = getCommand("/branch");
    expect(cmd).toBeDefined();
    expect(cmd?.trigger).toBe("/branch");
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
    registerCommand({
      trigger: "/branch",
      label: "Branch from current node",
      description: "Create a new branch from the current conversation node",
      execute: () => {},
    });
    const all = getCommands();
    expect(all.length).toBe(1);
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
