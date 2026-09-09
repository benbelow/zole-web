## Why

The engine (`src/engine`) and a baseline AI (`src/ai`, `greedyPlayer`) are implemented, but the
browser UI is still a placeholder that renders a static message. Nobody can actually *play* Zole
yet. This change adds the gameplay UI so a human (player 0) can play complete rounds and a
continuing game against two `greedyPlayer` AI opponents (players 1 and 2), driven entirely by the
existing pure engine/AI public API. It closes the loop from "engine can simulate a round headlessly"
to "a person can sit down and play in the browser".

## What Changes

- Add a **`ui` layer game driver + React hook** (`useZoleGame`) that owns the immutable `GameState`,
  exposes the human's redacted `PlayerView`, applies human moves via the engine's `applyMove`, and
  **auto-advances AI turns**: whenever `state.current` is an AI seat it computes
  `greedyPlayer(viewFor(state, current), rng)` and applies it, on a small readability delay.
- Add a **component tree** that renders the human's `PlayerView`: a table with two opponent panels,
  the current trick area, the human's hand, phase-specific controls (bidding, ordinary-game
  discard, trick play), a cumulative scoreboard, a round-end summary, and game controls
  ("deal next round", new game with a chosen seed).
- Enforce **playability + correctness over polish**: only legal moves are actionable/offered
  (cards not in `PlayerView.legalMoves` are visibly disabled), follow-suit is enforced by the engine
  and reflected in the UI, and every phase from `docs/zole-rules.md §3` is reachable:
  bidding (pickup / zole / pass), ordinary-game put-down (select exactly 2 to discard), 8 tricks of
  play, **galdiņš** when all three pass, round-end scoring, and dealing the next round with
  carry-over threaded through `carryOverFromEnd` / `dealRound`.
- Wire the hook + components into `src/app/main.tsx` so the placeholder `App` becomes the real game.
- Add **Testing Library component tests** and a **hook/integration test** that plays a scripted
  round through the UI (human clicks) to round end, asserting only-legal cards are actionable and
  the round reaches a scored result.

### Non-goals (kept out to hold scope tight)

- Animations / transitions / drag-and-drop (cards are static, text/emoji `♣ ♠ ♥ ♦` — no image assets).
- Mazā zole and any bidding variant beyond pickup / zole / pass (`docs/zole-rules.md §4d`).
- The full `AIPlayer` heuristics — opponents use the baseline `greedyPlayer` only (§5).
- Persistence / save-resume, networking, multiplayer, and mobile-optimized/responsive layout.
- A dedicated galdiņš AI strategy (greedyPlayer simply plays low; noted as a follow-up).
- Configurable human seat — the human is always player 0 in v1.

## Capabilities

### New Capabilities
- `gameplay-ui`: the interactive browser UI that lets a human play a full Zole game against two AI
  opponents on top of the engine/AI public API — bidding, discard, trick play, galdiņš, round-end
  scoring, cumulative scoreboard, and next-round dealing, with automatic AI turn advancement.

### Modified Capabilities
<!-- None — the engine and ai capabilities are consumed unchanged via their public surfaces. -->

## Impact

- New code under `src/ui/**` (the `useZoleGame` hook, a thin driver, and React components) and a
  change to `src/app/main.tsx` to mount the real game. No changes to `src/engine` or `src/ai`.
- The `ui` layer imports **only** from `engine` and `ai` public surfaces (`src/engine`, `src/ai`),
  per the strict layering in CLAUDE.md (enforced by `eslint-plugin-boundaries`). All impurity
  (timers for AI delay, seed generation) lives in the `ui`/`app` layers; `engine` and `ai` stay pure.
- New Vitest + Testing Library tests colocated under `src/ui/**`. No new runtime dependencies beyond
  React (already present); `@testing-library/react` may need to be added as a dev dependency if not
  already installed (see Open Questions in design.md).
