/**
 * Trick mechanics for Zole (rules §2–3): led category, follow-suit legality, and trick winner.
 *
 * Pure functions only — no mutation of inputs, no React/DOM/I/O/randomness.
 */

import { isTrump, nonTrumpStrength, trumpStrength } from './cards.ts';
import type { Card, Suit } from './cards.ts';
import type { PlayerId, TrickCard } from './state.ts';

/** The category a trick is led in: 'trump' or one of the three non-trump suits. */
export type LedCategory = 'trump' | Suit;

/** The category a card leads with: 'trump' if it is a trump, otherwise its suit (rules §2–3). */
export function ledCategory(card: Card): LedCategory {
  return isTrump(card) ? 'trump' : card.suit;
}

/** True when `card` belongs to the led category `led`. */
export function inLedCategory(card: Card, led: LedCategory): boolean {
  return led === 'trump' ? isTrump(card) : !isTrump(card) && card.suit === led;
}

/**
 * Does `candidate` beat `incumbent` under the led category?
 *   - A trump always beats a non-trump.
 *   - Between two trumps, higher `trumpStrength` wins.
 *   - Between two non-trumps, `candidate` only wins if it is of the led suit AND has strictly
 *     higher `nonTrumpStrength`; an off-suit non-trump never wins.
 */
function beats(candidate: Card, incumbent: Card, led: LedCategory): boolean {
  const candTrump = isTrump(candidate);
  const incTrump = isTrump(incumbent);

  if (candTrump && incTrump) {
    return trumpStrength(candidate) > trumpStrength(incumbent);
  }
  if (candTrump) return true;
  if (incTrump) return false;

  // Both non-trumps: candidate can only win if it is of the led suit.
  if (led === 'trump') return false;
  if (candidate.suit !== led) return false;
  // Incumbent off the led suit cannot be winning; candidate of the led suit takes it.
  if (incumbent.suit !== led) return true;
  return nonTrumpStrength(candidate) > nonTrumpStrength(incumbent);
}

/**
 * The subset of `hand` that is legal to play now (rules §3):
 *   - Leading (empty trick) → the whole hand.
 *   - Otherwise, if the player holds any card of the led category they must play one of those;
 *     if void, they may play any card.
 */
export function legalPlays(hand: readonly Card[], trick: readonly TrickCard[]): Card[] {
  const first = trick[0];
  if (first === undefined) return [...hand];

  const led = ledCategory(first.card);
  const inCategory = hand.filter((c) => inLedCategory(c, led));
  return inCategory.length > 0 ? inCategory : [...hand];
}

/**
 * The strongest card played to the trick so far under its led category, or null if the trick is
 * empty. The led category is derived from the first card played.
 */
export function currentWinner(trick: readonly TrickCard[]): TrickCard | null {
  const first = trick[0];
  if (first === undefined) return null;

  const led = ledCategory(first.card);
  let best = first;
  for (let i = 1; i < trick.length; i++) {
    const played = trick[i];
    if (played !== undefined && beats(played.card, best.card, led)) best = played;
  }
  return best;
}

/**
 * Would playing `card` be strictly winning the trick right now? True on an empty trick (leading
 * always "wins" the still-empty trick).
 */
export function wouldWin(card: Card, trick: readonly TrickCard[]): boolean {
  const winner = currentWinner(trick);
  if (winner === null) return true;
  const led = ledCategory(winner.card);
  return beats(card, winner.card, led);
}

/** The player who wins a completed 3-card trick. Throws if the trick is not exactly 3 cards. */
export function trickWinner(trick: readonly TrickCard[]): PlayerId {
  if (trick.length !== 3) {
    throw new Error(`trickWinner requires a completed 3-card trick, got ${trick.length}`);
  }
  // currentWinner is non-null here because the trick is non-empty.
  return currentWinner(trick)!.by;
}
