# Feature Request Inbox

Drop feature ideas here and they get picked up automatically. Add each request under **## Inbox**
as an unchecked list item:

```
- [ ] Short description of what you want
```

You can add detail on indented lines beneath an item if you like. The **feature-intake** agent
(run via `/process-inbox`, or on a timer with `/loop 15m /process-inbox`) works a batch each run.
Items flow **Inbox → In Progress → Processed**:

1. It logs each item to **beads** (`bd create`) — and, if it's a large/architectural change, drafts
   an **OpenSpec** proposal and leaves it for your approval instead of building blind.
2. It moves the items it's working on to **## In Progress**, tagged with a start timestamp and a run
   id, so an interrupted run leaves a visible marker (`[~]`) instead of losing or double-doing work.
3. For well-scoped items: it implements them (respecting the `engine → ai → ui → app` layering, with
   independent items done **in parallel**), adds tests, runs the quality gates and the code-review
   gate, and commits atomically.
4. It moves finished items to **## Processed** with their beads id, outcome, and commit.
5. **Stale-WIP recovery:** at the start of each run it reclaims any `## In Progress` item older than
   60 minutes (a crashed/abandoned run) back to `## Inbox` so it gets retried.

Nothing here is pushed anywhere (the repo is local-only).

## Inbox

<!-- Add requests below, one per line. Examples (indented so tools ignore them):
     - [ ] Add a "concede round" button for the human
     - [ ] Show a running count of trumps already played
-->
- [ ] When picking up, the two new cards should animate joining the hand rather than animating the full new hand from sractch - the exitsing hand cards should always be visible
- [ ] make galdins more visually obvious

## In Progress

<!-- The agent moves items here while working on them, then on to Processed when done. Format
     (indented so tools ignore this example):
     - [~] <request> — `<bd-id>` — started <UTC-ISO-8601> — run <run-id>
     Any item here older than 60 min is treated as a stale/crashed run and reclaimed to ## Inbox. -->

## Processed

<!-- The agent appends completed items here, e.g.:
- [x] Add a concede button — `zole-web-abc` — implemented (commit 1a2b3c4)
-->
- [x] Show large per-round score after last trick in each player's space — `zole-web-1hw` — implemented: large per-round game-point delta now shown in each seat (human + both opponents) at round end via new RoundDelta component (commit 0a37e7d)
- [x] Cards UI should be bigger still — `zole-web-9a5` — implemented: .card width/height clamps scaled up ~18% with inner typography bumped proportionally; 8–10 card hand still fits one row, CardView contract unchanged (commit 245299d)
- [x] Remove vibrant theme — `zole-web-408` — implemented: dropped 'vibrant' from THEMES and its [data-theme='vibrant'] CSS + bg-shift keyframes; default stays 'neon', stored 'vibrant' falls back to 'neon' (commit 7da52e4)
- [x] persist meta scores across refresh with local storage, newgame should reset the scores though — `zole-web-7kh` — implemented: ui-layer scorePersistence helper stores RoundCarryOver in localStorage, restored on load and saved at round end; newGame() clears it; engine stays pure (commit 4b07ddc)
- [x] Bug - content moves vertically as top status bar changes width with current status — `zole-web-1nz` — implemented: .status-banner now occupies its own full-width header row (flex-basis:100%), so status-text length changes no longer reflow content below (commit 534de82)
- [x] lift animation on card from hand on hover ready to play — `zole-web-2yn` — implemented: split hover timing — crisp ~0.2s lift, eased ~0.28s un-lift return so no harsh snap; reduced-motion keeps instant affordance (commit 5f4f804)
- [ ] Follow-up to `zole-web-1hw`: at round end, also show the actual card points each player won that round (not just the game-point delta) — e.g. the soloist's bigScore and each side's captured points — `zole-web-g6t` — → proposed (show-round-captured-card-points), awaiting approval (commit 325c7d3)
