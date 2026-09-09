# Tasks — Round-end captured card points (zole-web-g6t)

Each top-level task should become a `bd` issue linked to this change. Implement only after the
proposal is approved (CLAUDE.md spec-driven gate).

## 1. Engine — extend `RoundResult` (pure)

- [x] 1.1 Add `smallScore: number | null` and `cardPointsByPlayer: readonly [number, number, number]`
  to the `RoundResult` interface in `src/engine/state.ts`, with doc comments matching design D1
  (trick-points-only semantics; `smallScore` null in galdiņš). No renames or removals.
- [x] 1.2 In `src/engine/scoring.ts`, compute `cardPointsByPlayer` once at the top of `scoreRound`
  from `players[i].captured`, and populate `smallScore` + `cardPointsByPlayer` on **every** return
  path (galdiņš single-loser, galdiņš tie, 60–60 tie, soloist win, soloist loss). For ordinary/Zole
  use `smallScore = 120 - bigScore`; for galdiņš `smallScore = null`. Leave all deltas / tree logic
  and `bigScore` unchanged (design D2).
- [x] 1.3 Verify `src/engine/index.ts` still re-exports `RoundResult` (shape-only growth; no export
  change expected).

## 2. Engine tests

- [x] 2.1 Extend `src/engine/scoring.test.ts`: ordinary win asserts `smallScore === 120 - bigScore`
  and per-player trick totals; Zole case with non-empty `pairStock` asserts the talon is included in
  `smallScore` (design D4, alternative-2 guard).
- [x] 2.2 Add 60–60 tie assertion (`bigScore === 60 && smallScore === 60`, deltas `[0,0,0]`) and
  galdiņš assertions (`smallScore === null`, `cardPointsByPlayer` = each player's trick points,
  deltas unchanged; sum may be < 120).
- [x] 2.3 Confirm all pre-existing scoring/delta/tree assertions still pass (additive-only).

## 3. UI — round summary block

- [x] 3.1 In `src/ui/components/RoundSummary.tsx`, render the big/small card-point split for
  ordinary/Zole (`bigScore` vs `smallScore`) and, for galdiņš, each player's `cardPointsByPlayer`
  labelled so it does not imply a 120 sum (design D3).
- [x] 3.2 Add/extend `RoundSummary.test.tsx` covering the ordinary/Zole split line and the galdiņš
  per-seat line.

## 4. UI — per-seat secondary figure

- [x] 4.1 Add a small presentational element for the seat's captured card points (new
  `CardPointsPill.tsx`, or an optional prop on `RoundDelta.tsx` — design D3 recommends a separate
  component). Include an accessible label.
- [x] 4.2 In `src/ui/components/Table.tsx`, derive each seat's card points from `view.result`
  (`cardPointsByPlayer[seat]`) under the same `roundOver` gate as the delta; pass it to the human
  area and to `OpponentPanel`.
- [x] 4.3 In `src/ui/components/OpponentPanel.tsx`, render the new figure beneath the existing
  `RoundDelta` (hidden when null / mid-trick).
- [x] 4.4 Add/extend component tests: at round end each seat shows its card-points figure; it is
  hidden mid-trick.

## 5. Verification

- [x] 5.1 Run `npm run lint` (boundaries + purity clean — engine unchanged in purity, UI reads only
  the engine public `RoundResult`), `npm run test`, and `npm run build`.
- [x] 5.2 Run the `code-reviewer` agent and mark reviewed per the Stop-hook workflow.
