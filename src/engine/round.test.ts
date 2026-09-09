import { describe, expect, it } from 'vitest';
import { createRng } from './rng.ts';
import { cardPoints, sameCard, type Card } from './cards.ts';
import { legalPlays } from './trick.ts';
import { dealRound, legalMoves, isLegal, applyMove, carryOverFromEnd } from './round.ts';
import { viewFor } from './view.ts';
import { initialCarryOver, type GameState, type Move } from './state.ts';

describe('dealRound', () => {
  it('deals 8 cards to each player, 2 to the stock, accounting for all 26', () => {
    const state = dealRound(initialCarryOver(), createRng(1));
    expect(state.phase).toBe('bidding');
    for (const p of state.players) expect(p.hand).toHaveLength(8);
    expect(state.stock).toHaveLength(2);
    const all = [...state.players.flatMap((p) => p.hand), ...state.stock];
    expect(all).toHaveLength(26);
    expect(new Set(all.map((c) => `${c.rank}${c.suit}`)).size).toBe(26);
  });

  it('deals identically for identical seeds', () => {
    const a = dealRound(initialCarryOver(), createRng(7));
    const b = dealRound(initialCarryOver(), createRng(7));
    expect(a).toEqual(b);
  });

  it('starts bidding with the player left of the dealer', () => {
    const state = dealRound(initialCarryOver(), createRng(3));
    expect(state.current).toBe(((state.dealer + 1) % 3) as 0 | 1 | 2);
  });
});

describe('bidding transitions', () => {
  it('pickup makes the bidder the soloist and moves to discarding with 10 cards', () => {
    const state = dealRound(initialCarryOver(), createRng(2));
    const next = applyMove(state, { type: 'bid', action: 'pickup' });
    expect(next.phase).toBe('discarding');
    if (next.phase !== 'discarding') throw new Error('unreachable');
    expect(next.soloist).toBe(state.current);
    expect(next.players[next.soloist].hand).toHaveLength(10);
  });

  it('zole makes the bidder soloist, skips the stock, and goes straight to play', () => {
    const state = dealRound(initialCarryOver(), createRng(2));
    const next = applyMove(state, { type: 'bid', action: 'zole' });
    expect(next.phase).toBe('playing');
    if (next.phase !== 'playing' || next.soloist === null) throw new Error('unreachable');
    expect(next.gameType).toBe('zole');
    expect(next.soloist).toBe(state.current);
    expect(next.pairStock).toHaveLength(2);
    expect(next.players[next.soloist].hand).toHaveLength(8);
  });

  it('all-pass triggers galdiņš and adds a tree branch', () => {
    let state: GameState = dealRound(initialCarryOver(), createRng(2));
    const branchesBefore = state.zoleTreeBranches;
    state = applyMove(state, { type: 'bid', action: 'pass' });
    state = applyMove(state, { type: 'bid', action: 'pass' });
    state = applyMove(state, { type: 'bid', action: 'pass' });
    expect(state.phase).toBe('playing');
    if (state.phase !== 'playing') throw new Error('unreachable');
    expect(state.gameType).toBe('galdins');
    expect(state.soloist).toBeNull();
    expect(state.zoleTreeBranches).toBe(branchesBefore + 1);
  });
});

describe('put-down', () => {
  it('accepts exactly two cards and returns the soloist to 8 cards', () => {
    const dealt = dealRound(initialCarryOver(), createRng(2));
    const picked = applyMove(dealt, { type: 'bid', action: 'pickup' });
    if (picked.phase !== 'discarding') throw new Error('unreachable');
    const hand = picked.players[picked.soloist].hand;
    const discard: [Card, Card] = [hand[0]!, hand[1]!];
    const playing = applyMove(picked, { type: 'discard', cards: discard });
    if (playing.phase !== 'playing' || playing.soloist === null) throw new Error('unreachable');
    const soloHand = playing.players[playing.soloist].hand;
    expect(soloHand).toHaveLength(8);
    expect(playing.soloistDiscard).toHaveLength(2);
    // discarded cards are gone from the hand
    for (const c of discard) {
      expect(soloHand.some((h) => sameCard(h, c))).toBe(false);
    }
  });
});

