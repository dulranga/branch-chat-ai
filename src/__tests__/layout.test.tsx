// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: {
      session: { id: "s1" },
      user: { id: "u1", email: "test@example.com" },
    },
    isPending: false,
  }),
}));

describe("Layout components", () => {
  it("renders ResizablePanelGroup with panels", () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>Left</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByText("Left")).toBeDefined();
    expect(screen.getByText("Right")).toBeDefined();
  });

  it("renders Tabs and toggles content", () => {
    render(
      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="tree">Tree</TabsTrigger>
        </TabsList>
        <TabsContent value="chat">Chat Content</TabsContent>
        <TabsContent value="tree">Tree Content</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("Chat Content")).toBeDefined();
  });
});
