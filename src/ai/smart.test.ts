/**
 * Tests for the "smart" Zole AI (`smartPlayer`). Covers legality across full driven games,
 * determinism, galdiņš trick-ducking, and pair cooperation (never overtaking a winning partner).
 */
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
  wouldWin,
  type Card,
  type GameState,
  type GameType,
  type Move,
  type Phase,
  type PlayerId,
  type PlayerView,
  type TrickCard,
} from '../engine/index.ts';
import { smartPlayer } from './smart.ts';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

interface ViewOverrides {
  hand: readonly Card[];
  phase: Phase;
  me?: PlayerId;
  current?: PlayerId;
  trick?: readonly TrickCard[];
  legalMoves: readonly Move[];
  gameType?: GameType | null;
  soloist?: PlayerId | null;
  trickLeader?: PlayerId | null;
}

function makeView(o: ViewOverrides): PlayerView {
  const me = o.me ?? 0;
  return {
    me,
    phase: o.phase,
    hand: o.hand,
    gamePoints: 0,
    zoleTreeBranches: 0,
    dealer: 2,
    current: o.current ?? me,
    gameType: o.gameType ?? null,
    soloist: o.soloist ?? null,
    trick: o.trick ?? [],
    trickLeader: o.trickLeader ?? null,
    passed: [],
    opponents: [],
    legalMoves: o.legalMoves,
    result: null,
  };
}

function playMovesFor(hand: readonly Card[], trick: readonly TrickCard[]): Move[] {
  return legalPlays(hand, trick).map((card) => ({ type: 'play', card }));
}

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

const BID_MOVES: readonly Move[] = [
  { type: 'bid', action: 'pickup' },
  { type: 'bid', action: 'zole' },
  { type: 'bid', action: 'pass' },
];

// ---------------------------------------------------------------------------
// Bidding
// ---------------------------------------------------------------------------

describe('smartPlayer — bidding', () => {
  it('calls zole when trumps + singleAces === 8', () => {
    const hand: Card[] = [
      c('Q', 'diamonds'),
      c('J', 'diamonds'),
      c('A', 'diamonds'),
      c('10', 'diamonds'),
      c('K', 'diamonds'),
      c('9', 'diamonds'), // 6 trumps
      c('A', 'hearts'), // single ace
      c('A', 'spades'), // single ace
    ];
    const view = makeView({ hand, phase: 'bidding', legalMoves: BID_MOVES });
    expect(smartPlayer(view, createRng(1))).toEqual({ type: 'bid', action: 'zole' });
  });

  it('picks up with 6 trumps', () => {
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
    expect(hand.filter(isTrump)).toHaveLength(6);
    const view = makeView({ hand, phase: 'bidding', legalMoves: BID_MOVES });
    expect(smartPlayer(view, createRng(1))).toEqual({ type: 'bid', action: 'pickup' });
  });

  it('passes with a weak hand', () => {
    const hand: Card[] = [
      c('J', 'diamonds'),
      c('7', 'diamonds'),
      c('7', 'clubs'),
      c('8', 'clubs'),
      c('9', 'clubs'),
      c('7', 'spades'),
      c('8', 'spades'),
      c('9', 'spades'),
    ];
    expect(hand.filter(isTrump)).toHaveLength(2);
    const view = makeView({ hand, phase: 'bidding', legalMoves: BID_MOVES });
    expect(smartPlayer(view, createRng(1))).toEqual({ type: 'bid', action: 'pass' });
  });
});

// ---------------------------------------------------------------------------
// Discarding
// ---------------------------------------------------------------------------

describe('smartPlayer — discarding', () => {
  it('returns exactly two of its own non-trump cards and voids a short suit', () => {
    // Non-trumps: A♥ (single, 11pts — protected cash ace), K♠ (single, 4pts), K♣+9♣ (2 clubs).
    // Should void K♠ (short suit) and shed the highest of the 2-card club suit (K♣), keeping the
    // protected single ace.
    const hand: Card[] = [
      c('A', 'hearts'), // single ace → protected
      c('K', 'spades'), // single spade → void it
      c('K', 'clubs'),
      c('9', 'clubs'),
      c('Q', 'clubs'), // trump
      c('Q', 'spades'), // trump
      c('J', 'diamonds'), // trump
      c('A', 'diamonds'), // trump
      c('K', 'diamonds'), // trump
      c('9', 'diamonds'), // trump
    ];
    const view = makeView({ hand, phase: 'discarding', gameType: 'ordinary', legalMoves: [] });
    const move = smartPlayer(view, createRng(1));
    expect(move.type).toBe('discard');
    if (move.type !== 'discard') throw new Error('unreachable');
    expect(move.cards).toHaveLength(2);
    for (const card of move.cards) {
      expect(hand.some((h) => sameCard(h, card))).toBe(true);
      expect(isTrump(card)).toBe(false);
    }
    const has = (card: Card) => move.cards.some((x) => sameCard(x, card));
    expect(has(c('K', 'spades'))).toBe(true); // voided short suit
    expect(has(c('A', 'hearts'))).toBe(false); // protected the cash ace
  });
});

