## Context

See proposal.md — Why. The engine is greenfield; `src/engine` and `src/ai` currently hold only
placeholders. Constraints from CLAUDE.md: strict layering (`engine → ai → ui → app`), both engine
and ai must be pure (no React/DOM/I/O, randomness only via injected RNG), and game state must be
immutable data transformed by pure functions. Rules and constants come from `docs/zole-rules.md`.

## Goals / Non-Goals

**Goals:**
- A pure, deterministic engine that can run a complete Zole round headlessly.
- A public API stable enough for the future UI to consume without engine internals leaking.
- Strong information-hiding: a player (AI or human) can only act on what it is allowed to see.
- Baseline `GreedyPlayer` so full games can be simulated and the engine exercised end-to-end.

**Non-Goals (design-level):**
- No lookahead/search AI (full `AIPlayer` heuristics are a later change).
- No serialization/persistence format yet (types are plain data, so this stays easy to add).
- No UI, no networking, no multiplayer.

## Decisions

### D1 — Immutable state + pure `applyMove` reducer (not mutable classes)
The archive uses mutable singletons; we model the round as immutable data and a pure reducer. This
makes the engine trivially testable, replayable, and safe to render from React.

```ts
type PlayerId = 0 | 1 | 2;
type GameType = 'ordinary' | 'zole' | 'galdins';

interface PlayerState {
  readonly hand: readonly Card[];
  readonly captured: readonly Card[]; // cards won in tricks this round
  readonly gamePoints: number;        // cumulative score across rounds
}

interface RoundBase {
  readonly players: readonly [PlayerState, PlayerState, PlayerState];
  readonly dealer: PlayerId;
  readonly current: PlayerId;         // whose turn to act
  readonly zoleTreeBranches: number;
}

interface BiddingState extends RoundBase {
  readonly phase: 'bidding';
  readonly stock: readonly [Card, Card];
  readonly passed: readonly PlayerId[];
}
interface DiscardingState extends RoundBase {
  readonly phase: 'discarding';
  readonly soloist: PlayerId;         // has 10 cards pending a 2-card discard
}
interface PlayingState extends RoundBase {
  readonly phase: 'playing';
  readonly gameType: GameType;
  readonly soloist: PlayerId | null;  // null in galdiņš
  readonly trickLeader: PlayerId;
  readonly trick: readonly { readonly by: PlayerId; readonly card: Card }[]; // 0..3
  readonly soloistDiscard: readonly Card[]; // ordinary: 2 cards banked for soloist
  readonly pairStock: readonly Card[];      // zole: 2 stock cards banked for pair
}
interface RoundEndState extends RoundBase {
  readonly phase: 'roundEnd';
  readonly result: RoundResult;       // per-player deltas + explanation
}

type GameState = BiddingState | DiscardingState | PlayingState | RoundEndState;

type Move =
  | { readonly type: 'bid'; readonly action: 'pickup' | 'zole' | 'pass' }
  | { readonly type: 'discard'; readonly cards: readonly [Card, Card] }
  | { readonly type: 'play'; readonly card: Card };
```

Public engine API (all pure):

```ts
function dealRound(prev: RoundCarryOver, rng: Rng): BiddingState; // shuffle + deal
function legalMoves(state: GameState): readonly Move[];
function applyMove(state: GameState, move: Move): GameState;      // throws on illegal move
function viewFor(state: GameState, player: PlayerId): PlayerView; // redacts hidden info
```

`applyMove` is the single transition; it advances phases internally (e.g. the 3rd card of a trick
resolves the winner and either starts the next trick or moves to `roundEnd`). `RoundCarryOver`
holds what survives between rounds (cumulative `gamePoints`, next dealer, `zoleTreeBranches`).

*Alternative considered:* separate `bid()/discard()/play()` functions (like the archive's
interface). Rejected — a single `Move` union + `legalMoves` gives the UI and AI one uniform contract
and makes illegal states unrepresentable at the call site.

### D2 — Card as plain data; ordering via lookup tables
```ts
type Suit = 'clubs' | 'spades' | 'hearts' | 'diamonds';
type Rank = '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
interface Card { readonly suit: Suit; readonly rank: Rank; }
```
A card is trump iff it is a Queen, a Jack, or a diamond. Strength and legality are computed by pure
helpers (`isTrump`, `ledCategory`, `compareInTrick`) backed by the fixed rank tables in
`docs/zole-rules.md §2`. Cards are compared by value, and a `cardId(card): string` helper gives a
stable key for Sets/React keys. *Alternative:* pre-numbered card objects (archive's `valuepriority`)
— rejected as less readable; a lookup table is equivalent and self-documenting.

### D3 — Information-hiding via `viewFor` / `PlayerView`
AI strategies receive a `PlayerView` (own hand, visible trick, phase, public score, tree branches,
counts of others' cards — never their faces, never the stock/discard), not the full `GameState`.
This makes "AI can't cheat" a structural guarantee and defines exactly what a UI must render for the
human. Strategies live in `src/ai` and never import UI.

### D4 — Injected seedable RNG
```ts
interface Rng { nextInt(maxExclusive: number): number; }
function createRng(seed: number): Rng; // small deterministic PRNG (e.g. mulberry32)
```
Only `dealRound` needs it (shuffle). Determinism makes games reproducible and tests exact. *Alt:*
`Math.random()` — rejected (violates purity/determinism rules).

### D5 — AI as a pure strategy function
```ts
// src/ai
type Strategy = (view: PlayerView, rng: Rng) => Move;
const greedyPlayer: Strategy;
```
The engine never calls the AI; a driver (later, in `ui`/`app`) asks a `Strategy` for a move and feeds
it to `applyMove`. Keeps engine free of AI and AI free of engine internals (depends only on the
public `PlayerView` + `legalMoves`).

### D6 — Module layout
```
src/engine/  cards.ts · trick.ts · rng.ts · state.ts · round.ts · scoring.ts · view.ts · index.ts
src/ai/      strategy.ts · greedy.ts · index.ts
```
`index.ts` in each layer is the public surface; deep imports across layers are discouraged and the
boundary rule already blocks cross-layer imports.

### D7 — Test strategy
- Unit tests per module (deck 26/points 120, ordering, follow-suit legality, trick winner, each
  scoring band with worked numbers from §4, zole tree, galdiņš).
- A **simulation test**: play many full random games driven by `greedyPlayer` under a fixed seed,
  asserting invariants every round — moves are always legal, exactly 8 tricks, captured points sum
  to 120, `gamePoints` deltas net to zero across players.

## Risks / Trade-offs

- [Galdiņš tie for "most tricks" is under-specified in the rules] → Resolved decision: metapoints
  change **only when a single player has strictly the most tricks** — that player pays 2 to each of
  the other two. Any tie for the most tricks (two or three players level at the top) means **no
  payment** that hand. Isolated in `scoring.ts`.
- [Scoring bands keyed on card points, not tricks (archive behavior), diverges from some canonical
  rulesets] → Documented in `docs/zole-rules.md §4`; isolated in `scoring.ts` so it is a one-line
  change if we revisit.
- [`applyMove` throwing on illegal moves] → Callers must consult `legalMoves`/`isLegal` first;
  mitigated by exposing both and covering with tests. UI will only offer legal moves.
- [Immutability copying overhead] → Negligible at 26 cards; clarity wins over micro-optimization.

## Open Questions

None — the galdiņš tie-handling rule is resolved (see Decisions / Risks).
