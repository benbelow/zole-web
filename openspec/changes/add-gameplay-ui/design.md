## Context

See proposal.md — Why. The pure engine (`src/engine`) and baseline AI (`src/ai`, `greedyPlayer`)
are implemented and exposed through their `index.ts` public surfaces. The UI is still the placeholder
`src/ui/App.tsx` (a static message) mounted by `src/app/main.tsx`.

Constraints from CLAUDE.md:
- Strict layering `engine → ai → ui → app` (enforced by `eslint-plugin-boundaries`). The `ui` layer
  may import from `engine` and `ai` only, and only from their public `index.ts`.
- `engine` and `ai` MUST stay pure: no React/DOM/timers/I/O, randomness only via injected RNG. All
  impurity introduced by this change (timers for AI pacing, seed generation, React state) lives in
  `ui`/`app`.
- Immutable state transformed by pure functions; TypeScript strict, no `any`; colocated Vitest +
  Testing Library tests.

The engine public surface this UI builds on (from `src/engine/index.ts`, `src/engine/state.ts`):
`dealRound(carryOver, rng)`, `legalMoves(state)`, `isLegal(state, move)`, `applyMove(state, move)`,
`viewFor(state, player)`, `carryOverFromEnd(end)`, `initialCarryOver()`, `createRng(seed)`, and the
types `GameState`, `Move`, `PlayerView`, `OpponentView`, `RoundResult`, `Card`, `PlayerId`,
`TrickCard`, `Phase`. From `src/ai/index.ts`: `greedyPlayer: Strategy`,
`Strategy = (view: PlayerView, rng: Rng) => Move`.

## Goals / Non-Goals

**Goals:**
- A fully playable browser game: a human (seat 0) completes rounds and a continuing game vs two
  `greedyPlayer` AIs, covering every phase in `docs/zole-rules.md §3`.
- The UI consumes only the engine/AI public API; it re-implements no rules. Legality, phase
  transitions, and scoring all come from the engine.
- AI turns advance automatically and deterministically; games are reproducible from a seed.
- Correctness and playability over visual polish.

**Non-Goals (design-level):** animations, mazā zole, full `AIPlayer`, persistence, networking,
mobile/responsive layout, configurable human seat, and a galdiņš-specific AI (see proposal Non-goals).

## Decisions

### D1 — A thin `ui` driver separated from React

Put the engine/AI orchestration in a small **pure-ish driver module** (`src/ui/game/driver.ts`) that
knows nothing about React, so it can be unit-tested directly and keeps the hook small. It wraps the
engine calls the app needs:

```ts
// src/ui/game/driver.ts — imports only from 'engine' and 'ai'
import {
  dealRound, applyMove, viewFor, carryOverFromEnd, initialCarryOver, createRng,
  type GameState, type Move, type PlayerView, type PlayerId, type Rng,
} from 'engine'; // via src/engine/index.ts
import { greedyPlayer } from 'ai';

export const HUMAN: PlayerId = 0;
export const AI_SEATS: readonly PlayerId[] = [1, 2];

/** Start a brand-new game from a seed. */
export function newGame(seed: number): { state: GameState; rng: Rng } {
  const rng = createRng(seed);
  return { state: dealRound(initialCarryOver(), rng), rng };
}

/** Deal the next round, threading carry-over from a finished round. */
export function nextRound(prev: GameState, rng: Rng): GameState {
  // prev must be a roundEnd state
  return dealRound(carryOverFromEnd(prev), rng);
}

/** The human's redacted view of the current state. */
export function humanView(state: GameState): PlayerView {
  return viewFor(state, HUMAN);
}

export function isHumanTurn(state: GameState): boolean {
  return state.phase !== 'roundEnd' && state.current === HUMAN;
}

export function isAiTurn(state: GameState): boolean {
  return state.phase !== 'roundEnd' && state.current !== HUMAN;
}

/** Apply a human move (already known-legal because the UI only offers legal moves). */
export function applyHumanMove(state: GameState, move: Move): GameState {
  return applyMove(state, move);
}

/** Compute + apply one AI move for the current (AI) seat. Pure w.r.t. its inputs. */
export function stepAi(state: GameState, rng: Rng): GameState {
  const view = viewFor(state, state.current);
  const move = greedyPlayer(view, rng);
  return applyMove(state, move);
}
```

