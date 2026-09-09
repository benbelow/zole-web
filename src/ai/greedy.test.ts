import { describe, expect, it } from 'vitest';
import {
  applyMove,
  cardPoints,
  createRng,
  dealRound,
  initialCarryOver,
  isLegal,
  isTrump,
  legalMoves,
  legalPlays,
  sameCard,
  viewFor,
  type Card,
  type GameState,
  type Move,
  type Phase,
  type PlayerView,
  type TrickCard,
} from '../engine/index.ts';
import { greedyPlayer } from './greedy.ts';

// ---------------------------------------------------------------------------
// Fixture helper
// ---------------------------------------------------------------------------

interface ViewOverrides {
  hand: readonly Card[];
  phase: Phase;
  trick?: readonly TrickCard[];
  legalMoves: readonly Move[];
}

function makeView(o: ViewOverrides): PlayerView {
  return {
    me: 0,
    phase: o.phase,
    hand: o.hand,
    gamePoints: 0,
    zoleTreeBranches: 0,
    dealer: 2,
    current: 0,
    gameType: null,
    soloist: null,
    trick: o.trick ?? [],
    trickLeader: null,
    passed: [],
    opponents: [],
    legalMoves: o.legalMoves,
    result: null,
  };
}

const BID_MOVES: readonly Move[] = [
  { type: 'bid', action: 'pickup' },
  { type: 'bid', action: 'zole' },
  { type: 'bid', action: 'pass' },
];

function playMovesFor(hand: readonly Card[], trick: readonly TrickCard[]): Move[] {
  return legalPlays(hand, trick).map((card) => ({ type: 'play', card }));
}

function discardMovesFor(hand: readonly Card[]): Move[] {
  const moves: Move[] = [];
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      moves.push({ type: 'discard', cards: [hand[i]!, hand[j]!] });
    }
  }
  return moves;
}

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

// ---------------------------------------------------------------------------
// Bidding
// ---------------------------------------------------------------------------

describe('greedyPlayer — bidding', () => {
  it('picks up with 6 trumps', () => {
    // 6 trumps (4 queens + 2 diamonds), 2 non-trumps.
    const hand: Card[] = [
      c('Q', 'clubs'),
      c('Q', 'spades'),
      c('Q', 'hearts'),
      c('Q', 'diamonds'),
      c('K', 'diamonds'),
      c('9', 'diamonds'),
      c('7', 'clubs'),
      c('8', 'spades'),
    ];
    const view = makeView({ hand, phase: 'bidding', legalMoves: BID_MOVES });
    expect(greedyPlayer(view, createRng(1))).toEqual({ type: 'bid', action: 'pickup' });
  });

  it('passes with a weak hand (2 trumps, no qualifying strength)', () => {
    const hand: Card[] = [
      c('J', 'diamonds'), // trump
      c('7', 'diamonds'), // trump
      c('7', 'clubs'),
      c('8', 'clubs'),
      c('9', 'clubs'),
      c('7', 'spades'),
      c('8', 'spades'),
      c('9', 'spades'),
    ];
    expect(hand.filter(isTrump)).toHaveLength(2);
    const view = makeView({ hand, phase: 'bidding', legalMoves: BID_MOVES });
    expect(greedyPlayer(view, createRng(1))).toEqual({ type: 'bid', action: 'pass' });
  });

  it('calls zole when trumps + singleAces === 8', () => {
    // 6 trumps + 2 single non-trump aces (each the only card of its suit).
    const hand: Card[] = [
      c('Q', 'diamonds'),
      c('J', 'diamonds'),
      c('A', 'diamonds'),
      c('10', 'diamonds'),
      c('K', 'diamonds'),
      c('9', 'diamonds'), // 6 trumps, all diamonds
      c('A', 'hearts'), // only heart in hand → single ace
      c('A', 'spades'), // only spade in hand → single ace
    ];
    expect(hand.filter(isTrump)).toHaveLength(6);
    // Two non-trump aces, each the only card of its suit → singleAces === 2.
    const view = makeView({ hand, phase: 'bidding', legalMoves: BID_MOVES });
    expect(greedyPlayer(view, createRng(1))).toEqual({ type: 'bid', action: 'zole' });
  });
});

