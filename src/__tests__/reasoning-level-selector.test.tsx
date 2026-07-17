// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReasoningLevelSelector } from "@/components/chat/reasoning-level-selector";

vi.mock("@/lib/provider-options", () => ({
  REASONING_LEVELS: [
    { value: "provider-default", label: "Provider default" },
    { value: "none", label: "None" },
    { value: "minimal", label: "Minimal" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "xhigh", label: "Extra high" },
  ],
}));

describe("ReasoningLevelSelector", () => {
  it("renders a combobox trigger", () => {
    render(
      <ReasoningLevelSelector
        value="medium"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("renders the currently selected level label", () => {
    render(
      <ReasoningLevelSelector
        value="high"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("High")).toBeDefined();
  });

  it("updates displayed label when value changes", () => {
    const { rerender } = render(
      <ReasoningLevelSelector
        value="provider-default"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Provider default")).toBeDefined();
    rerender(
      <ReasoningLevelSelector
        value="high"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("High")).toBeDefined();
  });
});
