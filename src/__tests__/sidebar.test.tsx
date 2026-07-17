// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { Chat } from "@/lib/types";

const mockChats: Chat[] = [
  {
    id: "chat-1",
    userId: "u1",
    title: "My First Chat",
    createdAt: new Date(),
  },
  {
    id: "chat-2",
    userId: "u1",
    title: "Second Chat",
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
];

function renderSidebar(props: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  return render(
    <SidebarProvider>
      <Sidebar
        chats={mockChats}
        selectedChat={null}
        branchCounts={{}}
        onCreateChat={vi.fn()}
        onSelectChat={vi.fn()}
        {...props}
      />
    </SidebarProvider>,
  );
}

describe("Sidebar", () => {
  it("renders chat titles", () => {
    renderSidebar();
    expect(screen.getByText("My First Chat")).toBeDefined();
    expect(screen.getByText("Second Chat")).toBeDefined();
  });

  it("calls onSelectChat when a chat is clicked", async () => {
    const onSelectChat = vi.fn();
    renderSidebar({ onSelectChat });
    const user = userEvent.setup();
    await user.click(screen.getByText("My First Chat"));
    expect(onSelectChat).toHaveBeenCalledWith(mockChats[0]);
  });

  it("calls onCreateChat when new chat button is clicked", async () => {
    const onCreateChat = vi.fn();
    renderSidebar({ onCreateChat });
    const user = userEvent.setup();
    const newChatBtn = screen.getByText("New Chat");
    await user.click(newChatBtn);
    expect(onCreateChat).toHaveBeenCalledOnce();
  });

  it("shows search input and filters chats", async () => {
    renderSidebar();
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText("Search chats...");
    await user.type(searchInput, "Second");
    expect(screen.queryByText("My First Chat")).toBeNull();
    expect(screen.getByText("Second Chat")).toBeDefined();
  });
});