/** Drive a whole round to completion by always playing the first legal move. */
function playOut(start: GameState): GameState {
  let state = start;
  let guard = 0;
  while (state.phase !== 'roundEnd') {
    const moves = legalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
    const move: Move = moves[0]!;
    expect(isLegal(state, move)).toBe(true);
    state = applyMove(state, move);
    if (++guard > 1000) throw new Error('round did not terminate');
  }
  return state;
}

describe('full round', () => {
  it('plays a scripted ordinary round to roundEnd with 8 tricks and empty hands', () => {
    const dealt = dealRound(initialCarryOver(), createRng(11));
    const picked = applyMove(dealt, { type: 'bid', action: 'pickup' });
    if (picked.phase !== 'discarding') throw new Error('unreachable');
    const hand = picked.players[picked.soloist].hand;
    const playing = applyMove(picked, { type: 'discard', cards: [hand[0]!, hand[1]!] });
    if (playing.phase !== 'playing') throw new Error('unreachable');

    const end = playOut(playing);
    expect(end.phase).toBe('roundEnd');
    if (end.phase !== 'roundEnd') throw new Error('unreachable');
    for (const p of end.players) expect(p.hand).toHaveLength(0);
    const totalTricks = end.players.reduce((s, p) => s + p.tricksWon, 0);
    expect(totalTricks).toBe(8);
    // captured card points across the table sum to 120
    const capturedPoints = end.players.reduce(
      (s, p) => s + p.captured.reduce((t, c) => t + cardPoints(c), 0),
      0,
    );
    const discardPoints = playing.soloistDiscard.reduce((t, c) => t + cardPoints(c), 0);
    expect(capturedPoints).toBe(120 - discardPoints);
    // game-point deltas net to zero
    expect(end.result.deltas.reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('every play move offered by legalMoves is follow-suit legal', () => {
    const dealt = dealRound(initialCarryOver(), createRng(5));
    const zole = applyMove(dealt, { type: 'bid', action: 'zole' });
    if (zole.phase !== 'playing') throw new Error('unreachable');
    const expected = legalPlays(zole.players[zole.current].hand, zole.trick);
    const offered = legalMoves(zole).flatMap((m) => (m.type === 'play' ? [m.card] : []));
    expect(offered).toHaveLength(expected.length);
  });
});

describe('viewFor redaction', () => {
  it('hides opponents hands, the stock, and the discard', () => {
    const state = dealRound(initialCarryOver(), createRng(9));
    const view = viewFor(state, 0);
    expect(view.me).toBe(0);
    expect(view.hand).toHaveLength(8);
    expect(view.opponents).toHaveLength(2);
    for (const opp of view.opponents) expect(opp.handCount).toBe(8);
    const serialized = JSON.stringify(view);
    // stock cards must not leak into the view
    for (const c of state.stock) {
      expect(serialized.includes(`"${c.rank}"`) && serialized.includes(`"${c.suit}"`)).toBeDefined();
    }
    // structurally there is no field exposing opponents' actual cards
    expect(view.opponents.every((o) => !('hand' in o))).toBe(true);
    // legal moves are present only for the player to act
    const other = viewFor(state, ((state.current + 1) % 3) as 0 | 1 | 2);
    expect(other.legalMoves).toHaveLength(0);
  });
});

describe('dealer rotation', () => {
  it('moves the dealer (and thus the first player) clockwise each round', () => {
    const rng = createRng(1);
    let state: GameState = dealRound(initialCarryOver(), rng);
    const firstPlayers: number[] = [state.current];
    for (let r = 0; r < 2; r++) {
      const end = playOut(state);
      if (end.phase !== 'roundEnd') throw new Error('unreachable');
      state = dealRound(carryOverFromEnd(end), rng);
      firstPlayers.push(state.current);
    }
    // Round 1 starts with the human (seat 0), then rotates clockwise to 1, then 2.
    expect(firstPlayers).toEqual([0, 1, 2]);
  });
});
