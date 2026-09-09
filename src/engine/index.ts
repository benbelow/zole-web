/**
 * Zole game engine — pure game logic (deck, tricks, scoring, state machine).
 *
 * MUST stay pure: no React, no DOM, no I/O, no ambient randomness. Implemented per the approved
 * OpenSpec change (see `openspec/changes/`) against the rules in `docs/zole-rules.md`.
 *
 * This module is the engine's public surface; other layers import from here, not from deep files.
 */

// Cards & ordering (rules §1–2)
export type { Suit, Rank, Card } from './cards.ts';
export {
  createDeck,
  cardId,
  sameCard,
  cardPoints,
  deckPointTotal,
  isTrump,
  trumpStrength,
  nonTrumpStrength,
  absoluteStrength,
  compareCards,
  NON_TRUMP_SUITS,
} from './cards.ts';

// RNG (rules §6)
export type { Rng } from './rng.ts';
export { createRng, shuffle } from './rng.ts';

// Trick resolution (rules §2–3)
export type { LedCategory } from './trick.ts';
export {
  ledCategory,
  inLedCategory,
  legalPlays,
  currentWinner,
  wouldWin,
  trickWinner,
} from './trick.ts';

// State model (design D1) & views (design D3)
export type {
  PlayerId,
  GameType,
  Phase,
  BidAction,
  TrickCard,
  PlayerState,
  RoundBase,
  BiddingState,
  DiscardingState,
  PlayingState,
  RoundEndState,
  GameState,
  Move,
  RoundResult,
  RoundCarryOver,
  OpponentView,
  PlayerView,
} from './state.ts';
export { initialCarryOver } from './state.ts';

// Round state machine (design D1)
export { dealRound, carryOverFromEnd, legalMoves, isLegal, applyMove } from './round.ts';

// Scoring (rules §4)
export { scoreRound } from './scoring.ts';

// Redacted player view (design D3)
export { viewFor } from './view.ts';
