# Branching Chat

An AI chat application where conversations form a tree structure. Each Node is a linear message exchange; forking creates a child Node that inherits its ancestor chain's context.

## Language

**User**:
A person (typically a student) using the application. A User can have multiple Chats, each containing its own independent Node tree. Authentication via better-auth library.
_Avoid_: Member, account holder

**Session**:
A User's authenticated browser session. The User's Chats persist across sessions.
_Avoid_: Log in, log out

**Chat**:
A container for one Node tree. A User may have many Chats; each Chat has exactly one Root Node and all Nodes in that tree share the same Chat ID. Deleting a Chat cascades to all its Nodes and Messages. The Chat's title mirrors its Root Node's title (derived from the first 3–4 user messages).
_Avoid_: Conversation, session, thread

**Node**:
A single linear exchange of messages between user and AI. A Node only stores its own messages — ancestor messages are assembled at query time via the materialized path. Each Node has an auto-generated title (derived from the first 3–4 user messages), a creation timestamp, a materialized path, and a `chatId` FK to its parent Chat. Forking creates a new child Node with an empty message list; the user is immediately switched to it.
_Avoid_: Branch, thread

**Ancestor chain**:
The ordered list of parent Nodes from the root down to the current Node. A child Node inherits the full message history of every Node in its ancestor chain as context.
_Avoid_: Parent list, upbringing

**Sidebar**:
An expandable panel on the left showing all of the User's Chats. Clicking a Chat selects it and loads its tree. A "New Chat" button at the top creates a new Chat with a fresh Root Node.

**Chat area**:
The center panel displaying the currently active Node's conversation. This is where the user reads and sends messages. If no Chat is selected, the area is empty with a placeholder prompt.

**Tree panel**:
A panel on the right side of the screen that renders the selected Chat's Node tree as an interactive graph. Users can click any Node to navigate to it — the Chat area then switches to that Node's conversation.
_Avoid_: Roadmap, map

**Mobile layout**:
On mobile the three-panel layout collapses to two: the Sidebar remains, and the Chat area gains a top tab bar to toggle between "Chat" and "Tree" views in the same panel.

**Message**:
A single turn in the conversation within a Node. Messages are stored in a separate table with columns: `id` (uuid PK), `node_id` (FK → nodes), `role` (user/assistant/system), `content` (text), `order` (incrementing integer per Node), `reply_to` (uuid, nullable FK → messages — the user message that triggered this assistant response), and `created_at` (timestamptz). The Vercel AI SDK expects messages in order, so the `order` column determines position within a Node.

**Edit** (message):
The user can only edit their last message in a Node. The edit does not mutate the original — instead a new message is inserted with the same `order` value. When reconstructing the conversation, the most recent message for a given `order` wins. The original remains in the database for audit trace. Assistant responses use `reply_to` to track which user message triggered them.

**Materialized path**:
A string encoding the ancestry of a Node in the format `/<parent_id>/<child_id>`. Stored on each Node enables O(1) ancestor lookups without recursive queries. Ancestor messages are assembled by querying the messages of each ancestor node via this path at request time.

**Root Node**:
The initial Node of a Chat. There is exactly one root Node per Chat. All other Nodes in that Chat are descendants of this root. Deleting the Root Node deletes the entire Chat.

**Append**:
Adding a new message to the current Node. This is the default action — the main conversation thread continues linearly within the same Node.

**Fork**:
The action of creating a new child Node from a given Node, used when the user wants to pursue a tangential or side question outside the current flow. The new Node inherits the ancestor chain of its parent, plus the parent's own messages. Fork can be triggered via a "Branch Out" button or a slash command like `/branch`.

**Delete Node**:
Permanently removes a Node and all of its descendant Nodes. Deleting the Root Node of a Chat removes the entire Chat and all its contents.

## Coding Standards

**Never use custom components if they are provided by shadcn/ui.** Always prefer the shadcn component for common UI patterns (buttons, inputs, cards, dialogs, tabs, textareas, tooltips, etc.). Custom DOM or styling should only be used for truly unique behaviors that shadcn does not cover.