Note the driver never loops or sleeps — it advances exactly one step. Pacing/looping is the hook's
job (D2). This keeps the driver deterministic and trivially testable.

*Note on the import specifiers:* the exact form (`'engine'`/`'ai'` path aliases vs. relative
`../../engine`) follows whatever the repo's `tsconfig`/eslint-boundaries already use; the driver's
contract is unaffected. (See Open Questions.)

### D2 — `useZoleGame` hook owns state and auto-advances AI turns

A single hook owns the authoritative `GameState` and the `Rng` and exposes a view-model to the
components. The `Rng` is a stateful object (its internal counter advances on each `nextInt`), so it
is stored in a ref, not React state — it must survive re-renders and never be re-created on render.

```ts
// src/ui/game/useZoleGame.ts
export interface ZoleGameVM {
  readonly view: PlayerView;          // viewFor(state, 0)
  readonly phase: Phase;
  readonly isHumanTurn: boolean;
  readonly isRoundOver: boolean;
  readonly seed: number;
  // human actions (each a no-op unless it is the human's turn / legal):
  bid(action: BidAction): void;
  toggleDiscardSelection(card: Card): void;  // UI-local selection state
  selectedDiscards: readonly Card[];
  confirmDiscard(): void;                     // enabled only when 2 selected
  playCard(card: Card): void;
  dealNextRound(): void;
  newGame(seed?: number): void;
}
export function useZoleGame(initialSeed?: number): ZoleGameVM;
```

Internal shape:
- `const [state, setState] = useState<GameState>(...)` — initialized from `driver.newGame(seed)`.
- `const rngRef = useRef<Rng>(...)` — the live RNG.
- `const [seed, setSeed] = useState<number>(...)`.
- `const [selectedDiscards, setSelectedDiscards] = useState<readonly Card[]>([])`.

**Auto-advancing AI turns** is an effect that fires whenever `state` changes:

```ts
useEffect(() => {
  if (!isAiTurn(state)) return;
  let cancelled = false;
  const id = setTimeout(() => {
    if (cancelled) return;
    setState((s) => (isAiTurn(s) ? stepAi(s, rngRef.current) : s));
  }, AI_DELAY_MS);
  return () => { cancelled = true; clearTimeout(id); };
}, [state]);
```

Each effect run advances **one** AI step; applying it changes `state`, which re-runs the effect and
advances the next AI seat — so consecutive AI turns chain naturally without an explicit loop. When
control returns to the human (or the round ends) the guard `!isAiTurn(state)` stops the chain.

**StrictMode double-invoke safety.** React 18 StrictMode mounts effects twice in dev. The pattern
above is safe because:
- The `cancelled` flag + `clearTimeout` cleanup ensures the first (immediately-cleaned-up) effect
  run never fires its timer.
- `setState((s) => isAiTurn(s) ? stepAi(s, rng) : s)` re-checks the *current* state in the updater,
  so a stale timer that does fire cannot double-apply (the guard rejects it once the seat changed).
- The stateful `Rng` in a ref is the one mutation risk: if two timers ever both called `stepAi` they
  would both consume RNG draws. The cancel/clear pattern prevents two live timers at once. As a
  belt-and-braces measure the effect keys on `state` (not a counter) and only ever schedules while
  the *current* state is an AI turn.

*Alternative considered:* a `useReducer` + explicit `advanceAll` loop that synchronously drains AI
turns. Rejected for v1 because the per-step delay is the whole point (readability), and an
effect-per-step keeps the render output consistent with each intermediate state (the human sees each
AI card land). A reducer could still be adopted later without changing the component contract.

