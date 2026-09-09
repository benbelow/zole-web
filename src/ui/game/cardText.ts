/**
 * Text/emoji rendering helpers for cards (design D4). No image assets: a card is its rank plus a
 * suit glyph (♣ ♠ ♥ ♦), red for hearts/diamonds, black for clubs/spades.
 */
import {
  isTrump,
  nonTrumpStrength,
  trumpStrength,
  type Card,
  type Rank,
  type Suit,
} from '../../engine/index.ts';

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

/** Display grouping for the sorted hand: all trumps first, then clubs, spades, hearts.
 *  (Every diamond is a trump, so the `diamonds` entry is never actually consulted.) */
const HAND_GROUP: Record<Suit, number> = { diamonds: 0, clubs: 1, spades: 2, hearts: 3 };

function handGroup(card: Card): number {
  return isTrump(card) ? 0 : HAND_GROUP[card.suit];
}

/**
 * Sort a hand into a natural, readable order: trumps first (strongest → weakest), then each side
 * suit grouped (clubs, spades, hearts), each descending by rank. Pure; returns a new array.
 */
export function sortHand(cards: readonly Card[]): Card[] {
  return cards.slice().sort((a, b) => {
    const ga = handGroup(a);
    const gb = handGroup(b);
    if (ga !== gb) return ga - gb;
    return isTrump(a)
      ? trumpStrength(b) - trumpStrength(a)
      : nonTrumpStrength(b) - nonTrumpStrength(a);
  });
}
