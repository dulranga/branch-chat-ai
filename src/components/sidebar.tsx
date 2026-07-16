"use client";

import { useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut, useSession } from "@/lib/auth-client";
import type { Chat } from "@/lib/types";

interface SidebarProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onCreateChat: () => void;
  onSelectChat: (chat: Chat) => void;
  onDeleteChat?: (chatId: string) => void;
  onRenameChat?: (chatId: string, title: string) => void;
}

function groupChatsByDate(chats: Chat[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 86400000);

  const groups: { label: string; chats: Chat[] }[] = [];
  const todayChats: Chat[] = [];
  const yesterdayChats: Chat[] = [];
  const thisWeekChats: Chat[] = [];
  const earlierChats: Chat[] = [];

  for (const chat of chats) {
    const chatDate = new Date(chat.createdAt);
    const chatDay = new Date(
      chatDate.getFullYear(),
      chatDate.getMonth(),
      chatDate.getDate(),
    );
    if (chatDay.getTime() === today.getTime()) {
      todayChats.push(chat);
    } else if (chatDay.getTime() === yesterday.getTime()) {
      yesterdayChats.push(chat);
    } else if (chatDay >= thisWeekStart) {
      thisWeekChats.push(chat);
    } else {
      earlierChats.push(chat);
    }
  }

  if (todayChats.length > 0) groups.push({ label: "Today", chats: todayChats });
  if (yesterdayChats.length > 0)
    groups.push({ label: "Yesterday", chats: yesterdayChats });
  if (thisWeekChats.length > 0)
    groups.push({ label: "This Week", chats: thisWeekChats });
  if (earlierChats.length > 0)
    groups.push({ label: "Earlier", chats: earlierChats });

  return groups;
}

function ChatListItem({
  chat,
  isSelected,
  onSelect,
  onDelete,
  onRename,
}: {
  chat: Chat;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (chatId: string) => void;
  onRename: (chatId: string, title: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title || "Untitled Chat");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDoubleClick() {
    setEditTitle(chat.title || "Untitled Chat");
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function handleSave() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== (chat.title || "Untitled Chat")) {
      onRename(chat.id, trimmed);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setIsEditing(false);
  }

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isSelected} onClick={onSelect}>
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="h-6 text-sm px-1 py-0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="truncate flex-1"
              onDoubleClick={handleDoubleClick}
            >
              {chat.title || "Untitled Chat"}
            </span>
          )}
        </SidebarMenuButton>
        {isSelected && !isEditing && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md text-xs text-muted-foreground opacity-0 group-hover/menu-item:opacity-100 hover:bg-sidebar-accent"
          >
            ✕
          </button>
        )}
      </SidebarMenuItem>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{chat.title || "Untitled Chat"}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(chat.id);
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Sidebar({
  chats,
  selectedChat,
  onCreateChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
}: SidebarProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    );
  }, [chats, searchQuery]);

  const groups = useMemo(
    () => groupChatsByDate(filteredChats),
    [filteredChats],
  );

  return (
    <ShadcnSidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center justify-between p-1">
          <span className="text-sm font-semibold">Chats</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCreateChat}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <title>New Chat</title>
              <line x1="8" y1="2" x2="8" y2="14" />
              <line x1="2" y1="8" x2="14" y2="8" />
            </svg>
          </Button>
        </div>
        <SidebarInput
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1">
          {groups.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? "No chats match your search" : "No chats yet. Start a new one!"}
            </div>
          ) : (
            groups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  {group.chats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isSelected={selectedChat?.id === chat.id}
                      onSelect={() => onSelectChat(chat)}
                      onDelete={(id) => onDeleteChat?.(id)}
                      onRename={(id, title) => onRenameChat?.(id, title)}
                    />
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>
            ))
          )}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {session?.user.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate text-sidebar-foreground">
              {session?.user.email || "User"}
            </p>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => signOut()}
            title="Sign Out"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Sign Out</title>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </Button>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
