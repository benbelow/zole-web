/**
 * The Zole round state machine (design D1): dealing, legal-move enumeration, and the single
 * `applyMove` reducer that advances bidding → discarding → playing → roundEnd.
 *
 * Pure: every transition returns new immutable state and never mutates its input. Randomness only
 * enters through `dealRound`'s injected RNG.
 */

import { createDeck, sameCard, type Card } from './cards.ts';
import type { Rng } from './rng.ts';
import { shuffle } from './rng.ts';
import { legalPlays, trickWinner } from './trick.ts';
import { scoreRound } from './scoring.ts';
import type {
  BiddingState,
  DiscardingState,
  GameState,
  Move,
  PlayerId,
  PlayerState,
  PlayingState,
  RoundCarryOver,
  RoundEndState,
} from './state.ts';

type Players = readonly [PlayerState, PlayerState, PlayerState];

const PLAYER_IDS: readonly PlayerId[] = [0, 1, 2];

function leftOf(id: PlayerId): PlayerId {
  return ((id + 1) % 3) as PlayerId;
}

function withPlayer(players: Players, id: PlayerId, patch: Partial<PlayerState>): Players {
  const next = players.map((p, i) => (i === id ? { ...p, ...patch } : p));
  return next as unknown as Players;
}

// ---------------------------------------------------------------------------
// Deal
// ---------------------------------------------------------------------------

/** Shuffle and deal a new round from what carried over from the previous one (rules §3). */
export function dealRound(carry: RoundCarryOver, rng: Rng): BiddingState {
  const deck = shuffle(createDeck(), rng);
  const dealer = carry.dealer;
  const firstBidder = leftOf(dealer);

  const hands: Card[][] = [deck.slice(0, 8), deck.slice(8, 16), deck.slice(16, 24)];
  const stockCards = deck.slice(24, 26);
  if (stockCards.length !== 2) throw new Error('deal: stock must be exactly 2 cards');
  const stock: readonly [Card, Card] = [stockCards[0]!, stockCards[1]!];

  const players = PLAYER_IDS.map(
    (i): PlayerState => ({
      hand: hands[i] ?? [],
      captured: [],
      tricksWon: 0,
      gamePoints: carry.gamePoints[i] ?? 0,
    }),
  ) as unknown as Players;

  return {
    phase: 'bidding',
    players,
    dealer,
    current: firstBidder,
    zoleTreeBranches: carry.zoleTreeBranches,
    roundNumber: carry.roundNumber,
    stock,
    passed: [],
  };
}

/** Build the carry-over for the next round from a finished round (rotates the dealer left). */
export function carryOverFromEnd(state: RoundEndState): RoundCarryOver {
  return {
    gamePoints: [
      state.players[0].gamePoints,
      state.players[1].gamePoints,
      state.players[2].gamePoints,
    ],
    dealer: leftOf(state.dealer),
    zoleTreeBranches: state.zoleTreeBranches,
    roundNumber: state.roundNumber + 1,
  };
}

// ---------------------------------------------------------------------------
// Legal moves
// ---------------------------------------------------------------------------

/** All discard pairs (unordered) available from a 10-card holding. */
function discardMoves(hand: readonly Card[]): Move[] {
  const moves: Move[] = [];
  for (let i = 0; i < hand.length; i++) {
    for (let j = i + 1; j < hand.length; j++) {
      const a = hand[i];
      const b = hand[j];
      if (a && b) moves.push({ type: 'discard', cards: [a, b] });
    }
  }
  return moves;
}

/** The moves that are legal for the player whose turn it is. Empty at `roundEnd`. */
export function legalMoves(state: GameState): Move[] {
  switch (state.phase) {
    case 'bidding':
      return [
        { type: 'bid', action: 'pickup' },
        { type: 'bid', action: 'zole' },
        { type: 'bid', action: 'pass' },
      ];
    case 'discarding':
      return discardMoves(state.players[state.soloist].hand);
    case 'playing': {
      const hand = state.players[state.current].hand;
      return legalPlays(hand, state.trick).map((card) => ({ type: 'play', card }));
    }
    case 'roundEnd':
      return [];
  }
}

function sameDiscard(a: readonly [Card, Card], b: readonly [Card, Card]): boolean {
  return (
    (sameCard(a[0], b[0]) && sameCard(a[1], b[1])) ||
    (sameCard(a[0], b[1]) && sameCard(a[1], b[0]))
  );
}

/** True when `move` is among `legalMoves(state)`. */
export function isLegal(state: GameState, move: Move): boolean {
  return legalMoves(state).some((legal) => {
    if (legal.type !== move.type) return false;
    if (legal.type === 'bid' && move.type === 'bid') return legal.action === move.action;
    if (legal.type === 'discard' && move.type === 'discard')
      return sameDiscard(legal.cards, move.cards);
    if (legal.type === 'play' && move.type === 'play') return sameCard(legal.card, move.card);
    return false;
  });
}

// ---------------------------------------------------------------------------
// applyMove
// ---------------------------------------------------------------------------

