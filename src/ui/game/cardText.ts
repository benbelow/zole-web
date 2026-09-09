/**
 * Text/emoji rendering helpers for cards (design D4). No image assets: a card is its rank plus a
 * suit glyph (♣ ♠ ♥ ♦), red for hearts/diamonds, black for clubs/spades.
 */
import type { Card, Rank, Suit } from '../../engine/index.ts';

export const SUIT_GLYPH: Record<Suit, string> = {
  clubs: '♣',
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
};

/** Display label for a rank (ranks already read well as-is; 10 stays "10"). */
export function rankLabel(rank: Rank): string {
  return rank;
}

/** True for the red suits (hearts, diamonds). */
export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

/** Compact human-readable label for a card, e.g. "A♠" or "10♦". */
export function cardLabel(card: Card): string {
  return `${rankLabel(card.rank)}${SUIT_GLYPH[card.suit]}`;
}