// ---------------------------------------------------------------------------
// Galdiņš — minimise tricks
// ---------------------------------------------------------------------------

describe('smartPlayer — galdiņš play', () => {
  it('leads a low card', () => {
    const hand: Card[] = [c('Q', 'clubs'), c('A', 'clubs'), c('9', 'spades')];
    const view = makeView({
      hand,
      phase: 'playing',
      trick: [],
      legalMoves: playMovesFor(hand, []),
      gameType: 'galdins',
    });
    const move = smartPlayer(view, createRng(1));
    expect(move.type).toBe('play');
    if (move.type !== 'play') throw new Error('unreachable');
    expect(cardPoints(move.card)).toBe(0);
    expect(wouldWin(move.card, [])).toBe(true); // leading always "wins" the empty trick
  });

  it('following: ducks with the highest non-winning card when a non-winner exists', () => {
    // Led 10♣; void in clubs → all legal. Q♦ would WIN; A♥ and K♠ would NOT. Duck with A♥.
    const trick: TrickCard[] = [{ by: 1, card: c('10', 'clubs') }];
    const hand: Card[] = [c('Q', 'diamonds'), c('A', 'hearts'), c('K', 'spades')];
    const legal = playMovesFor(hand, trick);
    expect(legal).toHaveLength(3);
    const view = makeView({
      hand,
      phase: 'playing',
      trick,
      legalMoves: legal,
      gameType: 'galdins',
    });
    const move = smartPlayer(view, createRng(1));
    expect(move.type).toBe('play');
    if (move.type !== 'play') throw new Error('unreachable');
    expect(wouldWin(move.card, trick)).toBe(false); // did NOT take the trick
    expect(move).toEqual({ type: 'play', card: c('A', 'hearts') });
  });

  it('following the led category: ducks below the current winner when able', () => {
    // Led A♣ (non-trump). We hold clubs and must follow: K♣ and 9♣ both lose to A♣, 10♣ loses too.
    // We should NOT win (can't anyway) and shed the highest non-winning club (10♣, 10 pts).
    const trick: TrickCard[] = [{ by: 1, card: c('A', 'clubs') }];
    const hand: Card[] = [c('10', 'clubs'), c('K', 'clubs'), c('9', 'clubs'), c('Q', 'diamonds')];
    const legal = playMovesFor(hand, trick);
    // Must follow clubs → only the 3 clubs are legal.
    expect(legal).toHaveLength(3);
    for (const m of legal) {
      if (m.type === 'play') expect(m.card.suit).toBe('clubs');
    }
    const view = makeView({
      hand,
      phase: 'playing',
      trick,
      legalMoves: legal,
      gameType: 'galdins',
    });
    const move = smartPlayer(view, createRng(1));
    expect(move.type).toBe('play');
    if (move.type !== 'play') throw new Error('unreachable');
    expect(wouldWin(move.card, trick)).toBe(false);
    expect(move).toEqual({ type: 'play', card: c('10', 'clubs') });
  });

  it('following: takes the trick as cheaply as possible only when forced to win', () => {
    // Led 7♠; void in spades, hold only trumps → every legal card wins. Take cheapest: 7♦.
    const trick: TrickCard[] = [{ by: 1, card: c('7', 'spades') }];
    const hand: Card[] = [c('Q', 'clubs'), c('7', 'diamonds'), c('9', 'diamonds')];
    const legal = playMovesFor(hand, trick);
    for (const m of legal) {
      if (m.type === 'play') expect(wouldWin(m.card, trick)).toBe(true);
    }
    const view = makeView({
      hand,
      phase: 'playing',
      trick,
      legalMoves: legal,
      gameType: 'galdins',
    });
    const move = smartPlayer(view, createRng(1));
    expect(move).toEqual({ type: 'play', card: c('7', 'diamonds') });
  });
});

// ---------------------------------------------------------------------------
// Pair cooperation — do not overtake a winning partner
// ---------------------------------------------------------------------------

