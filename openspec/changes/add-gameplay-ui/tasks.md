## 1. Driver & hook (ui/game — engine/ai orchestration)

- [ ] 1.1 Add `src/ui/game/driver.ts` with `newGame`, `nextRound`, `humanView`, `isHumanTurn`, `isAiTurn`, `applyHumanMove`, `stepAi`, and `HUMAN`/`AI_SEATS` constants, importing only from the `engine` and `ai` public surfaces (design D1); verify `npm run lint` passes (no boundary/purity violations) and a `driver.test.ts` asserts `stepAi` returns a legal successor state and `isHumanTurn`/`isAiTurn` match `state.current`.
- [ ] 1.2 Add `src/ui/game/cardText.ts` mapping a `Card` to its display glyph/label (rank + `♣ ♠ ♥ ♦`, red/black, trump marker) keyed by `cardId`; verify `cardText.test.ts` covers a red suit, a black suit, and a trump (spec: card rendering is text/emoji — design D4).
- [ ] 1.3 Add `src/ui/game/useZoleGame.ts` owning `GameState` in `useState`, the `Rng` in a `useRef`, `seed`, and UI-local `selectedDiscards`; expose the `ZoleGameVM` (bid/playCard/toggleDiscardSelection/confirmDiscard/dealNextRound/newGame) (design D2, D3); verify it type-checks under strict mode and imports only from `driver`/`engine`/`ai`.
- [ ] 1.4 Implement the AI auto-advance effect in `useZoleGame` (one step per effect run, `setTimeout` delay, `cancelled` flag + `clearTimeout` cleanup, `isAiTurn(s)` re-check inside the `setState` updater) (design D2); verify a `useZoleGame.test.tsx` with fake timers asserts consecutive AI turns chain until the human's turn or round end (spec: AI turns advance automatically).
- [ ] 1.5 Add a StrictMode test mounting `useZoleGame` under `<React.StrictMode>` and asserting an AI turn is applied exactly once (no double application / no double RNG consumption) (design D2 risk); verify the test passes.
- [ ] 1.6 Implement `dealNextRound` (via `carryOverFromEnd` + `dealRound` on the ref RNG) and `newGame(seed?)` (seed generated in the ui layer when omitted, `createRng`) (design D5); verify a test that `dealNextRound` starts a fresh round carrying scores/dealer/tree forward (spec: Deal the next round; Deterministic, seeded games).

## 2. Presentational components (ui/components)

- [ ] 2.1 Add `CardView.tsx` + `Hand.tsx` rendering the human's `hand`, disabling cards not in `legalMoves`, wiring click/selection via `cardId` (design D4); verify `Hand.test.tsx` asserts illegal cards are disabled and clicking a legal card fires the callback (spec: Only legal moves are offered; Human plays a legal card).
- [ ] 2.2 Add `BiddingControls.tsx` rendering exactly the legal bid actions from `legalMoves` (design D4); verify `BiddingControls.test.tsx` asserts only legal bids render/enable and clicking one fires the callback (spec: Human bids).
- [ ] 2.3 Add `DiscardTray.tsx` for the human soloist: select exactly two cards, confirm disabled until two selected, emits `{type:'discard', cards:[a,b]}` (design D3); verify `DiscardTray.test.tsx` covers confirm-disabled-until-two and confirm-emits-the-pair (spec: Human discards two cards).
- [ ] 2.4 Add `TrickArea.tsx` rendering `trick` cards with player attribution and the trick leader/current indicator (design D4); verify `TrickArea.test.tsx` asserts each played card shows with its player (spec: Playing a card advances the trick — presentation).
- [ ] 2.5 Add `OpponentPanel.tsx` showing an `OpponentView` (hand count, tricks won, game points, passed flag, turn/soloist indicator) with no card faces (design D3/D4); verify a test asserts no opponent card faces render (spec: Renders the human's redacted view only).
- [ ] 2.6 Add `Scoreboard.tsx` (cumulative game points for all three + zole-tree branches) and `StatusBanner.tsx` (phase / whose turn / game type / soloist) (design D4); verify a test asserts the scoreboard reflects `gamePoints` (spec: Cumulative scoreboard).
- [ ] 2.7 Add `RoundSummary.tsx` rendering `PlayerView.result` (game type, soloist, settlement summary, per-player deltas) (design D4); verify `RoundSummary.test.tsx` asserts the summary and deltas render (spec: Round summary is shown).
- [ ] 2.8 Add `GameControls.tsx` (deal next round when round over; new game with seed display) and `Table.tsx` composing all components from the VM (design D4); verify a test asserts "deal next round" is only actionable at round end.

## 3. Wiring in app

- [ ] 3.1 Replace `src/ui/App.tsx` to call `useZoleGame()` and render `<Table>` with the VM (design D4/D6); verify `npm run build` succeeds and the placeholder message is gone.
- [ ] 3.2 Confirm `src/app/main.tsx` still mounts `<App/>` (no change expected) and the dev server runs (`npm run dev`); verify manually that a full game is playable end-to-end.

## 4. Integration tests & verification

- [ ] 4.1 Add a hook/integration test that renders the wired UI with a fixed seed, uses fake timers to flush AI delays, and plays a scripted round via user clicks to `phase === 'roundEnd'` with a non-null `result`; assert only legal cards/controls are actionable at each human turn (spec: Human plays a legal card; Only legal moves are offered; Round end shows the scored result).
- [ ] 4.2 Add an all-pass scenario test (human passes, both AIs pass) asserting the UI enters galdiņš trick play with no soloist and scores as galdiņš at round end (spec: All-pass leads to galdiņš in the UI).
- [ ] 4.3 Add a determinism test: two games with the same seed and the same scripted human choices produce identical deals and AI moves (spec: Deterministic, seeded games).
- [ ] 4.4 Run `npm run lint`, `npm run test`, and `npm run build`; verify all pass (boundaries clean, no `any`, no engine/ai purity violations), then run the code-reviewer agent and `.claude/hooks/mark-reviewed.sh`.
