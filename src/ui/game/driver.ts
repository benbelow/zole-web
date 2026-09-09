/**
 * Engine/AI orchestration for the UI (design D1). No React here — this module wraps exactly the
 * engine + AI public API the app needs and advances the game one step at a time, so it stays
 * deterministic and unit-testable. Pacing/looping is the hook's job (see `useZoleGame`).
 */
import {
  applyMove,
  carryOverFromEnd,
  createRng,
  dealRound,
  initialCarryOver,
  viewFor,
  type GameState,
  type Move,
  type PlayerId,
  type PlayerView,
  type Rng,
} from '../../engine/index.ts';
import { greedyPlayer } from '../../ai/index.ts';

/** The human always plays seat 0 in v1; the other two seats are AI. */
export const HUMAN: PlayerId = 0;
export const AI_SEATS: readonly PlayerId[] = [1, 2];

/** Delay (ms) before an AI move is applied, so a human can follow the play. */
export const AI_DELAY_MS = 700;

/** Player-facing seat names (from the human's perspective). */
export function seatName(seat: PlayerId): string {
  if (seat === HUMAN) return 'You';
  return seat === 1 ? 'AI West' : 'AI East';
}

/** Start a brand-new game from a seed. */
export function newGame(seed: number): { state: GameState; rng: Rng } {
  const rng = createRng(seed);
  return { state: dealRound(initialCarryOver(), rng), rng };
}

/** Deal the next round, threading carry-over from a finished (roundEnd) round. */
export function nextRound(prev: GameState, rng: Rng): GameState {
  if (prev.phase !== 'roundEnd') {
    throw new Error('nextRound: the current round has not ended');
  }
  return dealRound(carryOverFromEnd(prev), rng);
}

/** The human's redacted view of the current state. */
export function humanView(state: GameState): PlayerView {
  return viewFor(state, HUMAN);
}

export function isHumanTurn(state: GameState): boolean {
  return state.phase !== 'roundEnd' && state.current === HUMAN;
}

export function isAiTurn(state: GameState): boolean {
  return state.phase !== 'roundEnd' && state.current !== HUMAN;
}

/** Apply a human move (the UI only ever offers legal moves). Throws if illegal. */
export function applyHumanMove(state: GameState, move: Move): GameState {
  return applyMove(state, move);
}

/** Compute the AI move for the current (AI) seat, without applying it. */
export function aiMove(state: GameState, rng: Rng): Move {
  return greedyPlayer(viewFor(state, state.current), rng);
}

/** Compute and apply one AI move in a single call. Test-only convenience; the hook uses
 *  `aiMove` + `applyMove` separately so it can detect a completed trick between the two. */
export function stepAi(state: GameState, rng: Rng): GameState {
  return applyMove(state, aiMove(state, rng));
}