/** The single state transition. Throws on an illegal move — consult `legalMoves`/`isLegal` first. */
export function applyMove(state: GameState, move: Move): GameState {
  if (!isLegal(state, move)) {
    throw new Error(`Illegal move ${JSON.stringify(move)} in phase "${state.phase}"`);
  }
  switch (state.phase) {
    case 'bidding':
      if (move.type !== 'bid') throw new Error('expected a bid');
      return applyBid(state, move.action);
    case 'discarding':
      if (move.type !== 'discard') throw new Error('expected a discard');
      return applyDiscard(state, move.cards);
    case 'playing':
      if (move.type !== 'play') throw new Error('expected a play');
      return applyPlay(state, move.card);
    case 'roundEnd':
      throw new Error('the round has ended; deal a new round');
  }
}

function applyBid(state: BiddingState, action: 'pickup' | 'zole' | 'pass'): GameState {
  const soloist = state.current;
  const trickLeader = leftOf(state.dealer);

  if (action === 'pickup') {
    // Soloist takes the 2 stock cards; must then discard 2 (put-down phase).
    const hand = [...state.players[soloist].hand, state.stock[0], state.stock[1]];
    const next: DiscardingState = {
      phase: 'discarding',
      gameType: 'ordinary',
      players: withPlayer(state.players, soloist, { hand }),
      dealer: state.dealer,
      current: soloist,
      zoleTreeBranches: state.zoleTreeBranches,
      roundNumber: state.roundNumber,
      soloist,
    };
    return next;
  }

  if (action === 'zole') {
    // Soloist does NOT take the stock; the 2 stock cards count for the pair. Straight to play.
    const next: PlayingState = {
      phase: 'playing',
      gameType: 'zole',
      players: state.players,
      dealer: state.dealer,
      current: trickLeader,
      zoleTreeBranches: state.zoleTreeBranches,
      roundNumber: state.roundNumber,
      soloist,
      trickLeader,
      trick: [],
      soloistDiscard: [],
      pairStock: [state.stock[0], state.stock[1]],
    };
    return next;
  }

  // pass
  const passed = [...state.passed, state.current];
  if (passed.length === 3) {
    // Everyone passed → galdiņš. Add a branch to the zole tree; no soloist.
    const next: PlayingState = {
      phase: 'playing',
      gameType: 'galdins',
      players: state.players,
      dealer: state.dealer,
      current: trickLeader,
      zoleTreeBranches: state.zoleTreeBranches + 1,
      roundNumber: state.roundNumber,
      soloist: null,
      trickLeader,
      trick: [],
      soloistDiscard: [],
      pairStock: [],
    };
    return next;
  }
  return { ...state, current: leftOf(state.current), passed };
}

function applyDiscard(state: DiscardingState, cards: readonly [Card, Card]): PlayingState {
  const soloist = state.soloist;
  const hand = state.players[soloist].hand.filter(
    (c) => !sameCard(c, cards[0]) && !sameCard(c, cards[1]),
  );
  const trickLeader = leftOf(state.dealer);
  return {
    phase: 'playing',
    gameType: 'ordinary',
    players: withPlayer(state.players, soloist, { hand }),
    dealer: state.dealer,
    current: trickLeader,
    zoleTreeBranches: state.zoleTreeBranches,
    roundNumber: state.roundNumber,
    soloist,
    trickLeader,
    trick: [],
    soloistDiscard: [cards[0], cards[1]],
    pairStock: [],
  };
}

function applyPlay(state: PlayingState, card: Card): GameState {
  const player = state.current;
  const hand = state.players[player].hand.filter((c) => !sameCard(c, card));
  const players = withPlayer(state.players, player, { hand });
  const trick = [...state.trick, { by: player, card }];

  if (trick.length < 3) {
    // Trick still filling; next player in seat order acts.
    return { ...state, players, trick, current: leftOf(player) };
  }

  // Trick complete: resolve the winner, who collects the cards and leads next.
  const winner = trickWinner(trick);
  const wonCards = trick.map((t) => t.card);
  const withWin = withPlayer(players, winner, {
    captured: [...players[winner].captured, ...wonCards],
    tricksWon: players[winner].tricksWon + 1,
  });

  const roundOver = withWin.every((p) => p.hand.length === 0);
  const afterTrick: PlayingState = {
    ...state,
    players: withWin,
    trick: [],
    trickLeader: winner,
    current: winner,
  };

  if (!roundOver) return afterTrick;

  // All 8 tricks played: score the round and settle game points.
  const result = scoreRound(afterTrick);
  const settled = afterTrick.players.map((p, i) => ({
    ...p,
    gamePoints: p.gamePoints + result.deltas[i]!,
  })) as unknown as Players;

  const end: RoundEndState = {
    phase: 'roundEnd',
    players: settled,
    dealer: state.dealer,
    current: state.current,
    zoleTreeBranches: result.treeBranchesAfter,
    roundNumber: state.roundNumber,
    result,
  };
  return end;
}
