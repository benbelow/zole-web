# Design — Round-end captured card points

Beads: **zole-web-g6t** (follow-up to `zole-web-1hw`). Rules: `docs/zole-rules.md §4` (scoring),
§1 (card point values, 120 total in the deck).

## Layers touched

- `engine` (pure): `src/engine/state.ts` (`RoundResult` type), `src/engine/scoring.ts`
  (populate the new fields). No new modules, no new dependencies, purity preserved.
- `ui` (presentation): `src/ui/components/RoundSummary.tsx`, `OpponentPanel.tsx`, `Table.tsx`,
  and a small secondary-figure element (extend `RoundDelta.tsx` or add `CardPointsPill.tsx`).

`ai` and `app` are untouched. Data reaches the UI through the existing
`PlayerView.result: RoundResult | null`, so no driver/hook change is needed.

## D1 — `RoundResult` shape (the decision to review)

Current `RoundResult` (see `src/engine/state.ts`):

```ts
export interface RoundResult {
  readonly gameType: GameType;
  readonly soloist: PlayerId | null;
  readonly bigScore: number | null;      // soloist card points (null in galdiņš)
  readonly deltas: readonly [number, number, number];
  readonly treeBranchesBefore: number;
  readonly treeBranchesAfter: number;
  readonly summary: string;
}
```

Proposed additions (nothing removed or renamed):

```ts
export interface RoundResult {
  // ...existing fields unchanged...

  /**
   * Card points won by the allied pair ("small") in ordinary/Zole: the two opponents' trick
   * points plus, in a Zole call, the two banked talon cards. Equals 120 − bigScore for
   * ordinary and Zole. `null` in galdiņš (no pair). (rules §4a)
   */
  readonly smallScore: number | null;

  /**
   * Card points each player won *in tricks* this round (by PlayerId). Excludes banked cards
   * (the soloist's ordinary discard and the Zole talon), so it is a pure "points taken in
   * play" figure. Present for every game type; it is the primary per-seat figure for galdiņš.
   * (rules §1, §4)
   */
  readonly cardPointsByPlayer: readonly [number, number, number];
}
```

### Why this shape

- **`smallScore` as an explicit sibling of `bigScore`.** The pair total is the natural counterpart
  to the soloist total and is exactly the number the UI wants for the ordinary/Zole "big vs small"
  line. Although it is arithmetically `120 − bigScore` for ordinary/Zole, surfacing it explicitly
  (a) avoids the UI re-deriving domain arithmetic (which belongs in `engine`), and (b) keeps the
  `bigScore`/`smallScore` pair symmetric and self-documenting. It is `null` in galdiņš because
  "the pair" does not exist there.
- **`cardPointsByPlayer` covers all three game types with one field.** In galdiņš there is no
  big/small split, so we need a per-player figure regardless; reusing the same field for
  ordinary/Zole lets the UI attribute the pair's total to the two individual opponents (e.g. show
  each opponent's own trick points, not just the joint pair total). It is defined as **trick points
  only** so it has one clear meaning across game types; banked cards remain summarised via
  `bigScore` (ordinary discard is inside `bigScore`) and `smallScore` (Zole talon is inside
  `smallScore`).

### Alternatives considered

1. **Add only `smallScore` (a single pair total), no per-player array.** Smaller, but cannot show
   galdiņš per-seat card points — which is the more interesting case for the feature — and cannot
   attribute the pair total to individual opponents. Rejected: doesn't satisfy the request's
   galdiņš clause.