### D3 — Discard selection is UI-local, everything else is engine-derived

The only UI-owned state beyond `GameState`/`Rng`/`seed` is the human's in-progress discard selection
(which two cards are highlighted before confirming). It never touches the engine until
`confirmDiscard()` builds `{ type: 'discard', cards: [a, b] }` and calls `applyMove`. Selection is
cleared whenever the phase leaves `discarding`. All legality (which cards, that exactly two are
required) is validated against `PlayerView.legalMoves` — the engine's discard legal-moves enumerate
the valid pairs, so the confirm button maps a chosen pair to one of them.

### D4 — Rendering strictly from `PlayerView`

Components are pure presentational functions of `PlayerView` (plus a few UI-local props like
selection and callbacks). Mapping:

| Component | `PlayerView` fields consumed |
| --- | --- |
| `Table` (layout container) | whole `view`; distributes to children |
| `OpponentPanel` (×2) | `opponents[i]` (`handCount`, `tricksWon`, `gamePoints`, `hasPassed`, `id`), `current`, `soloist` |
| `TrickArea` | `trick` (`TrickCard[]`), `trickLeader`, `current` |
| `Hand` → `CardView[]` | `hand`, plus `legalMoves` to decide which cards are enabled |
| `BiddingControls` | `legalMoves` filtered to `type==='bid'`, `phase`, `current` |
| `DiscardTray` | `hand`, UI-local `selectedDiscards`, `legalMoves` (discard pairs) |
| `Scoreboard` | `me`+`gamePoints`, `opponents[].gamePoints`, `zoleTreeBranches` |
| `RoundSummary` | `result` (`RoundResult`: `gameType`, `soloist`, `bigScore`, `deltas`, `summary`, tree before/after) |
| `GameControls` | `phase`/`isRoundOver`, `seed`; callbacks `dealNextRound`, `newGame` |
| `StatusBanner` | `phase`, `current`, `gameType`, `soloist` — whose turn / what phase |

Cards render as text/emoji: rank + suit glyph (`♣ ♠ ♥ ♦`), red for ♥/♦, black for ♣/♠; trumps may
get a subtle marker. No image assets. `cardId(card)` (already exported by the engine) is the React
`key` and the identity used for click handlers and selection.

Component tree:

```
App
└── Table
    ├── StatusBanner
    ├── Scoreboard
    ├── OpponentPanel (player 1)
    ├── OpponentPanel (player 2)
    ├── TrickArea
    ├── Hand → CardView*        (human's cards)
    ├── BiddingControls         (phase === 'bidding' && human turn)
    ├── DiscardTray             (phase === 'discarding' && human is soloist)
    ├── RoundSummary            (phase === 'roundEnd')
    └── GameControls            (deal next round / new game + seed)
```

Only the control for the active phase renders (or is enabled); the rest are hidden/disabled.

### D5 — Seed / RNG ownership

`createRng(seed)` and the seed live in the `ui`/`app` layer. `newGame` accepts an optional seed;
when omitted the app generates one (e.g. `Date.now()` or `crypto.getRandomValues` — a one-time,
UI-layer, non-engine source) and surfaces it in `GameControls` so a game is reproducible and can be
shared/re-run. The engine/AI never see `Math.random`. Because the whole game (deals + AI moves) is
driven by this one seeded `Rng`, a fixed seed + identical human choices reproduces the game exactly
(supports the deterministic test in D7).

*Note:* AI moves consume RNG draws from the same `Rng`, so a game's RNG stream interleaves deals and
AI decisions. That is fine for reproducibility but means a game replays identically only if the
human's choices (and thus which seats the AI plays and when) are identical — which is the intended
determinism contract.

### D6 — Module layout (all under `src/ui`)

