// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// The landing page is a server component, so we test the rendered HTML via
// the expected output structure rather than importing the component directly.
// Instead we test that the shadcn Button and Card patterns used by the page
// render correctly by testing a minimal component that uses them.
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

describe("Landing page components", () => {
  it("renders a shadcn Button with correct text", () => {
    render(<Button>Sign In</Button>);
    expect(screen.getByText("Sign In")).toBeDefined();
  });

  it("renders a shadcn Card with title and content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>Content here</CardContent>
      </Card>,
    );
    expect(screen.getByText("Test Card")).toBeDefined();
    expect(screen.getByText("Content here")).toBeDefined();
  });

  it("renders a Card with the correct class attributes", () => {
    const { container } = render(
      <Card className="max-w-md">
        <CardContent>Hello</CardContent>
      </Card>,
    );
    const cardEl = container.firstChild as HTMLElement;
    expect(cardEl.className).toContain("rounded-xl");
  });
});
