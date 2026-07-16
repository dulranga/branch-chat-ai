# Inherited context sent only on first message of a forked Node

When a user sends a message in a forked Node, the ancestor chain's messages are included in the LLM request only on the first message of that Node. Subsequent messages within the same Node include only that Node's own message history. This reduces token consumption compared to re-sending the full ancestor chain on every turn, while still preserving the fork's inherited context as a preamble.
