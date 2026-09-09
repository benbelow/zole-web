/**
 * Zole AI players — decision heuristics for bidding and play.
 *
 * Depends on `engine` only. MUST stay pure (no React/DOM/I/O; randomness via injected RNG).
 * Implemented per the approved OpenSpec AI change against `docs/zole-rules.md` §5.
 *
 * This module is the AI layer's public surface; other layers import from here.
 */
export type { Strategy } from './strategy.ts';
export { greedyPlayer } from './greedy.ts';
