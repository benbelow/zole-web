/**
 * The Zole 26-card deck, card identity, point values, and trump/suit ordering.
 *
 * Pure data + pure helpers only (rules §1–2). No React/DOM/I/O.
 */

export type Suit = 'clubs' | 'spades' | 'hearts' | 'diamonds';
export type Rank = '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  readonly suit: Suit;
  readonly rank: Rank;
}

/** The three non-trump suits, in a fixed order (used only for deterministic tie-breaks). */
export const NON_TRUMP_SUITS: readonly Suit[] = ['clubs', 'spades', 'hearts'];

/** A stable string key for a card — useful for Sets, Maps, and React keys. */
export function cardId(card: Card): string {
  return `${card.rank}${card.suit}`;
}

/** True when two cards are the same suit + rank. */
export function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

/** Card point values; the whole deck sums to 120 (rules §1). */
const POINTS: Record<Rank, number> = {
  A: 11,
  '10': 10,
  K: 4,
  Q: 3,
  J: 2,
  '9': 0,
  '8': 0,
  '7': 0,
};

export function cardPoints(card: Card): number {
  return POINTS[card.rank];
}

/**
 * The 14 trumps, strongest first (rules §2):
 *   Q♣ > Q♠ > Q♥ > Q♦ > J♣ > J♠ > J♥ > J♦ > A♦ > 10♦ > K♦ > 9♦ > 8♦ > 7♦
 */
const TRUMP_ORDER: readonly Card[] = [
  { rank: 'Q', suit: 'clubs' },
  { rank: 'Q', suit: 'spades' },
  { rank: 'Q', suit: 'hearts' },
  { rank: 'Q', suit: 'diamonds' },
  { rank: 'J', suit: 'clubs' },
  { rank: 'J', suit: 'spades' },
  { rank: 'J', suit: 'hearts' },
  { rank: 'J', suit: 'diamonds' },
  { rank: 'A', suit: 'diamonds' },
  { rank: '10', suit: 'diamonds' },
  { rank: 'K', suit: 'diamonds' },
  { rank: '9', suit: 'diamonds' },
  { rank: '8', suit: 'diamonds' },
  { rank: '7', suit: 'diamonds' },
];

/** trumpStrength: Q♣ = 14 (strongest) … 7♦ = 1 (weakest). 0 for non-trumps. */
const TRUMP_STRENGTH: ReadonlyMap<string, number> = new Map(
  TRUMP_ORDER.map((c, i) => [cardId(c), TRUMP_ORDER.length - i]),
);

/** Non-trump rank strength within a led suit: A > 10 > K > 9 (rules §2). */
const NON_TRUMP_STRENGTH: Partial<Record<Rank, number>> = {
  A: 4,
  '10': 3,
  K: 2,
  '9': 1,
};

/** A card is a trump iff it is a Queen, a Jack, or any diamond (rules §2). */
export function isTrump(card: Card): boolean {
  return card.rank === 'Q' || card.rank === 'J' || card.suit === 'diamonds';
}

/** Trump strength (1..14) for trumps, 0 for non-trumps. */
export function trumpStrength(card: Card): number {
  return TRUMP_STRENGTH.get(cardId(card)) ?? 0;
}

/** Non-trump strength (1..4) within its suit, 0 for trumps. */
export function nonTrumpStrength(card: Card): number {
  if (isTrump(card)) return 0;
  return NON_TRUMP_STRENGTH[card.rank] ?? 0;
}

/**
 * Absolute strength usable for sorting/selection independent of the led suit:
 * every trump outranks every non-trump; trumps ordered by the trump table; non-trumps ordered by
 * their rank (A>10>K>9). This is NOT the trick-winner rule (that depends on the led suit — see
 * `trick.ts`); it is a total order for "lowest/highest card" selection.
 */
export function absoluteStrength(card: Card): number {
  return isTrump(card) ? 100 + trumpStrength(card) : nonTrumpStrength(card);
}

const SUIT_INDEX: Record<Suit, number> = { clubs: 0, spades: 1, hearts: 2, diamonds: 3 };

/**
 * Total, deterministic comparator by absolute strength (see `absoluteStrength`), breaking exact
 * ties (same rank, different non-trump suit) by a fixed suit order. Negative when `a` is weaker.
 */
export function compareCards(a: Card, b: Card): number {
  const byStrength = absoluteStrength(a) - absoluteStrength(b);
  if (byStrength !== 0) return byStrength;
  return SUIT_INDEX[a.suit] - SUIT_INDEX[b.suit];
}

const ALL_SUITS: readonly Suit[] = ['clubs', 'spades', 'hearts', 'diamonds'];
const NON_DIAMOND_RANKS: readonly Rank[] = ['9', '10', 'K', 'A', 'Q', 'J'];
const DIAMOND_RANKS: readonly Rank[] = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/** The full 26-card Zole deck in a fixed (unshuffled) order (rules §1). */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    const ranks = suit === 'diamonds' ? DIAMOND_RANKS : NON_DIAMOND_RANKS;
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/** Sum of all card point values in a fresh deck (must be 120). */
export function deckPointTotal(): number {
  return createDeck().reduce((sum, c) => sum + cardPoints(c), 0);
}
