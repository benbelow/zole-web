/**
 * The "random" Zole AI: picks a uniformly random move from the enumerated legal moves.
 *
 * Depends on `engine` only and stays pure — randomness enters exclusively through the injected
 * RNG. The engine already enumerates every legal move for the current phase (legal bids, all
 * discard pairs, all legal plays), so a uniform pick over `view.legalMoves` is always a valid
 * bid / discard / play. The returned move is guaranteed to be present in `view.legalMoves`.
 */
import type { Move, PlayerView, Rng } from '../engine/index.ts';
import type { Strategy } from './strategy.ts';

/** Pick a uniformly random legal move using the injected RNG. */
export const randomPlayer: Strategy = (view: PlayerView, rng: Rng): Move => {
  const { legalMoves } = view;
  if (legalMoves.length === 0) {
    throw new Error(`randomPlayer: no legal move available in phase "${view.phase}"`);
  }
  // `noUncheckedIndexedAccess` types this as `Move | undefined`; the length guard above plus a
  // valid `nextInt` (index in [0, length)) make it always defined, but we assert it explicitly.
  const move: Move | undefined = legalMoves[rng.nextInt(legalMoves.length)];
  if (move === undefined) {
    throw new Error('randomPlayer: rng produced an out-of-range index');
  }
  return move;
};
