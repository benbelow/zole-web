import { describe, expect, it } from 'vitest';
import {
  applyMove,
  isLegal,
  legalMoves,
  viewFor,
  type GameState,
  type Move,
} from '../../engine/index.ts';
import { greedyPlayer } from '../../ai/index.ts';
import {
  HUMAN,
  isAiTurn,
  isHumanTurn,
  newGame,
  nextRound,
  stepAi,
} from './driver.ts';

/** Drive a real game to round end, returning the final state and the rng. */
function playToRoundEnd(seed: number): { state: GameState; rng: ReturnType<typeof newGame>['rng'] } {
  const { rng } = newGame(seed);
  let { state } = newGame(seed);
  let guard = 0;
  while (state.phase !== 'roundEnd') {
    if (guard++ > 500) throw new Error('did not reach round end');
    if (isHumanTurn(state)) {
      // Human plays the first legal move too (keeps this pure/deterministic).
      const move = legalMoves(state)[0]!;
      state = applyMove(state, move);
    } else {
      state = stepAi(state, rng);
    }
  }
  return { state, rng };
}

describe('newGame', () => {
  it('returns a bidding state with the human to act and a defined rng', () => {
    const { state, rng } = newGame(42);
    expect(state.phase).toBe('bidding');
    expect(state.current).toBe(HUMAN);
    expect(isHumanTurn(state)).toBe(true);
    expect(rng).toBeDefined();
  });
});

describe('isHumanTurn / isAiTurn', () => {
  it('agree with state.current during active play', () => {
    const { state, rng } = newGame(7);
    expect(isHumanTurn(state)).toBe(state.current === HUMAN);
    expect(isAiTurn(state)).toBe(state.current !== HUMAN);
    expect(isHumanTurn(state)).not.toBe(isAiTurn(state));

    // Move to an AI seat by having the human pass.
    const afterPass = applyMove(state, { type: 'bid', action: 'pass' });
    expect(afterPass.phase).toBe('bidding');
    expect(afterPass.current).not.toBe(HUMAN);
    expect(isAiTurn(afterPass)).toBe(true);
    expect(isHumanTurn(afterPass)).toBe(false);

    // sanity: rng still usable
    expect(rng).toBeDefined();
  });

  it('are both false at roundEnd', () => {
    const { state } = playToRoundEnd(1);
    expect(state.phase).toBe('roundEnd');
    expect(isHumanTurn(state)).toBe(false);
    expect(isAiTurn(state)).toBe(false);
  });
});

describe('stepAi', () => {
  it('applies a legal move on an AI-turn state', () => {
    const { state, rng } = newGame(7);
    // Human passes → seat 1 (AI) to act.
    const aiState = applyMove(state, { type: 'bid', action: 'pass' });
    expect(isAiTurn(aiState)).toBe(true);

    // The move stepAi would apply is the greedy move for the current view; it is legal.
    const view = viewFor(aiState, aiState.current);
    const move: Move = greedyPlayer(view, rng);
    expect(isLegal(aiState, move)).toBe(true);

    const next = stepAi(aiState, rng);
    expect(next).not.toBe(aiState);
    // The state advanced: either a different current seat, more passes, or a phase change.
    const changed =
      next.phase !== aiState.phase ||
      next.current !== aiState.current ||
      JSON.stringify(next) !== JSON.stringify(aiState);
    expect(changed).toBe(true);
  });

  it('progresses the game across several AI-driven steps', () => {
    const { rng } = newGame(7);
    let { state } = newGame(7);
    // Human passes so AIs take over the bidding.
    state = applyMove(state, { type: 'bid', action: 'pass' });

    let steps = 0;
    while (isAiTurn(state) && state.phase === 'bidding' && steps < 10) {
      const before = state;
      state = stepAi(state, rng);
      expect(state).not.toBe(before);
      steps++;
    }
    // Bidding must have advanced beyond where we started (either resolved or reached the human).
    expect(state.phase === 'bidding' && state.current === HUMAN ? true : state.phase !== 'bidding').toBe(
      true,
    );
    expect(steps).toBeGreaterThan(0);
  });
});

describe('nextRound', () => {
  it('throws if the passed state is not roundEnd', () => {
    const { state, rng } = newGame(3);
    expect(state.phase).not.toBe('roundEnd');
    expect(() => nextRound(state, rng)).toThrow();
  });

  it('deals a fresh bidding round from a finished round', () => {
    const { state, rng } = playToRoundEnd(1);
    const dealt = nextRound(state, rng);
    expect(dealt.phase).toBe('bidding');
  });
});
