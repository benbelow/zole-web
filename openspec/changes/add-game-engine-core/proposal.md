## Why

The project has a scaffold but no game logic. Before any UI work we need a correct, pure,
well-tested Zole engine and a basic AI opponent so that a full round can be played
programmatically. Getting the engine's state model and API right now — and reviewed — prevents
rework once the UI depends on it. Rules are defined in `docs/zole-rules.md`.

## What Changes

- Introduce a **pure game engine** (`src/engine`) implementing the Zole rules end-to-end:
  - The 26-card deck, card point values, and the trump/suit ordering (rules §1, §2).
  - Trick resolution: follow-suit legality and winner determination (rules §2, §3).
  - The round **state machine**: deal → bidding → put-down → play (8 tricks) → scoring → next
    round, including the **galdiņš** branch when all players pass (rules §3).
  - **Scoring**: ordinary/Zole bands and per-opponent settlement, galdiņš, and the zole-tree
    bonus (rules §4).
  - Deterministic shuffling via an **injected seedable RNG** (no ambient randomness).
- Introduce a baseline **AI player** (`src/ai`): the `GreedyPlayer` bid/discard/play strategy
  (rules §5) so rounds can be simulated against automated opponents.
- The engine exposes game logic as **pure reducer-style functions over an immutable `GameState`**,
  the deliberate departure from the archive's mutable singletons (rules §6).
- **Out of scope for this change**: the full `AIPlayer` heuristics, mazā zole, any UI, and
  persistence. (Galdiņš *scoring/flow* is in; galdiņš *AI strategy* is minimal — GreedyPlayer
  simply plays low.)

## Capabilities

### New Capabilities
- `game-engine`: the pure, deterministic Zole rules engine — deck & ordering, trick resolution,
  round state machine (incl. galdiņš), and scoring (bands, settlement, zole tree).
- `ai-player`: automated player decisions for bidding, discarding, and card play; this change
  delivers the baseline `GreedyPlayer`.

### Modified Capabilities
<!-- None — this is the first change; no existing specs. -->

## Impact

- New code under `src/engine/**` and `src/ai/**` (both must stay pure per CLAUDE.md; enforced by
  `eslint-plugin-boundaries`).
- No changes to `src/ui` or `src/app` yet; the placeholder `App` is untouched.
- No new runtime dependencies expected (the RNG is a small internal utility). New tests under
  Vitest. Establishes the public engine/AI API that the future UI change will consume.
