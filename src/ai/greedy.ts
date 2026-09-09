/**
 * The baseline "greedy" Zole AI (rules §5): a deterministic heuristic with no lookahead.
 *
 * Depends on `engine` only and stays pure (randomness would arrive via the injected RNG, but the
 * heuristics are fully deterministic so it is not consumed). Every returned move is guaranteed to
 * be present in `view.legalMoves`.
 */
import {
  cardPoints,
  compareCards,
  isTrump,
  trumpStrength,
  wouldWin,
  type Card,
  type Move,
  type PlayerView,
  type Rng,
  type TrickCard,
} from '../engine/index.ts';
import type { Strategy } from './strategy.ts';

// ---------------------------------------------------------------------------
// Bidding (rules §5)
// ---------------------------------------------------------------------------

/** Non-trump aces that are the only card of their suit in hand. */
function countSingleAces(hand: readonly Card[]): number {
  let count = 0;
  for (const card of hand) {
    if (card.rank !== 'A' || isTrump(card)) continue;
    const suitCount = hand.filter((c) => c.suit === card.suit).length;
    if (suitCount === 1) count += 1;
  }
  return count;
}

function isTrumpAceOrTen(card: Card): boolean {
  return card.suit === 'diamonds' && (card.rank === 'A' || card.rank === '10');
}

function biddingValue(hand: readonly Card[]): number {
  const queens = hand.filter((c) => c.rank === 'Q').length;
  const jacks = hand.filter((c) => c.rank === 'J').length;
  const aceTen = hand.filter(isTrumpAceOrTen).length;
  return 3 * queens + 2 * jacks + aceTen;
}

function chooseBid(hand: readonly Card[]): 'pickup' | 'zole' | 'pass' {
  const trumps = hand.filter(isTrump).length;
  const singleAces = countSingleAces(hand);

  if (trumps + singleAces === 8) return 'zole';
  if (trumps >= 6) return 'pickup';

  const value = biddingValue(hand);
  if (trumps === 4 && singleAces > 1 && value > 8) return 'pickup';
  if (trumps === 5 && (value > 9 || (singleAces >= 1 && value >= 9))) return 'pickup';
  return 'pass';
}

// ---------------------------------------------------------------------------
// Discarding (rules §5)
// ---------------------------------------------------------------------------

/**
 * Rank two non-trump discard candidates: higher card points first, then a card whose suit has
 * fewer cards in hand (help void a suit), then `compareCards` ascending for full determinism.
 */
function discardCandidateCompare(a: Card, b: Card, hand: readonly Card[]): number {
  const byPoints = cardPoints(b) - cardPoints(a); // points DESC
  if (byPoints !== 0) return byPoints;

  const aSuitCount = hand.filter((c) => c.suit === a.suit).length;
  const bSuitCount = hand.filter((c) => c.suit === b.suit).length;
  if (aSuitCount !== bSuitCount) return aSuitCount - bSuitCount; // fewer cards first

  return compareCards(a, b); // weakest first
}

function chooseDiscard(hand: readonly Card[]): [Card, Card] {
  const nonTrumps = hand
    .filter((c) => !isTrump(c))
    .sort((a, b) => discardCandidateCompare(a, b, hand));

  const picks: Card[] = [...nonTrumps];

  if (picks.length < 2) {
    // Not enough non-trumps: fill with the lowest trumps (weakest trumpStrength first).
    const trumps = hand
      .filter(isTrump)
      .sort((a, b) => trumpStrength(a) - trumpStrength(b));
    for (const t of trumps) {
      if (picks.length >= 2) break;
      picks.push(t);
    }
  }

  const first = picks[0]!;
  const second = picks[1]!;
  return [first, second];
}

// ---------------------------------------------------------------------------
// Playing (rules §5 GreedyPlayer)
// ---------------------------------------------------------------------------

/** "Lowest" = fewest card points, tie-broken by `compareCards` ascending (weakest). */
function playCompare(a: Card, b: Card): number {
  const byPoints = cardPoints(a) - cardPoints(b);
  if (byPoints !== 0) return byPoints;
  return compareCards(a, b);
}

function choosePlay(view: PlayerView): Card {
  const candidates = view.legalMoves
    .filter((m): m is Extract<Move, { type: 'play' }> => m.type === 'play')
    .map((m) => m.card);

  // Galdiņš (no soloist): the goal is to take the FEWEST tricks, so minimise trick-taking
  // rather than winning.
  if (view.gameType === 'galdins') {
    return choosePlayGaldins(candidates, view.trick);
  }

  // 1. If it can win the trick, play the lowest (weakest by compareCards) winning card.
  const winning = candidates.filter((c) => wouldWin(c, view.trick));
  if (winning.length > 0) {
    return [...winning].sort(compareCards)[0]!;
  }

  // 2. Otherwise play the lowest legal card.
  return [...candidates].sort(playCompare)[0]!;
}

/**
 * Galdiņš play heuristic: duck tricks whenever possible.
 * - Leading: play the weakest card (least likely to win) by `compareCards`.
 * - Following: prefer legal cards that do NOT win the trick and shed the strongest such card
 *   (dumping strength safely). If forced to win (every legal card wins), take it as cheaply as
 *   possible with the weakest card.
 */
function choosePlayGaldins(candidates: readonly Card[], trick: readonly TrickCard[]): Card {
  const sortedByStrength = [...candidates].sort(compareCards); // weakest → strongest

  // Leading: play the weakest card.
  if (trick.length === 0) {
    return sortedByStrength[0]!;
  }

  // Following: prefer non-winning cards, playing the strongest of them.
  const nonWinning = sortedByStrength.filter((c) => !wouldWin(c, trick));
  if (nonWinning.length > 0) {
    return nonWinning[nonWinning.length - 1]!; // highest non-winning by compareCards
  }

  // Forced to win: take the trick as cheaply as possible (weakest card).
  return sortedByStrength[0]!;
}

// ---------------------------------------------------------------------------
// Strategy
// ---------------------------------------------------------------------------

/**
 * The baseline greedy strategy. Deterministic: given the same view it returns the same move
 * regardless of the RNG (which it does not consume).
 */
export const greedyPlayer: Strategy = (view: PlayerView, rng: Rng): Move => {
  void rng; // deterministic heuristic: the RNG is part of the contract but not consumed
  switch (view.phase) {
    case 'bidding':
      return { type: 'bid', action: chooseBid(view.hand) };
    case 'discarding':
      return { type: 'discard', cards: chooseDiscard(view.hand) };
    case 'playing':
      return { type: 'play', card: choosePlay(view) };
    case 'roundEnd':
      // No legal moves at round end; fall back to the first legal move if any is somehow present.
      break;
  }
  const fallback = view.legalMoves[0];
  if (fallback === undefined) {
    throw new Error(`greedyPlayer: no legal move available in phase "${view.phase}"`);
  }
  return fallback;
};
