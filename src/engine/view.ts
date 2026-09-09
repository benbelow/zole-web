/**
 * Information-hiding boundary (design D3): `viewFor` projects the full `GameState` down to what a
 * single player is allowed to see — its own hand, the public trick, scores, and counts of others'
 * cards, but never opponents' faces, the stock, or the soloist's discard. AI strategies and the UI
 * consume `PlayerView`, never the raw state, so "a player can't cheat" is structural.
 */

import { legalMoves } from './round.ts';
import type {
  GameState,
  GameType,
  OpponentView,
  PlayerId,
  PlayerView,
  TrickCard,
} from './state.ts';

const PLAYER_IDS: readonly PlayerId[] = [0, 1, 2];

function gameTypeOf(state: GameState): GameType | null {
  if (state.phase === 'playing') return state.gameType;
  if (state.phase === 'discarding') return state.gameType;
  if (state.phase === 'roundEnd') return state.result.gameType;
  return null;
}

function soloistOf(state: GameState): PlayerId | null {
  if (state.phase === 'discarding') return state.soloist;
  if (state.phase === 'playing') return state.soloist;
  if (state.phase === 'roundEnd') return state.result.soloist;
  return null;
}

/** Redact `state` to the view for `me`. */
export function viewFor(state: GameState, me: PlayerId): PlayerView {
  const trick: readonly TrickCard[] = state.phase === 'playing' ? state.trick : [];
  const trickLeader = state.phase === 'playing' ? state.trickLeader : null;
  const passed = state.phase === 'bidding' ? state.passed : [];

  const opponents: OpponentView[] = PLAYER_IDS.filter((id) => id !== me).map((id) => ({
    id,
    handCount: state.players[id].hand.length,
    capturedCount: state.players[id].captured.length,
    tricksWon: state.players[id].tricksWon,
    gamePoints: state.players[id].gamePoints,
    hasPassed: passed.includes(id),
  }));

  return {
    me,
    phase: state.phase,
    hand: state.players[me].hand,
    gamePoints: state.players[me].gamePoints,
    zoleTreeBranches: state.zoleTreeBranches,
    dealer: state.dealer,
    current: state.current,
    gameType: gameTypeOf(state),
    soloist: soloistOf(state),
    trick,
    trickLeader,
    passed,
    opponents,
    legalMoves: state.current === me ? legalMoves(state) : [],
    result: state.phase === 'roundEnd' ? state.result : null,
  };
}
