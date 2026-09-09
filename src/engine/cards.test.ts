import { describe, expect, it } from 'vitest';
import {
  cardId,
  cardPoints,
  compareCards,
  createDeck,
  deckPointTotal,
  isTrump,
  trumpStrength,
  type Card,
} from './cards.ts';

describe('deck composition', () => {
  it('has exactly 26 distinct cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(26);
    expect(new Set(deck.map(cardId)).size).toBe(26);
  });

  it('includes 7♦ and 8♦ but no 7/8 of other suits', () => {
    const deck = createDeck();
    const has = (c: Card) => deck.some((d) => d.suit === c.suit && d.rank === c.rank);
    expect(has({ suit: 'diamonds', rank: '7' })).toBe(true);
    expect(has({ suit: 'diamonds', rank: '8' })).toBe(true);
    for (const suit of ['clubs', 'spades', 'hearts'] as const) {
      expect(has({ suit, rank: '7' })).toBe(false);
      expect(has({ suit, rank: '8' })).toBe(false);
    }
  });

  it('has 14 trumps and 12 non-trumps', () => {
    const deck = createDeck();
    expect(deck.filter(isTrump)).toHaveLength(14);
    expect(deck.filter((c) => !isTrump(c))).toHaveLength(12);
  });
});

describe('card point values', () => {
  it('sums to 120 over the whole deck', () => {
    expect(deckPointTotal()).toBe(120);
  });

  it('scores individual ranks per rules §1', () => {
    expect(cardPoints({ suit: 'clubs', rank: 'A' })).toBe(11);
    expect(cardPoints({ suit: 'diamonds', rank: '10' })).toBe(10);
    expect(cardPoints({ suit: 'spades', rank: 'K' })).toBe(4);
    expect(cardPoints({ suit: 'hearts', rank: 'Q' })).toBe(3);
    expect(cardPoints({ suit: 'clubs', rank: 'J' })).toBe(2);
    expect(cardPoints({ suit: 'diamonds', rank: '9' })).toBe(0);
  });
});

describe('trump and suit ordering', () => {
  it('treats Q, J and all diamonds as trumps', () => {
    expect(isTrump({ suit: 'clubs', rank: 'Q' })).toBe(true);
    expect(isTrump({ suit: 'hearts', rank: 'J' })).toBe(true);
    expect(isTrump({ suit: 'diamonds', rank: '7' })).toBe(true);
    expect(isTrump({ suit: 'clubs', rank: 'A' })).toBe(false);
  });

  it('ranks the lowest trump above any non-trump', () => {
    const sevenDiamonds: Card = { suit: 'diamonds', rank: '7' };
    const aceClubs: Card = { suit: 'clubs', rank: 'A' };
    expect(compareCards(sevenDiamonds, aceClubs)).toBeGreaterThan(0);
  });

  it('ranks Q♣ above Q♦', () => {
    const qClubs: Card = { suit: 'clubs', rank: 'Q' };
    const qDiamonds: Card = { suit: 'diamonds', rank: 'Q' };
    expect(compareCards(qClubs, qDiamonds)).toBeGreaterThan(0);
    expect(trumpStrength(qClubs)).toBe(14);
    expect(trumpStrength({ suit: 'diamonds', rank: '7' })).toBe(1);
  });
});
