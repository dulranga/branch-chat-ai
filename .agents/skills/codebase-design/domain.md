# Context

## Database Schema

### Node Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for each node |
| parent_id | INTEGER | REFERENCES nodes(id), NULLABLE | Parent node ID (null for root) |
| path | VARCHAR | NOT NULL | Materialized path (e.g., "root.1.2") |
| title | VARCHAR | NOT NULL | Auto-generated from first 2-4 messages |
| depth | INTEGER | NOT NULL | Distance from root node |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | When node was created |

**Indexes:**
- `path` (for efficient tree traversal)

### Message Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique message identifier |
| node_id | INTEGER | NOT NULL REFERENCES nodes(id) | Which node this message belongs to |
| role | VARCHAR | NOT NULL (CHECK: 'user' | 'assistant') | Sender type |
| content | TEXT | NOT NULL | Message text |
| timestamp | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | When message was sent |

**Indexes:**
- `node_id` (for fetching messages by node)

## Default Values

- Node depth defaults to parent's depth + 1
- Initial node has path "root" and null parent_id
- Message roles are either "user" or "assistant"

## Relationships

- Each node can have multiple child nodes
- Each node has exactly one parent (except root)
- Each message belongs to exactly one node
- Messages inherit parent context when belonging to child nodes

## Node Path Logic

- Root node: "root"
- Child of "root": "root.1"
- Child of "root.1": "root.1.2"
- Auto-increments numeric suffix when adding children at each level

## Node Title Generation

- Extract first 2-4 messages from node
- Create descriptive title (2-5 words max)
- Can be edited by user later
- Used for display in tree view

## Navigation

- Tree view shows entire conversation hierarchy
- Clicking a node loads its conversation and messages
- Breadcrumbs show current position in tree
- Seamlessly switch between main conversation and branches

## Edge Cases

- Multiple nodes at same depth
- Deleting nodes and their subtrees
- Editing branch titles
- Large conversation trees