```
src/ui/
  App.tsx                      (replaces placeholder; renders <Table> via useZoleGame)
  game/
    driver.ts                  (engine/ai orchestration, no React)  + driver.test.ts
    useZoleGame.ts             (the hook)                            + useZoleGame.test.tsx
    cardText.ts                (Card → display glyph/label helper)   + cardText.test.ts
  components/
    Table.tsx
    StatusBanner.tsx
    OpponentPanel.tsx          + OpponentPanel.test.tsx
    TrickArea.tsx              + TrickArea.test.tsx
    Hand.tsx / CardView.tsx    + Hand.test.tsx
    BiddingControls.tsx        + BiddingControls.test.tsx
    DiscardTray.tsx            + DiscardTray.test.tsx
    Scoreboard.tsx
    RoundSummary.tsx           + RoundSummary.test.tsx
    GameControls.tsx
```

`src/app/main.tsx` continues to mount `<App/>`; only `App`'s implementation changes.

### D7 — Test strategy

- **Component tests (Testing Library)** for each interactive component from a hand-built `PlayerView`
  fixture: `Hand`/`CardView` disables illegal cards; `BiddingControls` renders exactly the legal
  bids; `DiscardTray` disables confirm until two are selected; `TrickArea` renders played cards with
  attribution; `RoundSummary` shows the settlement.
- **Hook / integration test**: render a component wired to `useZoleGame` with a **fixed seed**, then
  drive a scripted round via user clicks (the human bids, and either discards or plays through the
  tricks). Use fake timers (`vi.useFakeTimers`) to flush the AI-advance delay deterministically.
  Assert: (a) at each human turn only legal cards/controls are actionable; (b) attempting nothing
  illegal is possible (illegal cards are disabled); (c) the round reaches `phase === 'roundEnd'` with
  a non-null `result`; (d) "deal next round" starts a fresh round carrying scores forward.
- **StrictMode test**: mount under `<React.StrictMode>` and assert an AI turn advances exactly once
  (no double application) — guards the D2 concern.
- **Driver unit tests** (no React): `newGame`/`nextRound`/`stepAi`/`isHumanTurn`/`isAiTurn` behave as
  specified and `stepAi` only ever returns states reachable by a legal AI move.

## Risks / Trade-offs

- **[StrictMode / double timer double-consuming the RNG]** → Mitigated by the cancel-flag + clear
  cleanup and the `isAiTurn(s)` re-check inside the state updater (D2). Covered by the StrictMode
  test. This is the highest-risk area and is called out for review.
- **[AI move could be illegal → `applyMove` throws]** → The engine guarantees `greedyPlayer` returns
  a legal move (engine change's "Legal moves only" requirement); the UI does not catch/handle an
  engine throw beyond surfacing it. If desired we can add a defensive error boundary (follow-up).
- **[Effect-per-step pacing vs. a synchronous drain]** → Chosen effect-per-step for readability and
  faithful intermediate rendering; slightly more effect churn. Acceptable at 3 players / 8 tricks.
- **[Threading carry-over]** → Uses `carryOverFromEnd` + `dealRound` exactly as the engine intends;
  the hook holds no bespoke carry-over logic, avoiding divergence from engine rules.
- **[No galdiņš-specific AI]** → `greedyPlayer` plays low in galdiņš (acceptable for v1); flagged as
  a follow-up, not part of this change.

## Open Questions

1. **Import specifier / path alias** — do we reference the engine/AI as bare module names
   (`engine`, `ai`) via tsconfig paths, or relative paths? Should match the existing repo convention
   and the `eslint-plugin-boundaries` config; confirm before implementation (does not affect the
   design contract).
2. **`@testing-library/react` availability** — is it already a dev dependency? If not, adding it is
   part of this change (dev-only, `ui`-layer). Confirm so the test tasks are unblocked.
3. **Seed UX** — should the seed be visible/editable in the UI (shareable, reproducible games) or
   purely internal for v1? Recommendation: show a read-only seed with a "new game" button that
   generates a fresh one; editing the seed can be a follow-up.
4. **Should the human be able to pick a seat other than 0?** Recommendation: no for v1 (locked to
   seat 0) to keep scope tight; revisit if desired.
