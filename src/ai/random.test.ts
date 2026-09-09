import { describe, expect, it } from 'vitest';

import {
  applyMove,
  createRng,
  dealRound,
  initialCarryOver,
  isLegal,
  viewFor,
  type Card,
  type GameState,
  type Move,
  type PlayerId,
  type PlayerView,
} from '../engine/index.ts';
import { randomPlayer } from './random.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank });

/** A minimal `PlayerView` fixture whose `legalMoves` we control directly. */
function makeView(legalMoves: readonly Move[], phase: PlayerView['phase'] = 'bidding'): PlayerView {
  return {
    me: 0,
    phase,
    hand: [],
    gamePoints: 0,
    zoleTreeBranches: 0,
    dealer: 2,
    current: 0,
    gameType: null,
    soloist: null,
    trick: [],
    trickLeader: null,
    passed: [],
    opponents: [],
    legalMoves,
    result: null,
  };
}

const moveKey = (m: Move): string => {
  switch (m.type) {
    case 'bid':
      return `bid:${m.action}`;
    case 'discard':
      return `discard:${JSON.stringify(m.cards)}`;
    case 'play':
      return `play:${m.card.suit}-${m.card.rank}`;
  }
};

/** Drive a full round to `roundEnd` with `randomPlayer` at every seat, asserting legality. */
function playRoundToEnd(seed: number, sharedRng: boolean): GameState {
  let state: GameState = dealRound(initialCarryOver(), createRng(seed));
  const rng = createRng(seed + 1);
  let guard = 0;

  while (state.phase !== 'roundEnd') {
    if (guard++ > 1000) throw new Error('round did not terminate');
    const seat: PlayerId = state.current;
    const view = viewFor(state, seat);
    const decisionRng = sharedRng ? rng : createRng(seed * 31 + guard);
    const move = randomPlayer(view, decisionRng);
    expect(isLegal(state, move)).toBe(true);
    state = applyMove(state, move);
  }
  return state;
}

// ---------------------------------------------------------------------------
// Legality property: full real games
// ---------------------------------------------------------------------------

describe('randomPlayer — legality property (full game)', () => {
  const seeds = [1, 2, 3, 7, 42, 99, 123, 2024];

  for (const seed of seeds) {
    it(`reaches roundEnd with only legal moves (shared rng, seed ${seed})`, () => {
      const end = playRoundToEnd(seed, true);
      expect(end.phase).toBe('roundEnd');
    });

    it(`reaches roundEnd with only legal moves (fresh rng, seed ${seed})`, () => {
      const end = playRoundToEnd(seed, false);
      expect(end.phase).toBe('roundEnd');
    });
  }
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('randomPlayer — determinism', () => {
  it('same view + identically-seeded rngs return the same move', () => {
    const state = dealRound(initialCarryOver(), createRng(5));
    const view = viewFor(state, state.current);

    for (let seed = 0; seed < 20; seed++) {
      const a = randomPlayer(view, createRng(seed));
      const b = randomPlayer(view, createRng(seed));
      expect(moveKey(a)).toBe(moveKey(b));
    }
  });
});

// ---------------------------------------------------------------------------
// Coverage / uniformity smoke test
// ---------------------------------------------------------------------------

describe('randomPlayer — coverage smoke test', () => {
  it('picks more than one distinct move over many seeds, all within legalMoves', () => {
    const legal: readonly Move[] = [
      { type: 'play', card: card('clubs', 'A') },
      { type: 'play', card: card('spades', 'K') },
      { type: 'play', card: card('hearts', '10') },
    ];
    const view = makeView(legal, 'playing');
    const legalKeys = new Set(legal.map(moveKey));

    const chosen = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const m = randomPlayer(view, createRng(seed));
      const key = moveKey(m);
      expect(legalKeys.has(key)).toBe(true);
      chosen.add(key);
    }

    expect(chosen.size).toBeGreaterThan(1);
  });

  it('uses the injected rng (a stub index selects the corresponding move)', () => {
    const legal: readonly Move[] = [
      { type: 'bid', action: 'pickup' },
      { type: 'bid', action: 'zole' },
      { type: 'bid', action: 'pass' },
    ];
    const view = makeView(legal, 'bidding');

    for (let i = 0; i < legal.length; i++) {
      const stub = { nextInt: () => i };
      expect(moveKey(randomPlayer(view, stub))).toBe(moveKey(legal[i]!));
    }
  });
});

// ---------------------------------------------------------------------------
// Empty-case guard
// ---------------------------------------------------------------------------

describe('randomPlayer — guards', () => {
  it('throws a clear error when there are no legal moves', () => {
    const view = makeView([], 'roundEnd');
    const rng = createRng(1);
    expect(() => randomPlayer(view, rng)).toThrow(/no legal move/);
  });
});
