// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingCard } from "@/components/chat/onboarding-card";

describe("OnboardingCard", () => {
  it("renders the heading", () => {
    render(<OnboardingCard />);
    expect(screen.getByText("Configure a Model")).toBeDefined();
  });

  it("renders the description", () => {
    render(<OnboardingCard />);
    expect(
      screen.getByText(/you need at least one AI model/i),
    ).toBeDefined();
  });

  it("has a link to /settings", () => {
    render(<OnboardingCard />);
    const link = screen.getByText("Go to Settings");
    expect(link).toBeDefined();
    expect(link.closest("a")?.getAttribute("href")).toBe("/settings");
  });
});