describe('smartPlayer — pair cooperation', () => {
  it('does not overtake its own partner who is currently winning; dumps points to them', () => {
    // Ordinary game. Soloist is player 2. Partner is player 1. We are player 0 in the pair.
    // Trick led A♣ by soloist(2), partner(1) trumped with Q♣ (now winning). We follow last.
    // We are void in clubs and hold a high-point card (A♥) and a low card (7♠); all cards legal.
    // We must NOT overtake the partner — and since partner is winning we dump the high points.
    const trick: TrickCard[] = [
      { by: 2, card: c('A', 'clubs') }, // soloist led
      { by: 1, card: c('Q', 'clubs') }, // partner trumped → partner winning
    ];
    const hand: Card[] = [c('A', 'hearts'), c('7', 'spades'), c('K', 'diamonds')];
    const legal = playMovesFor(hand, trick);
    // Void in clubs → all three legal.
    expect(legal).toHaveLength(3);
    const view = makeView({
      hand,
      phase: 'playing',
      me: 0,
      current: 0,
      trick,
      legalMoves: legal,
      gameType: 'ordinary',
      soloist: 2,
      trickLeader: 2,
    });
    const move = smartPlayer(view, createRng(1));
    expect(move.type).toBe('play');
    if (move.type !== 'play') throw new Error('unreachable');
    // Must not overtake the partner: whatever we play must NOT win the trick.
    expect(wouldWin(move.card, trick)).toBe(false);
    // Partner is winning → dump the highest-point non-winning card (A♥). K♦ is a trump that would
    // overtake Q♣? No — K♦ (trump str low) loses to Q♣; but A♥ (11pts) is the best dump.
    expect(move).toEqual({ type: 'play', card: c('A', 'hearts') });
  });

  it('takes the trick cheaply when only the soloist is winning', () => {
    // Soloist(2) led and is winning with A♣; partner(1) already played a losing club. We (0) can
    // follow clubs but none beats A♣, OR we can trump. Give us a cheap trump win available.
    // Led A♣ by soloist, partner played 7♣ (losing). We are void in clubs → may trump.
    const trick: TrickCard[] = [
      { by: 2, card: c('A', 'clubs') }, // soloist winning
      { by: 1, card: c('7', 'clubs') }, // partner losing
    ];
    const hand: Card[] = [c('7', 'diamonds'), c('Q', 'clubs'), c('K', 'spades')];
    const legal = playMovesFor(hand, trick);
    // Void in clubs → all legal.
    expect(legal).toHaveLength(3);
    const view = makeView({
      hand,
      phase: 'playing',
      me: 0,
      current: 0,
      trick,
      legalMoves: legal,
      gameType: 'ordinary',
      soloist: 2,
      trickLeader: 2,
    });
    const move = smartPlayer(view, createRng(1));
    expect(move.type).toBe('play');
    if (move.type !== 'play') throw new Error('unreachable');
    // Should take it from the soloist, and do so cheaply (7♦, the weakest winning trump).
    expect(wouldWin(move.card, trick)).toBe(true);
    expect(move).toEqual({ type: 'play', card: c('7', 'diamonds') });
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('smartPlayer — determinism', () => {
  it('same view + same seeded rng → identical move', () => {
    const trick: TrickCard[] = [{ by: 1, card: c('A', 'clubs') }];
    const hand: Card[] = [c('Q', 'clubs'), c('Q', 'diamonds'), c('7', 'spades')];
    const view = makeView({
      hand,
      phase: 'playing',
      trick,
      legalMoves: playMovesFor(hand, trick),
      gameType: 'ordinary',
      soloist: 0,
    });
    expect(smartPlayer(view, createRng(5))).toEqual(smartPlayer(view, createRng(5)));
    // And independent of the RNG seed (heuristic does not consume it).
    expect(smartPlayer(view, createRng(5))).toEqual(smartPlayer(view, createRng(999)));
  });
});

// ---------------------------------------------------------------------------
// Legality property — drive real games to completion
// ---------------------------------------------------------------------------

describe('smartPlayer — legality property', () => {
  const seeds = [1, 2, 3, 7, 42, 99, 123, 2024, 55555];

  for (const seed of seeds) {
    it(`produces only legal moves and finishes the round (seed ${seed})`, () => {
      let state: GameState = dealRound(initialCarryOver(), createRng(seed));
      let steps = 0;
      const maxSteps = 200;

      while (state.phase !== 'roundEnd') {
        expect(steps).toBeLessThan(maxSteps);
        const view = viewFor(state, state.current);
        expect(view.legalMoves.length).toBeGreaterThan(0);
        const move = smartPlayer(view, createRng(state.current + state.roundNumber));
        expect(isLegal(state, move)).toBe(true);
        expect(legalMoves(state).length).toBeGreaterThan(0);
        state = applyMove(state, move);
        steps += 1;
      }

      expect(state.phase).toBe('roundEnd');
    });
  }
});
