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

**Model Provider**:
A third-party AI service that offers language models — OpenAI, Anthropic, Google, Mistral, Groq, etc. Each provider is backed by an ai-sdk package (`@ai-sdk/openai`, `@ai-sdk/anthropic`, etc.) and a constructor function (`createOpenAI`, `createAnthropic`, etc.). Providers are defined in the Model Catalog.
_Avoid_: LLM vendor, AI service

**Model Flavor**:
A specific model offered by a Model Provider (e.g. `gpt-4o`, `claude-3.5-sonnet`, `gemini-2.0-flash`). The combination of provider + model flavor uniquely identifies what the AI SDK will call. Model flavors are defined in the Model Catalog, under their parent provider.
_Avoid_: Model name only, variant

**Model Catalog**:
The file `src/config/models.yaml` that declares every supported Model Provider and its available Model Flavors. It is the single source of truth for what users can configure. The catalog maps each provider to its ai-sdk package path and constructor, and lists the model flavors under it. Adding a new provider or model means editing this file.

**User Model**:
A user's personal configuration linking a Model Provider, a Model Flavor, and their own API key (encrypted via pgcrypto). Stored in the `user_models` table. Users can add many models on the Settings Page and switch between them freely.
_Avoid_: API key entry, credential

**Active Model**:
The User Model currently selected for chatting. Stored as `active_model_config_id` on the `user` table. Changed via the model dropdown in the chat input area. On page load the client reads this from the server; if unset, falls back to the user's most recently created User Model. The Active Model is stored per-user, not per-chat.
_Avoid_: Current model, selected model

**System Model**:
The model used for app-internal tasks — title generation and similar. Configured entirely via environment variables (provider + model + API key). Invisible to users; never shown on the Settings Page.
_Avoid_: Global model, admin model

**Settings Page**:
A top-level route at `/settings` where users manage their User Models. They can add a new model (pick provider → pick flavor → enter API key), delete existing models, and see which model is currently active. Also shows the onboarding flow for first-time users who haven't added any model yet.
_Avoid_: Config page, preferences

**Model Dropdown**:
A dropdown in the chat input area that lets the user select their Active Model. Lists all of the user's User Models. Changing the selection updates the Active Model on the server and in localStorage (for fast client-side default on next visit).
_Avoid_: Model picker (use this term only for the settings page version)

**Encrypted API Key**:
A user's API key encrypted using pgcrypto `pgp_sym_encrypt`/`pgp_sym_decrypt` with a key from the `APP_ENCRYPTION_KEY` environment variable. Stored in the `api_key_encrypted` column of the `user_models` table. Decrypted at query time when the server needs to instantiate a provider for streaming.

**Input Container**:
The main input area of the chat page — a large multiline textarea inside a clean card-like container with subtle borders and clear hierarchy. Below or integrated within the container is a toolbar with model selector, /commands menu, reasoning level selector, and (future) file attachment. Designed to feel like a professional AI coding environment while staying conversational.

**Model Selector**:
A dropdown in the Input Container toolbar. Groups models by provider, shows a search field to filter across both provider and model names. Selecting a model sets it as the Active Model (PATCH to server, updated in localStorage). Empty state shows "No models match" only (no add link).

**Reasoning Level**:
A dropdown in the Input Container toolbar with seven levels: `provider-default`, `none`, `minimal`, `low`, `medium`, `high`, `xhigh`. Controls how much thinking effort the model applies. Can be changed per message — each message stores its `reasoning_level` for traceability.
_Avoid_: Thinking effort, compute level

**Command Palette**:
A dropdown menu in the Input Container toolbar that lists available slash commands and agent actions. All commands share a common interface: some change site behavior (e.g. `/branch` triggers a fork), others simply insert text into the input. Designed to be easy to add new commands later.
_Avoid_: Slash menu, actions menu

**Command**:
A single entry in the Command Palette. Defined by a common interface with properties: trigger (e.g. `/branch`), label, description, and an `execute` method. The implementation discriminates between commands that mutate app state (like forking a node) and commands that only insert text into the input.

**Settings Page**:
A top-level route at `/settings` with a sidebar navigation layout. The sidebar shows "Models" (selected by default, with a robot/AI icon) plus placeholder items for future sections (General, Appearance). A top nav bar links back to the Chat page. Models section uses a multi-step wizard for adding new models.

**Add Model Wizard**:
A 3-step wizard on the Settings Page for creating a User Model:
1. **Provider** — pick a Model Provider (card grid or list)
2. **Model** — pick a Model Flavor from the selected provider (list with search)
3. **Configure** — set an editable auto-generated name, enter the API key, save
API key can be edited later inline on the model card. Changing provider or model requires delete-and-re-add.

## Coding Standards

**Never use custom components if they are provided by shadcn/ui.** Always prefer the shadcn component for common UI patterns (buttons, inputs, cards, dialogs, tabs, textareas, tooltips, etc.). Custom DOM or styling should only be used for truly unique behaviors that shadcn does not cover.