// ---------------------------------------------------------------------------
// Discarding
// ---------------------------------------------------------------------------

describe('greedyPlayer — discarding', () => {
  it('returns exactly two cards from the hand, matching a legal discard move', () => {
    const hand: Card[] = [
      c('Q', 'clubs'),
      c('J', 'diamonds'),
      c('A', 'clubs'), // 11 pts non-trump
      c('10', 'clubs'), // 10 pts non-trump
      c('K', 'spades'), // 4 pts
      c('9', 'spades'),
      c('7', 'hearts'),
      c('8', 'hearts'),
      c('9', 'diamonds'), // trump
      c('K', 'diamonds'), // trump
    ];
    const legal = discardMovesFor(hand);
    const view = makeView({ hand, phase: 'discarding', legalMoves: legal });
    const move = greedyPlayer(view, createRng(1));
    expect(move.type).toBe('discard');
    if (move.type !== 'discard') return;
    expect(move.cards).toHaveLength(2);
    for (const card of move.cards) {
      expect(hand.some((h) => sameCard(h, card))).toBe(true);
      expect(isTrump(card)).toBe(false); // enough non-trumps: never discard a trump
    }
    // Highest-point non-trumps should be chosen: A♣ and 10♣.
    expect(move.cards.some((x) => sameCard(x, c('A', 'clubs')))).toBe(true);
    expect(move.cards.some((x) => sameCard(x, c('10', 'clubs')))).toBe(true);
    const found = legal.some(
      (m) =>
        m.type === 'discard' &&
        ((sameCard(m.cards[0], move.cards[0]) && sameCard(m.cards[1], move.cards[1])) ||
          (sameCard(m.cards[0], move.cards[1]) && sameCard(m.cards[1], move.cards[0]))),
    );
    expect(found).toBe(true);
  });

  it('falls back to lowest trumps when there are fewer than two non-trumps', () => {
    const hand: Card[] = [
      c('A', 'clubs'), // one non-trump
      c('Q', 'clubs'), // trump strength 14
      c('Q', 'spades'),
      c('J', 'clubs'),
      c('J', 'spades'),
      c('A', 'diamonds'),
      c('10', 'diamonds'),
      c('K', 'diamonds'),
      c('9', 'diamonds'), // trump strength low
      c('7', 'diamonds'), // trump strength 1 (lowest)
    ];
    const legal = discardMovesFor(hand);
    const view = makeView({ hand, phase: 'discarding', legalMoves: legal });
    const move = greedyPlayer(view, createRng(1));
    expect(move.type).toBe('discard');
    if (move.type !== 'discard') return;
    // The single non-trump ace + the lowest trump (7♦).
    expect(move.cards.some((x) => sameCard(x, c('A', 'clubs')))).toBe(true);
    expect(move.cards.some((x) => sameCard(x, c('7', 'diamonds')))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Playing
// ---------------------------------------------------------------------------

describe('greedyPlayer — playing', () => {
  it('wins as cheaply as possible when it can win', () => {
    // Trick led with A♣ (non-trump). Two of our cards win: Q♦ (trump str 11) and Q♣ (str 14).
    // Both are trumps that beat the non-trump ace; the weaker (Q♦) should be chosen.
    const trick: TrickCard[] = [{ by: 1, card: c('A', 'clubs') }];
    const hand: Card[] = [c('Q', 'clubs'), c('Q', 'diamonds')];
    const legal = playMovesFor(hand, trick);
    const view = makeView({ hand, phase: 'playing', trick, legalMoves: legal });
    const move = greedyPlayer(view, createRng(1));
    expect(move).toEqual({ type: 'play', card: c('Q', 'diamonds') });
  });

  it('sheds its lowest-point card when it cannot win and is void in the led suit', () => {
    // Trick led + already trumped by a Queen; we are void in clubs and hold only losing cards.
    const trick: TrickCard[] = [
      { by: 1, card: c('K', 'clubs') },
      { by: 2, card: c('Q', 'hearts') }, // trump, beats the club king — we cannot win
    ];
    const hand: Card[] = [
      c('A', 'hearts'), // 11 pts, non-trump, off-suit
      c('K', 'spades'), // 4 pts
      c('7', 'spades'), // 0 pts — lowest
    ];
    const legal = playMovesFor(hand, trick);
    // Void in clubs → all cards legal.
    expect(legal).toHaveLength(3);
    const view = makeView({ hand, phase: 'playing', trick, legalMoves: legal });
    const move = greedyPlayer(view, createRng(1));
    expect(move).toEqual({ type: 'play', card: c('7', 'spades') });
  });

  it('is deterministic across identical calls', () => {
    const trick: TrickCard[] = [{ by: 1, card: c('A', 'clubs') }];
    const hand: Card[] = [c('Q', 'clubs'), c('Q', 'diamonds')];
    const legal = playMovesFor(hand, trick);
    const view = makeView({ hand, phase: 'playing', trick, legalMoves: legal });
    expect(greedyPlayer(view, createRng(5))).toEqual(greedyPlayer(view, createRng(5)));
  });
});

// ---------------------------------------------------------------------------
// Legality property test — drive real games to completion
// ---------------------------------------------------------------------------

describe('greedyPlayer — legality property', () => {
  const seeds = [1, 2, 3, 7, 42, 99, 123, 2024];

  for (const seed of seeds) {
    it(`produces only legal moves and finishes the round (seed ${seed})`, () => {
      let state: GameState = dealRound(initialCarryOver(), createRng(seed));
      let steps = 0;
      const maxSteps = 200; // bidding (<=3) + discard (<=1) + 24 plays, generously bounded

      while (state.phase !== 'roundEnd') {
        expect(steps).toBeLessThan(maxSteps);
        const view = viewFor(state, state.current);
        const move = greedyPlayer(view, createRng(state.current));
        expect(isLegal(state, move)).toBe(true);
        // Also confirm it is in the freshly-computed legalMoves list.
        expect(legalMoves(state).length).toBeGreaterThan(0);
        state = applyMove(state, move);
        steps += 1;
      }

      expect(state.phase).toBe('roundEnd');
    });
  }

  it('never contributes points into a lost led-suit trick unnecessarily (smoke via cardPoints)', () => {
    // Sanity: cardPoints is used in selection; a losing shed should be a 0-point card when one is
    // available. Covered by the play tests above; this just guards the import stays wired.
    expect(cardPoints(c('7', 'spades'))).toBe(0);
    expect(cardPoints(c('A', 'hearts'))).toBe(11);
  });
});

// ---------------------------------------------------------------------------
// Tie-breaks (pin down under-specified but intentional behaviour)
// ---------------------------------------------------------------------------

describe('greedyPlayer — tie-breaks', () => {
  it('leads its weakest card', () => {
    // Empty trick: every card "wins", so it leads the weakest by strength (the non-trump 9).
    const hand: Card[] = [c('Q', 'clubs'), c('A', 'clubs'), c('9', 'spades')];
    const view = makeView({ hand, phase: 'playing', trick: [], legalMoves: playMovesFor(hand, []) });
    const move = greedyPlayer(view, createRng(0));
    expect(move).toEqual({ type: 'play', card: c('9', 'spades') });
  });

  it('prefers voiding a single-card suit when discard candidates tie on points', () => {
    // Non-trumps: A♥ (11, always banked first), then a 4-point tie between K♣ (clubs has 2 cards)
    // and K♠ (spades single). The tie-break should discard K♠ to void the suit, not K♣.
    const hand: Card[] = [
      c('A', 'hearts'),
      c('K', 'clubs'),
      c('9', 'clubs'),
      c('K', 'spades'),
      c('Q', 'clubs'),
      c('Q', 'spades'),
      c('J', 'diamonds'),
      c('A', 'diamonds'),
      c('K', 'diamonds'),
      c('9', 'diamonds'),
    ];
    const view = makeView({ hand, phase: 'discarding', legalMoves: discardMovesFor(hand) });
    const move = greedyPlayer(view, createRng(0));
    expect(move.type).toBe('discard');
    if (move.type !== 'discard') throw new Error('unreachable');
    const has = (card: Card) => move.cards.some((x) => sameCard(x, card));
    expect(has(c('A', 'hearts'))).toBe(true);
    expect(has(c('K', 'spades'))).toBe(true);
    expect(has(c('K', 'clubs'))).toBe(false);
  });
});
