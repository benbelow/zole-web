/**
 * End-to-end simulation (design D7): drive many full Zole rounds with three GreedyPlayers under
 * fixed seeds and assert the engine's invariants every round. Exercises the whole engine + AI stack.
 */
import { describe, expect, it } from 'vitest';
import {
  applyMove,
  carryOverFromEnd,
  createRng,
  dealRound,
  initialCarryOver,
  isLegal,
  viewFor,
  type GameState,
  type RoundCarryOver,
  type RoundEndState,
} from '../engine/index.ts';
import { greedyPlayer } from './index.ts';

/** Play one round to completion with three GreedyPlayers, checking legality at each step. */
function playRound(start: GameState): RoundEndState {
  let state = start;
  let steps = 0;
  while (state.phase !== 'roundEnd') {
    const view = viewFor(state, state.current);
    // The acting player always sees a non-empty legal-move set.
    expect(view.legalMoves.length).toBeGreaterThan(0);
    const move = greedyPlayer(view, createRng(state.current + state.roundNumber));
    // The AI never proposes an illegal move.
    expect(isLegal(state, move)).toBe(true);
    state = applyMove(state, move);
    if (++steps > 200) throw new Error('round failed to terminate');
  }
  return state;
}

describe('greedy self-play simulation', () => {
  it('holds the engine invariants across many single rounds', () => {
    for (let seed = 0; seed < 60; seed++) {
      const dealt = dealRound(initialCarryOver(), createRng(seed));
      const end = playRound(dealt);

      // Exactly 8 tricks, every hand emptied.
      const tricks = end.players.reduce((s, p) => s + p.tricksWon, 0);
      expect(tricks).toBe(8);
      for (const p of end.players) expect(p.hand).toHaveLength(0);

      // All 24 played cards were collected into tricks.
      const captured = end.players.reduce((s, p) => s + p.captured.length, 0);
      expect(captured).toBe(24);

      // Game-point deltas net to zero (it is a zero-sum settlement).
      expect(end.result.deltas.reduce((a, b) => a + b, 0)).toBe(0);
      const totalPoints = end.players.reduce((s, p) => s + p.gamePoints, 0);
      expect(totalPoints).toBe(0);
    }
  });

  it('keeps cumulative game points zero-sum across a multi-round game', () => {
    let carry: RoundCarryOver = initialCarryOver();
    const rng = createRng(12345);
    for (let round = 0; round < 25; round++) {
      const dealt = dealRound(carry, rng);
      const end = playRound(dealt);
      const total = end.players.reduce((s, p) => s + p.gamePoints, 0);
      expect(total).toBe(0); // zero-sum is preserved as scores accumulate
      carry = carryOverFromEnd(end);
    }
    // The dealer rotated once per round and the round counter advanced.
    expect(carry.roundNumber).toBe(25);
  });
});
