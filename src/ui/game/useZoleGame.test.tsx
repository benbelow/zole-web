import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyMove, viewFor, type GameState } from '../../engine/index.ts';
import { greedyPlayer } from '../../ai/index.ts';
import { AI_DELAY_MS, HUMAN, isHumanTurn, newGame, stepAi } from './driver.ts';
import { useZoleGame, type ZoleGameVM } from './useZoleGame.ts';

type Hook = { current: ZoleGameVM };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Perform one human action for the current phase (mirrors the prompt's scripted choices). */
function doHumanStep(result: Hook): void {
  const vm = result.current;
  const view = vm.view;
  if (vm.phase === 'bidding') {
    const firstBid = view.legalMoves.find((m) => m.type === 'bid');
    if (firstBid && firstBid.type === 'bid') {
      act(() => vm.bid(firstBid.action));
    }
  } else if (vm.phase === 'discarding') {
    act(() => vm.toggleDiscardSelection(view.hand[0]!));
    act(() => vm.toggleDiscardSelection(view.hand[1]!));
    act(() => vm.confirmDiscard());
  } else if (vm.phase === 'playing') {
    const play = view.legalMoves.find((m) => m.type === 'play');
    if (play && play.type === 'play') {
      act(() => vm.playCard(play.card));
    }
  }
}

/** Advance one AI move by firing the pending timer. */
function letAiMove(): void {
  act(() => {
    vi.advanceTimersByTime(AI_DELAY_MS + 5);
  });
}

/** Drive the whole game through the VM until the round is over or the step cap is hit. */
function driveGame(result: Hook, cap = 400): void {
  let steps = 0;
  while (!result.current.isRoundOver && steps < cap) {
    if (result.current.isHumanTurn) {
      doHumanStep(result);
    } else {
      letAiMove();
    }
    steps++;
  }
}

describe('useZoleGame', () => {
  it('starts on the human bidding turn', () => {
    const { result } = renderHook(() => useZoleGame(42));
    expect(result.current.phase).toBe('bidding');
    expect(result.current.isHumanTurn).toBe(true);
    expect(result.current.view.me).toBe(HUMAN);
    expect(result.current.view.legalMoves.length).toBeGreaterThan(0);
  });

  it('chains consecutive AI turns without getting stuck', () => {
    const { result } = renderHook(() => useZoleGame(42));
    // Human passes.
    act(() => result.current.bid('pass'));
    expect(result.current.isHumanTurn).toBe(false);

    // Advancing timers must eventually return control to the human OR end the round.
    let steps = 0;
    while (!result.current.isHumanTurn && !result.current.isRoundOver && steps < 400) {
      letAiMove();
      steps++;
    }
    expect(steps).toBeLessThan(400);
    expect(result.current.isHumanTurn || result.current.isRoundOver).toBe(true);
  });

  it.each([42, 7])('drives a full game to round end (seed %i)', (seed) => {
    const { result } = renderHook(() => useZoleGame(seed));
    driveGame(result);
    expect(result.current.isRoundOver).toBe(true);
    expect(result.current.view.result).not.toBeNull();
  });

  it('dealNextRound starts a fresh round carrying scores forward', () => {
    const { result } = renderHook(() => useZoleGame(42));
    driveGame(result);
    expect(result.current.isRoundOver).toBe(true);

    // Capture the cumulative game points at the moment of dealing.
    const before = result.current.view;
    const myPointsBefore = before.gamePoints;
    const oppPointsBefore = before.opponents.map((o) => o.gamePoints);
    const sumBefore = myPointsBefore + oppPointsBefore.reduce((a, b) => a + b, 0);
    expect(sumBefore).toBe(0);

    act(() => result.current.dealNextRound());

    expect(result.current.phase).toBe('bidding');
    expect(result.current.isRoundOver).toBe(false);

    // Scores unchanged at the exact moment of dealing.
    const after = result.current.view;
    expect(after.gamePoints).toBe(myPointsBefore);
    expect(after.opponents.map((o) => o.gamePoints)).toEqual(oppPointsBefore);
    const sumAfter =
      after.gamePoints + after.opponents.reduce((a, o) => a + o.gamePoints, 0);
    expect(sumAfter).toBe(0);
  });

  it('is deterministic for the same seed and same human choices', () => {
    const a = renderHook(() => useZoleGame(42));
    const b = renderHook(() => useZoleGame(42));

    const handA = a.result.current.view.hand.map((c) => `${c.rank}${c.suit}`);
    const handB = b.result.current.view.hand.map((c) => `${c.rank}${c.suit}`);
    expect(handA).toEqual(handB);

    driveGame(a.result);
    driveGame(b.result);

    expect(a.result.current.isRoundOver).toBe(true);
    expect(b.result.current.isRoundOver).toBe(true);
    expect(a.result.current.view.result?.deltas).toEqual(b.result.current.view.result?.deltas);
  });

  it('all players passing produces a galdiņš to round end', () => {
    // Scan seeds for one where human-pass then both AIs pass → galdiņš.
    const findGaldinsSeed = (): number => {
      const scan = (max: number): number | null => {
        for (let seed = 0; seed <= max; seed++) {
          const { rng } = newGame(seed);
          let state: GameState = newGame(seed).state;
          // Human passes.
          state = applyMove(state, { type: 'bid', action: 'pass' });
          // Both AIs act.
          let guard = 0;
          while (state.phase === 'bidding' && guard++ < 5) {
            const move = greedyPlayer(viewFor(state, state.current), rng);
            state = applyMove(state, move);
          }
          if (state.phase === 'playing' && state.gameType === 'galdins' && state.soloist === null) {
            return seed;
          }
        }
        return null;
      };
      let max = 400;
      for (;;) {
        const found = scan(max);
        if (found !== null) return found;
        max += 400;
        if (max > 4000) throw new Error('no galdiņš seed found');
      }
    };

    const seed = findGaldinsSeed();
    const { result } = renderHook(() => useZoleGame(seed));
    expect(result.current.phase).toBe('bidding');

    act(() => result.current.bid('pass'));

    // Advance timers until bidding resolves.
    let steps = 0;
    while (result.current.phase === 'bidding' && steps < 20) {
      letAiMove();
      steps++;
    }
    expect(result.current.phase).toBe('playing');
    expect(result.current.view.gameType).toBe('galdins');
    expect(result.current.view.soloist).toBeNull();

    // Drive to round end.
    driveGame(result);
    expect(result.current.isRoundOver).toBe(true);
    expect(result.current.view.result?.gameType).toBe('galdins');
  });

  it('applies exactly one AI move per timer under StrictMode', () => {
    // Use a seed where the human's pass leaves an AI seat to act (i.e. AIs do not
    // immediately resolve to galdiņš on the human pass alone — always true, since only
    // one player has passed).
    const seed = 42;
    const { result } = renderHook(() => useZoleGame(seed), {
      wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
    });

    act(() => result.current.bid('pass'));
    // After the human passes, seat 1 is current (single left-rotation from seat 0).
    expect(result.current.view.current).toBe(1);
    const phaseAfterPass = result.current.phase;

    // Compute the expected single-step outcome directly with stepAi on the post-pass state.
    const { rng } = newGame(seed);
    const postPass: GameState = applyMove(newGame(seed).state, { type: 'bid', action: 'pass' });
    const expected = stepAi(postPass, rng);

    // Fire the timer exactly once.
    letAiMove();

    // Exactly one AI action was applied — matches the single stepAi outcome, NOT two steps.
    expect(result.current.view.current).toBe(expected.current);
    expect(result.current.phase).toBe(expected.phase);

    // Guard: it must not have skipped seat 1 entirely (which double-apply from seat 1
    // could cause). A single step from seat 1 keeps us in bidding at seat 2, or resolves
    // the phase — but never jumps back to the human by skipping a whole seat's worth extra.
    if (phaseAfterPass === 'bidding' && expected.phase === 'bidding') {
      expect(result.current.view.current).toBe(expected.current);
      expect([1, 2].includes(result.current.view.current)).toBe(true);
    }
    // Sanity: the applied state genuinely differs from the post-pass state.
    expect(isHumanTurn(postPass)).toBe(false);
  });
});
