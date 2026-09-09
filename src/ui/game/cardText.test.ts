import { describe, expect, it } from 'vitest';
import { cardId, isTrump, type Card, type Suit } from '../../engine/index.ts';
import { SUIT_GLYPH, cardLabel, isRedSuit, sortHand } from './cardText.ts';

describe('cardLabel', () => {
  it('renders a red-suit card', () => {
    const card: Card = { rank: 'A', suit: 'hearts' };
    expect(cardLabel(card)).toBe('A♥');
  });

  it('renders a black-suit card', () => {
    const card: Card = { rank: 'K', suit: 'spades' };
    expect(cardLabel(card)).toBe('K♠');
  });

  it('renders a two-character rank', () => {
    const card: Card = { rank: '10', suit: 'diamonds' };
    expect(cardLabel(card)).toBe('10♦');
  });
});

describe('isRedSuit', () => {
  it('is true for hearts and diamonds', () => {
    expect(isRedSuit('hearts')).toBe(true);
    expect(isRedSuit('diamonds')).toBe(true);
  });

  it('is false for clubs and spades', () => {
    expect(isRedSuit('clubs')).toBe(false);
    expect(isRedSuit('spades')).toBe(false);
  });
});

describe('SUIT_GLYPH', () => {
  it('maps all four suits', () => {
    const suits: Suit[] = ['clubs', 'spades', 'hearts', 'diamonds'];
    for (const suit of suits) {
      expect(SUIT_GLYPH[suit]).toBeTruthy();
      expect(typeof SUIT_GLYPH[suit]).toBe('string');
    }
    expect(SUIT_GLYPH.clubs).toBe('♣');
    expect(SUIT_GLYPH.spades).toBe('♠');
    expect(SUIT_GLYPH.hearts).toBe('♥');
    expect(SUIT_GLYPH.diamonds).toBe('♦');
  });
});

describe('sortHand', () => {
  const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

  it('orders trumps first (strongest→weakest), then clubs, spades, hearts by rank', () => {
    const hand: Card[] = [
      c('9', 'hearts'),
      c('A', 'clubs'),
      c('Q', 'diamonds'), // trump
      c('7', 'diamonds'), // trump (weakest)
      c('K', 'spades'),
      c('Q', 'clubs'), // trump (strongest)
      c('A', 'hearts'),
    ];
    const sorted = sortHand(hand).map(cardId);
    expect(sorted).toEqual([
      cardId(c('Q', 'clubs')), // trumps first, strongest
      cardId(c('Q', 'diamonds')),
      cardId(c('7', 'diamonds')),
      cardId(c('A', 'clubs')), // clubs
      cardId(c('K', 'spades')), // spades
      cardId(c('A', 'hearts')), // hearts, A before 9
      cardId(c('9', 'hearts')),
    ]);
  });

  it('does not mutate its input and leads with a trump', () => {
    const hand: Card[] = [c('A', 'clubs'), c('J', 'hearts')];
    const copy = [...hand];
    const sorted = sortHand(hand);
    expect(hand).toEqual(copy);
    expect(isTrump(sorted[0]!)).toBe(true); // J♥ is a trump, sorts ahead of A♣
  });
});