2. **Add only `cardPointsByPlayer` and let the UI sum the two non-soloist seats for the pair.**
   Would work for ordinary (pair = sum of the two opponents' trick points), but **breaks for Zole**,
   where the pair also owns the 2 talon cards that are in `pairStock`, not in any player's
   `captured`. Summing seats would undercount the pair by up to 22 points. Rejected: the UI would
   have to know about talon banking, i.e. re-implement engine domain logic — a layering smell.
3. **A structured `capturedCardPoints` sub-object** (e.g. `{ big, small, byPlayer }`). Cleaner
   namespacing, but `bigScore` already lives flat on `RoundResult`; nesting only the new fields
   would be inconsistent, and moving `bigScore` in would be a breaking rename touching existing UI
   and tests. Rejected for minimal, consistent change; can revisit if `RoundResult` grows further.

**Recommendation: option chosen above** — add both `smallScore` and `cardPointsByPlayer`.

### The galdiņš talon caveat (called out, not silently handled)

In galdiņš the 2 stock cards are set aside and, per the current engine (`round.ts` sets
`pairStock: []` on all-pass), are **not** captured by any player. So in galdiņš
`sum(cardPointsByPlayer)` can be **less than 120** by the value of those two cards (0–22). This is
faithful to how the round is currently scored (galdiņš settles on **tricks**, not card points —
§4b), so it does not affect any delta. The UI copy for galdiņš should therefore present
`cardPointsByPlayer` as "card points taken" without implying the three sum to 120. Whether the
galdiņš talon should be attributed to anyone is a **rules question** (Open Questions), out of scope
here.

## D2 — `scoreRound` changes (all values already in scope)

`scoreRound` already computes, per branch, everything needed; the change is to compute the per-player
trick totals once at the top and populate the two new fields on **every** return path (galdiņš
single-loser, galdiņš tie, ordinary/Zole 60–60 tie, soloist win, soloist loss).

Outline (pure, no new imports beyond the existing `pointsOf`/`cardPoints`):

```
cardPointsByPlayer = state.players.map(p => pointsOf(p.captured))   // [n,n,n], trick points only

// galdiņš branches:
smallScore = null                                                   // no pair in galdiņš

// ordinary / Zole branches:
bigScore   = pointsOf(captured[soloist]) + (ordinary ? pointsOf(soloistDiscard) : 0)   // unchanged
smallScore = 120 - bigScore
             // equivalently: sum of the two opponents' trick points + (zole ? pointsOf(pairStock) : 0)
             // both forms are equal; use `120 - bigScore` for a single source of truth.
```

`bigScore` and all deltas/tree logic are **byte-for-byte unchanged**. The 60–60 tie branch keeps
`bigScore = 60`, and now also reports `smallScore = 60` and the per-player array (useful context
even though nobody scores game points).

Determinism/purity is unaffected (no RNG, no I/O; still a pure function of `PlayingState`).

## D3 — UI surface

Data path is unchanged: `Table.tsx` already reads `view.result` and passes `deltas[seat]` to each
seat. The additions mirror that.

- **`RoundSummary.tsx`** (the breakdown block):
  - Ordinary/Zole: add a card-points line, e.g. `Cards — Soloist (BIG): {bigScore} · Pair (SMALL):
    {smallScore}`. The existing summary string already narrates the win/loss; this adds the raw
    split. (rules §4a; the > 60 threshold is implicit.)
  - Galdiņš: add a per-seat card-points line for all three seats from `cardPointsByPlayer`, e.g.
    `Cards taken — You: {..} · Left: {..} · Right: {..}`, labelled so it does not imply a sum of 120.
- **Per-seat secondary figure** (`OpponentPanel.tsx` + human area in `Table.tsx`): beneath the
  existing large `RoundDelta`, show that seat's captured card points for the round as a smaller
  muted figure (e.g. `47 pts`). For ordinary/Zole this is the seat's own trick points from
  `cardPointsByPlayer[seat]`; note the soloist's banked discard is *not* in that number — the
  soloist's full `bigScore` is shown in `RoundSummary`. Decide during implementation whether the
  per-seat pill shows `cardPointsByPlayer[seat]` for everyone (consistent, "points taken in play")
  or the soloist's full `bigScore` for the soloist seat (matches the headline) — see Open Questions.
  Recommended default: per-seat trick points for everyone (one consistent meaning), with the full
  `bigScore` reserved for the summary block.
- **Component choice**: either extend `RoundDelta.tsx` to accept an optional secondary
  `cardPoints?: number | null` and render it under the delta, or add a tiny `CardPointsPill.tsx`.
  Recommend a separate small component so `RoundDelta` stays single-purpose; both are trivial and
  presentational. Timing reuses the existing `roundOver` gate in `Table.tsx` (hidden mid-trick,
  revealed with the summary).

## D4 — Testing

Engine (`src/engine/scoring.test.ts`, colocated, Vitest):
- Ordinary win: assert `smallScore === 120 - bigScore` and `cardPointsByPlayer[soloist]` +
  the two opponents' entries account for all trick points (talon/discard accounted via bigScore).
- Zole: construct a round with non-zero `pairStock`; assert `smallScore === 120 - bigScore` and
  that `smallScore` exceeds the sum of the two opponents' trick points by exactly `pointsOf(pairStock)`
  (proves the talon is included in the pair total — the case alternative 2 got wrong).
- 60–60 tie: assert `bigScore === 60 && smallScore === 60`, deltas still `[0,0,0]`.
- Galdiņš (single loser and tie): assert `smallScore === null`, `bigScore === null`,
  `cardPointsByPlayer` equals each player's trick points, and deltas are unchanged from today.
- Regression: existing delta/tree assertions remain untouched and passing (proves additive-only).

UI (Testing Library, colocated):
- `RoundSummary.test.tsx`: ordinary/Zole renders the big/small card line; galdiņš renders the
  three per-seat card figures and does *not* claim a 120 sum.
- `OpponentPanel.test.tsx` / `Table` test: at round end each seat shows its card-points pill under
  the delta; mid-trick it is hidden (reuses the `roundOver` gate).
- No new determinism concerns (no RNG touched).

## D5 — Edge cases from the rules

- `bigScore === 120` (soloist swept): `smallScore === 0`; pair shows 0. (§4a top band.)
- `bigScore === 0` (soloist took nothing): `smallScore === 120`. (§4a bottom band.)
- Galdiņš with the 2-card talon unattributed: `sum(cardPointsByPlayer) < 120` is expected and
  correct given current scoring (§4b keys on tricks). UI copy must not assert a 120 sum for galdiņš.
- Ordinary soloist's private discard: contributes to `bigScore` but not to
  `cardPointsByPlayer[soloist]`; the per-seat pill and the summary headline can therefore differ for
  the soloist — documented so it is not read as a bug.
