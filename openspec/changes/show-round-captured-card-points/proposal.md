## Why

Follow-up to `zole-web-1hw` (which added the large per-round **game-point delta** in each seat).
Players still cannot see *how the hand actually went* in card terms — only the abstract settlement
number. The card-point totals are the intuitive measure of a Zole hand: the soloist needs **> 60**
of the 120 points in the deck to win (`docs/zole-rules.md §4a`), and in galdiņš the whole point is
who took the fewest points/tricks (§4b). Surfacing the actual captured card points at round end lets
a player see, e.g. "soloist made 73, the pair held 47" or, in galdiņš, each seat's points.

The engine already computes the soloist's `bigScore`, but the opposing pair's total and the
per-player captured totals are computed transiently inside `scoreRound` and discarded — they never
reach `RoundResult`, so the UI cannot show them. This change surfaces those figures on
`RoundResult` (a pure `engine` change tied to §4) and renders them at round end (`ui`).

Tracked by beads issue **zole-web-g6t**.

## What Changes

- **Engine (`src/engine`) — extend `RoundResult`** with the captured card-point figures, computed in
  `scoreRound` (which already has them in scope). No change to any settlement / delta / tree logic:
  - Keep `bigScore` (soloist's card points; already present; `null` in galdiņš).
  - Add `smallScore: number | null` — the **allied pair's** total card points for ordinary/Zole
    (opponents' tricks plus, in Zole, the two banked talon cards); `null` in galdiņš where there is
    no pair. For ordinary and Zole this equals `120 − bigScore`.
  - Add `cardPointsByPlayer: readonly [number, number, number]` — each player's card points **won in
    tricks** this round. Present for all game types; it is the primary per-seat figure for galdiņš,
    and lets the UI attribute the pair's `smallScore` to the two individual opponents in
    ordinary/Zole.
- **UI (`src/ui`) — render the captured card points at round end** alongside the existing
  game-point delta:
  - In `RoundSummary.tsx`: show the big/small split for ordinary/Zole (soloist `bigScore` vs pair
    `smallScore`, with the `> 60` win line implicit in the existing summary), and each player's
    captured card points for galdiņš.
  - Per-seat (human area + `OpponentPanel.tsx` via `Table.tsx`): show that seat's captured card
    points for the round as a smaller secondary figure beneath the existing large `RoundDelta`, so
    each player sees both "what I scored in cards" and "what it did to my game score".

### Non-goals (kept out to hold scope tight)

- No change to settlement bands, deltas, zole-tree branches, or any existing numeric outcome
  (`docs/zole-rules.md §4a–4c`) — this is additive reporting only.
- No new engine phases, no changes to `PlayerView`/`OpponentView` beyond `result` already carrying
  `RoundResult`.
- No accounting for the galdiņš talon (2 set-aside stock cards): they are not captured by anyone,
  so `cardPointsByPlayer` need not sum to 120 in galdiņš. Reconciling the galdiņš talon is a
  separate rules question (see Open Questions), not part of this change.
- No animation/reveal choreography beyond reusing the existing round-end reveal timing.

## Capabilities

### Modified Capabilities
- `game-engine`: `RoundResult` additionally reports the captured card-point totals for the round
  (allied pair total and each player's trick points), computed in `scoreRound` from the same
  captured-card data used for settlement. Settlement outcomes are unchanged.
- `gameplay-ui`: the round-end display additionally shows the captured card points — the big/small
  split for ordinary/Zole and each seat's points for galdiņš — alongside the existing game-point
  delta.

## Impact

- Engine: additive change to the `RoundResult` interface in `src/engine/state.ts` and to
  `scoreRound` in `src/engine/scoring.ts` (populate the new fields on every return path). Both stay
  pure; no new dependencies. `src/engine/index.ts` re-exports `RoundResult` unchanged (only its
  shape grows). Existing engine tests keep passing; new assertions cover the new fields.
- AI: no change. `ai` consumes `RoundResult` only via `PlayerView.result`; the added fields are
  optional to read.
- UI: presentational additions in `RoundSummary.tsx`, `OpponentPanel.tsx`, and `Table.tsx` (and a
  small secondary figure component or an extension of `RoundDelta.tsx` — see design). No driver/hook
  logic changes; the data already flows through `PlayerView.result`.
- Layering (`engine → ai → ui → app`) is preserved; the UI reads the new fields from the engine's
  public `RoundResult` type. No upward or sideways imports introduced.
