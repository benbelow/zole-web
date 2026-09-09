/**
 * The strategy contract for a Zole AI player.
 *
 * A `Strategy` maps a redacted `PlayerView` (plus an injected RNG for any randomness) to a single
 * `Move`. Implementations MUST stay pure (no React/DOM/I/O; randomness only via the RNG) and MUST
 * return a move that is present in `view.legalMoves`.
 */
import type { Move, PlayerView, Rng } from '../engine/index.ts';

export type Strategy = (view: PlayerView, rng: Rng) => Move;
