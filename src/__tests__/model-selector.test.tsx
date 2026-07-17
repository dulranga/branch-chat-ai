// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModelSelector } from "@/components/chat/model-selector";
import type { UserModel } from "@/lib/types";

vi.mock("@/config/models", () => ({
  getProviders: () => ["openai", "anthropic"],
  formatProviderName: (p: string) =>
    p.charAt(0).toUpperCase() + p.slice(1),
  getModelCatalog: () => ({
    openai: { models: ["gpt-4o", "gpt-4o-mini"] },
    anthropic: { models: ["claude-sonnet-4-20250514"] },
  }),
}));

const mockModels: UserModel[] = [
  {
    id: "m1",
    userId: "u1",
    provider: "openai",
    model: "gpt-4o",
    name: "My GPT-4o",
    createdAt: new Date(),
  },
  {
    id: "m2",
    userId: "u1",
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    name: "My Claude",
    createdAt: new Date(),
  },
  {
    id: "m3",
    userId: "u1",
    provider: "openai",
    model: "gpt-4o-mini",
    name: "Mini OpenAI",
    createdAt: new Date(),
  },
];

describe("ModelSelector", () => {
  it("shows 'Add a model' link when no models", () => {
    render(
      <ModelSelector
        models={[]}
        activeModel={null}
        onSelect={vi.fn()}
      />,
    );
    const link = screen.getByText("Add a model");
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/settings");
  });

  it("renders the button with active model name", () => {
    render(
      <ModelSelector
        models={mockModels}
        activeModel={mockModels[0]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("My GPT-4o")).toBeDefined();
  });

  it("has a search input in the popover", () => {
    render(
      <ModelSelector
        models={mockModels}
        activeModel={null}
        onSelect={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    const searchInput = screen.getByPlaceholderText("Search models...");
    expect(searchInput).toBeDefined();
  });

  it("shows 'No models match' empty state after search", () => {
    render(
      <ModelSelector
        models={mockModels}
        activeModel={null}
        onSelect={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    const searchInput = screen.getByPlaceholderText("Search models...");
    fireEvent.change(searchInput, { target: { value: "zzz_no_match" } });
    const emptyMsg = screen.getByText("No models match");
    expect(emptyMsg).toBeDefined();
  });

  it("shows model names when opened", () => {
    render(
      <ModelSelector
        models={mockModels}
        activeModel={null}
        onSelect={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);
    expect(screen.getByText("My GPT-4o")).toBeDefined();
    expect(screen.getByText("My Claude")).toBeDefined();
    expect(screen.getByText("Mini OpenAI")).toBeDefined();
  });
});
