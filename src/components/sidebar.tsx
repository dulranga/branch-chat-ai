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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut, useSession } from "@/lib/auth-client";
import type { Chat } from "@/lib/types";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ChevronsUpDown, GitBranch, LogOut, Plus, Trash2 } from "lucide-react";

interface SidebarProps {
  chats: Chat[];
  branchCounts: Record<string, number>;
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
  branchCount,
  isSelected,
  onSelect,
  onDelete,
  onRename,
}: {
  chat: Chat;
  branchCount: number;
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
        <SidebarMenuButton
          isActive={isSelected}
          onClick={onSelect}
          tooltip={chat.title || "Untitled Chat"}
        >
          <span className="flex size-4 shrink-0 items-center justify-center">
            <span
              className={`size-1.5 rounded-full ${
                isSelected ? "bg-accent" : "bg-current opacity-30"
              }`}
            />
          </span>
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
            <span className="truncate flex-1" onDoubleClick={handleDoubleClick}>
              {chat.title || "Untitled Chat"}
            </span>
          )}
          {branchCount > 1 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-accent/15 text-[10px] font-medium text-accent tabular-nums group-data-[collapsible=icon]:hidden">
              {branchCount}
            </span>
          )}
        </SidebarMenuButton>
        {isSelected && !isEditing && (
          <SidebarMenuAction
            showOnHover
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="size-3" />
          </SidebarMenuAction>
        )}
      </SidebarMenuItem>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;
              {chat.title || "Untitled Chat"}&rdquo;? This action cannot be
              undone.
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
  branchCounts,
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
        c.title?.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
    );
  }, [chats, searchQuery]);

  const groups = useMemo(
    () => groupChatsByDate(filteredChats),
    [filteredChats],
  );

  return (
    <ShadcnSidebar collapsible="none">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={onCreateChat}
              tooltip="New Chat"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <GitBranch className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-display text-base font-semibold tracking-tight">
                  Branches
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  New conversation
                </span>
              </div>
              <Plus className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarInput
          placeholder="Find a conversation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="group-data-[collapsible=icon]:hidden"
        />
      </SidebarHeader>

      <SidebarContent>
        {groups.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {searchQuery ? "No matches" : "No conversations yet"}
          </div>
        ) : (
          groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="font-display text-[13px] font-light italic text-sidebar-foreground/50 px-3">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.chats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      branchCount={branchCounts[chat.id] || 1}
                      isSelected={selectedChat?.id === chat.id}
                      onSelect={() => onSelectChat(chat)}
                      onDelete={(id) => onDeleteChat?.(id)}
                      onRename={(id, title) => onRenameChat?.(id, title)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={session?.user.name || "User"}
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-6 rounded-sm">
                    <AvatarFallback className="text-xs rounded-sm">
                      {session?.user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {session?.user.name || "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                      {session?.user.email || ""}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <ThemeToggle />
                  <span className="text-xs text-muted-foreground">
                    Toggle theme
                  </span>
                </div>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
}
