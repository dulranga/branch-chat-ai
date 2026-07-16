"use client";

import { signOut, useSession } from "@/lib/auth-client";
import type { Node } from "@/lib/types";

interface SidebarProps {
  rootNode: Node | null;
  currentNode: Node | null;
  onNewChat: () => void;
  onSelectNode: (node: Node) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({
  rootNode,
  currentNode,
  onNewChat,
  onSelectNode,
  isOpen,
  onToggle,
}: SidebarProps) {
  const { data: session } = useSession();

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
        aria-label="Toggle sidebar"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
          role="img"
          aria-hidden="true"
        >
          <title>Menu</title>
          <path d="M3 5h14a1 1 0 110 2H3a1 1 0 010-2zm0 4h14a1 1 0 110 2H3a1 1 0 110-2zm0 4h14a1 1 0 110 2H3a1 1 0 110-2z" />
        </svg>
      </button>

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700 transform transition-transform z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 pt-16 space-y-4">
          {session ? (
            <>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                {session.user.email}
              </div>

              <button
                type="button"
                onClick={onNewChat}
                className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                New Chat
              </button>

              <div className="space-y-1">
                {rootNode && (
                  <button
                    type="button"
                    onClick={() => onSelectNode(rootNode)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentNode?.id === rootNode.id
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {rootNode.title || "Root Conversation"}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => signOut()}
                className="w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                Sign Out
              </button>
            </>
          ) : (
            <a
              href="/sign-in"
              className="block w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-center"
            >
              Sign In
            </a>
          )}
        </div>
      </aside>
    </>
  );
}
