// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CommandPalette } from "@/components/chat/command-palette";

const mockExecute = vi.fn();

vi.mock("@/lib/commands", () => ({
  getCommands: () => [
    {
      trigger: "/branch",
      label: "Branch from current node",
      description: "Create a new branch from the current conversation node",
      execute: mockExecute,
    },
  ],
}));

describe("CommandPalette", () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  it("renders the trigger button", () => {
    render(<CommandPalette context={{ onFork: vi.fn() }} />);
    expect(screen.getByText("Commands")).toBeDefined();
  });

  it("shows /branch command when opened", () => {
    render(<CommandPalette context={{ onFork: vi.fn() }} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    expect(screen.getByText("/branch")).toBeDefined();
  });

  it("calls execute with context when a command is selected", () => {
    const onFork = vi.fn();
    render(<CommandPalette context={{ onFork }} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    const item = screen.getByText("/branch");
    fireEvent.click(item);
    expect(mockExecute).toHaveBeenCalledWith({ onFork });
  });

  it("calls onFork when /branch is executed", () => {
    const onFork = vi.fn();
    mockExecute.mockImplementation((ctx: { onFork: (id: string) => void }) => {
      ctx.onFork("");
    });
    render(<CommandPalette context={{ onFork }} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    const item = screen.getByText("/branch");
    fireEvent.click(item);
    expect(onFork).toHaveBeenCalledWith("");
  });
});
