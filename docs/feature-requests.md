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

<!-- Add requests below, one per line. Examples (indented so tools ignore them):
     - [ ] Add a "concede round" button for the human
     - [ ] Show a running count of trumps already played
-->
- [ ] Follow-up to `zole-web-1hw`: at round end, also show the actual card points each player won that round (not just the game-point delta) — e.g. the soloist's bigScore and each side's captured points
- [ ] Bug - content moves vertically as top status bar changes width with current status
- [ ] When picking up, the two new cards should animate joining the hand rather than animating the full new hand from sractch - the exitsing hand cards should always be visible
- [ ] make galdins more visually obvious
- [ ] lift animation on card from hand on hover ready to play. Should be suitably timed and time the unlift so there's never a harsh jump

## Processed

<!-- The agent appends completed items here, e.g.:
- [x] Add a concede button — `zole-web-abc` — implemented (commit 1a2b3c4)
-->
- [x] Show large per-round score after last trick in each player's space — `zole-web-1hw` — implemented: large per-round game-point delta now shown in each seat (human + both opponents) at round end via new RoundDelta component (commit 0a37e7d)
- [x] Cards UI should be bigger still — `zole-web-9a5` — implemented: .card width/height clamps scaled up ~18% with inner typography bumped proportionally; 8–10 card hand still fits one row, CardView contract unchanged (commit 245299d)
- [x] Remove vibrant theme — `zole-web-408` — implemented: dropped 'vibrant' from THEMES and its [data-theme='vibrant'] CSS + bg-shift keyframes; default stays 'neon', stored 'vibrant' falls back to 'neon' (commit 7da52e4)
- [x] persist meta scores across refresh with local storage, newgame should reset the scores though — `zole-web-7kh` — implemented: ui-layer scorePersistence helper stores RoundCarryOver in localStorage, restored on load and saved at round end; newGame() clears it; engine stays pure (commit 4b07ddc)
