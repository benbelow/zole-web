# Feature Request Inbox

Drop feature ideas here and they get picked up automatically. Add each request under **## Inbox**
as an unchecked list item:

```
- [ ] Short description of what you want
```

You can add detail on indented lines beneath an item if you like. The **feature-intake** agent
(run via `/process-inbox`, or on a timer with `/loop 15m /process-inbox`) processes the oldest
unchecked item each run:

1. Logs it to **beads** (`bd create`) — and, if it's a large/architectural change, drafts an
   **OpenSpec** proposal and leaves it for your approval instead of building blind.
2. For well-scoped items: implements it (respecting the `engine → ai → ui → app` layering), adds
   tests, runs the quality gates, runs the code-review gate, and commits atomically.
3. Moves the item to **## Processed** with its beads id and a one-line outcome.

Nothing here is pushed anywhere (the repo is local-only).

## Inbox

<!-- Add requests below, one per line. Examples (delete these):
- [ ] Add a "concede round" button for the human
- [ ] Show a running count of trumps already played
-->

## Processed

<!-- The agent appends completed items here, e.g.:
- [x] Add a concede button — `zole-web-abc` — implemented (commit 1a2b3c4)
-->
